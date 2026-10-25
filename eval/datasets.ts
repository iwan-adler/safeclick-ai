/**
 * Public datasets used for evaluation and model training.
 *
 * Each dataset is downloaded on first use into eval/.data (git-ignored) and
 * is never redistributed with SafeClick. Reports only print aggregate numbers
 * for real-world messages, never the messages themselves.
 *
 *  - UCI SMS Spam Collection: Almeida, T. A. & Hidalgo, J. M. G. (2011). CC BY 4.0.
 *    https://archive.ics.uci.edu/dataset/228/sms+spam+collection
 *  - SMS Phishing Dataset for Machine Learning and Pattern Recognition:
 *    Mishra, S. & Soni, D. (2022), Mendeley Data, doi:10.17632/f45bkkt8pr.1. CC BY 4.0.
 *  - Hinglish & English Financial Scam/Fraud Text Dataset: Bolewar, A. (2026),
 *    Hugging Face bolewara/hinglish-scam-text-dataset. CC BY 4.0.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const DATA_DIR = fileURLToPath(new URL("./.data", import.meta.url));

export type DatasetLabel = "scam" | "spam" | "ham";

export interface DatasetMessage {
  source: "uci" | "mendeley" | "hinglish";
  label: DatasetLabel;
  /** Cleaned text used for analysis and training. */
  text: string;
  /**
   * Key used for de-duplication and the dev/test split. Computed from the
   * text exactly as first loaded (before cleaning), so cleaning never moves a
   * message between dev and test.
   */
  splitKey: string;
}

/** Placeholders the UCI authors used to anonymize messages, replaced with neutral equivalents. */
const PLACEHOLDERS: [RegExp, string][] = [
  [/&lt;#&gt;/g, "2"],
  [/&lt;DECIMAL&gt;/gi, "2.5"],
  [/&lt;TIME&gt;/gi, "10:30"],
  [/&lt;EMAIL&gt;/gi, "name@mail.example"],
  [/&lt;URL&gt;/gi, "www.site.example"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&amp;/g, "&"],
];

/** Removes dataset artifacts (anonymization placeholders, HTML entities) that real messages never contain. */
export function cleanDatasetText(text: string): string {
  let out = text;
  for (const [pattern, value] of PLACEHOLDERS) out = out.replace(pattern, value);
  return out.replace(/\s+/g, " ").trim();
}

export const SOURCES = {
  uci: "https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip",
  mendeley:
    "https://data.mendeley.com/public-files/datasets/f45bkkt8pr/files/edb361de-918d-469f-9106-e84823830665/file_downloaded",
  hinglish: "https://huggingface.co/datasets/bolewara/hinglish-scam-text-dataset/resolve/main/data.json",
} as const;

/** Extracts one file from a zip archive (stored or deflate) using the central directory. */
export function extractFromZip(zip: Buffer, name: string): Buffer {
  let eocd = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65_557); i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a zip file");
  const entries = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  for (let n = 0; n < entries; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error("Corrupt central directory");
    const method = zip.readUInt16LE(p + 10);
    const compressedSize = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    const localOffset = zip.readUInt32LE(p + 42);
    const entryName = zip.subarray(p + 46, p + 46 + nameLen).toString("utf8");
    if (entryName === name) {
      const start = localOffset + 30 + zip.readUInt16LE(localOffset + 26) + zip.readUInt16LE(localOffset + 28);
      const data = zip.subarray(start, start + compressedSize);
      if (method === 0) return Buffer.from(data);
      if (method === 8) return inflateRawSync(data);
      throw new Error(`Unsupported zip compression method ${method}`);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${name} not found in zip`);
}

/** Minimal RFC 4180 CSV parser: quoted fields, doubled quotes, newlines inside quotes. */
export function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (quoted) {
      if (c === '"') {
        if (raw[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function cached(file: string, download: () => Promise<Buffer>): Promise<Buffer> {
  const path = join(DATA_DIR, file);
  if (!existsSync(path)) {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(path, await download());
  }
  return readFileSync(path);
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function loadUci(): Promise<DatasetMessage[]> {
  const file = await cached("SMSSpamCollection", async () => extractFromZip(await fetchBuffer(SOURCES.uci), "SMSSpamCollection"));
  return file
    .toString("utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf("\t");
      const label = line.slice(0, tab);
      if (label !== "spam" && label !== "ham") throw new Error(`Unexpected UCI label: ${label}`);
      const raw = line.slice(tab + 1);
      return { source: "uci", label, text: cleanDatasetText(raw), splitKey: normalizeText(raw) };
    });
}

export async function loadMendeley(): Promise<DatasetMessage[]> {
  const file = await cached("Dataset_5971.csv", async () => extractFromZip(await fetchBuffer(SOURCES.mendeley), "Dataset_5971.csv"));
  // The file is UTF-8. Split keys come from a latin1 decode because that is
  // how the dev/test split was first computed (see PROTOCOL.md); the
  // analysed text uses the correct UTF-8 decode.
  const keyRows = parseCsv(file.toString("latin1")).slice(1);
  const textRows = parseCsv(file.toString("utf8")).slice(1);
  if (keyRows.length !== textRows.length) throw new Error("Mendeley decode mismatch");
  return keyRows
    .map((r, i) => [r, textRows[i]] as const)
    .filter(([r]) => r.length >= 2 && r[1].trim())
    .map(([r, t]) => {
      const raw = r[0].trim().toLowerCase();
      const label: DatasetLabel = raw === "smishing" ? "scam" : raw === "spam" ? "spam" : "ham";
      if (!["smishing", "spam", "ham"].includes(raw)) throw new Error(`Unexpected Mendeley label: ${r[0]}`);
      return { source: "mendeley", label, text: cleanDatasetText(t[1]), splitKey: normalizeText(r[1].trim()) };
    });
}

/**
 * Hinglish dataset. Most rows are copied from UCI, so only rows that do not
 * appear in UCI are kept: these were written by the dataset author and form
 * an independent, India-specific test set.
 */
export async function loadHinglishOriginals(uci: DatasetMessage[]): Promise<DatasetMessage[]> {
  const file = await cached("hinglish.json", () => fetchBuffer(SOURCES.hinglish));
  const json = JSON.parse(file.toString("utf8")) as { rows?: { text: string; label: number }[] } | { text: string; label: number }[];
  const rows = Array.isArray(json) ? json : (json.rows ?? []);
  const inUci = new Set(uci.map((m) => m.splitKey));
  return rows
    .filter((r) => !inUci.has(normalizeText(String(r.text))))
    .map((r) => ({
      source: "hinglish",
      label: r.label === 1 ? "scam" : "ham",
      text: cleanDatasetText(String(r.text)),
      splitKey: normalizeText(String(r.text).trim()),
    }));
}

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

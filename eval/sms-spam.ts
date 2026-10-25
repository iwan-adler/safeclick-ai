/**
 * Loads the UCI SMS Spam Collection (Almeida & Hidalgo, 2011; CC BY 4.0).
 * https://archive.ics.uci.edu/dataset/228/sms+spam+collection
 *
 * The dataset is downloaded on first run into eval/.data (git-ignored) and
 * is not redistributed with SafeClick. Individual messages are never printed
 * in reports, only aggregate numbers.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

export const SMS_SPAM_URL = "https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip";
const DATA_DIR = fileURLToPath(new URL("./.data", import.meta.url));
const FILE = join(DATA_DIR, "SMSSpamCollection");

export interface SmsMessage {
  label: "spam" | "ham";
  text: string;
}

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
      const localNameLen = zip.readUInt16LE(localOffset + 26);
      const localExtraLen = zip.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + localNameLen + localExtraLen;
      const data = zip.subarray(start, start + compressedSize);
      if (method === 0) return Buffer.from(data);
      if (method === 8) return inflateRawSync(data);
      throw new Error(`Unsupported zip compression method ${method}`);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${name} not found in zip`);
}

export function parseCollection(raw: string): SmsMessage[] {
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf("\t");
      const label = line.slice(0, tab);
      if (label !== "spam" && label !== "ham") throw new Error(`Unexpected label: ${label}`);
      return { label, text: line.slice(tab + 1) };
    });
}

export async function loadSmsSpam(): Promise<SmsMessage[]> {
  if (!existsSync(FILE)) {
    const res = await fetch(SMS_SPAM_URL);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const zip = Buffer.from(await res.arrayBuffer());
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(FILE, extractFromZip(zip, "SMSSpamCollection"));
  }
  return parseCollection(readFileSync(FILE, "utf8"));
}

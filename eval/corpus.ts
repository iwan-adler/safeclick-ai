/**
 * Builds the evaluation corpus with a fixed development/test split.
 *
 * Protocol (see eval/PROTOCOL.md):
 *  - Real-world pool = Mendeley smishing dataset + UCI SMS Spam Collection,
 *    de-duplicated on normalized text (a text labelled differently by the two
 *    sources keeps the "scam" label if either source says smishing).
 *  - Each unique text is assigned to "dev" or "test" by a stable hash, so the
 *    split never changes between runs or machines.
 *  - Rules may be tuned, and the classifier trained, on dev only.
 *  - Test is reported, never inspected message-by-message.
 */
import { createHash } from "node:crypto";
import { loadHinglishOriginals, loadMendeley, loadUci, type DatasetLabel, type DatasetMessage } from "./datasets";

export type Split = "dev" | "test";

export interface CorpusMessage {
  key: string;
  label: DatasetLabel;
  text: string;
  sources: DatasetMessage["source"][];
  split: Split;
}

/** 50/50 split by SHA-256 of the normalized text. */
export function splitFor(normalized: string): Split {
  return createHash("sha256").update(normalized).digest()[0] % 2 === 0 ? "dev" : "test";
}

const RANK: Record<DatasetLabel, number> = { scam: 2, spam: 1, ham: 0 };

export function buildPool(messages: DatasetMessage[]): CorpusMessage[] {
  const byKey = new Map<string, CorpusMessage>();
  for (const m of messages) {
    const key = m.splitKey;
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { key, label: m.label, text: m.text, sources: [m.source], split: splitFor(key) });
    } else {
      if (!existing.sources.includes(m.source)) existing.sources.push(m.source);
      if (RANK[m.label] > RANK[existing.label]) existing.label = m.label;
    }
  }
  return [...byKey.values()];
}

export interface Corpus {
  dev: CorpusMessage[];
  test: CorpusMessage[];
  /** Test messages with no near-duplicate in dev (protocol amendment 1). */
  testUnique: CorpusMessage[];
  /** Independent India-focused set; never used for tuning or training. */
  india: CorpusMessage[];
}

export async function loadCorpus(): Promise<Corpus> {
  const uci = await loadUci();
  const mendeley = await loadMendeley();
  const pool = buildPool([...mendeley, ...uci]);
  const poolKeys = new Set(pool.map((m) => m.key));
  const india = buildPool(await loadHinglishOriginals(uci))
    // Guard against any overlap with the training pool.
    .filter((m) => !poolKeys.has(m.key));
  const dev = pool.filter((m) => m.split === "dev");
  const test = pool.filter((m) => m.split === "test");
  return { dev, test, testUnique: withoutNearDuplicates(test, dev), india };
}

const wordSet = (key: string) => new Set(key.split(" ").filter((w) => w.length >= 2 && !/^\d+$/.test(w)));

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Drops messages that are near-duplicates of any reference message: same
 * text once digits are removed, or word-set Jaccard similarity >= threshold.
 */
export function withoutNearDuplicates(items: CorpusMessage[], reference: CorpusMessage[], threshold = 0.7): CorpusMessage[] {
  const noDigits = (k: string) => k.replace(/\d+/g, "").replace(/\s+/g, " ").trim();
  const refKeys = new Set(reference.map((r) => noDigits(r.key)));
  const refSets = reference.map((r) => wordSet(r.key));
  return items.filter((m) => {
    if (refKeys.has(noDigits(m.key))) return false;
    const words = wordSet(m.key);
    return !refSets.some((r) => Math.min(r.size, words.size) / Math.max(r.size, words.size, 1) >= threshold && jaccard(r, words) >= threshold);
  });
}

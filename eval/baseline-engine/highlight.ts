import type { Signal } from "./types";

export interface TextSegment {
  text: string;
  start: number;
  /** Ids of signals whose evidence covers this segment (empty = plain text). */
  signalIds: string[];
}

/**
 * Splits a message into plain-text segments, marking which signals cover
 * each part. The UI renders these as React text nodes (never as HTML), so
 * user content cannot inject markup.
 */
export function segmentMessage(text: string, signals: Signal[]): TextSegment[] {
  const spans = signals.flatMap((s) =>
    s.evidence.map((e) => ({ start: e.start, end: Math.min(e.end, text.length), id: s.id })),
  );
  const cuts = new Set<number>([0, text.length]);
  for (const s of spans) {
    cuts.add(s.start);
    cuts.add(s.end);
  }
  const points = [...cuts].filter((p) => p >= 0 && p <= text.length).sort((a, b) => a - b);

  const segments: TextSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (start === end) continue;
    const ids = [...new Set(spans.filter((s) => s.start <= start && s.end >= end).map((s) => s.id))];
    const prev = segments[segments.length - 1];
    // Merge neighbours with identical coverage to keep the DOM small.
    if (prev && prev.signalIds.join() === ids.join()) {
      prev.text += text.slice(start, end);
    } else {
      segments.push({ text: text.slice(start, end), start, signalIds: ids });
    }
  }
  return segments;
}

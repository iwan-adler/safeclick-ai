export interface SharedFields {
  title: string;
  text: string;
  url: string;
}

/** Joins shared fields, skipping blanks and duplicates (apps often repeat the URL inside the text). */
export function combineShared(p: SharedFields): string {
  const parts: string[] = [];
  for (const part of [p.title, p.text, p.url].map((s) => (s ?? "").trim())) {
    if (part && !parts.some((existing) => existing.includes(part))) parts.push(part);
  }
  return parts.join("\n");
}

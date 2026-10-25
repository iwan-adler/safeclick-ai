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

export interface SharePayload extends SharedFields {
  image: File | null;
}

/**
 * Asks the service worker for content shared into the app (see the share
 * target in app/manifest.ts and public/sw.js). Resolves null after 3 seconds
 * or if nothing is waiting. Browser only.
 */
export function requestShare(): Promise<SharePayload | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 3000);
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "SHARE") return;
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("message", onMessage);
      resolve(event.data.payload ?? null);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.ready.then((reg) => (navigator.serviceWorker.controller ?? reg.active)?.postMessage({ type: "GET_SHARE" }));
  });
}

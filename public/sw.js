/*
 * SafeClick AI service worker.
 *
 * Purpose: keep the app's pages (especially the Safety Guide) usable after a
 * first visit when the network is unavailable.
 *
 * What it caches: the app's own HTML pages and static build assets (scripts,
 * styles, fonts), plus the screenshot reader files under /ocr after first use. It never sees or caches message text: analysis happens in
 * page memory and makes no network requests.
 *
 * Strategy:
 *  - Pages: network first (so updates arrive), falling back to the cache.
 *  - /_next/static assets: cache first (file names are content-hashed).
 *  - /ocr files (about 7 MB): cache first, stored only once someone uses
 *    screenshot reading, so they are not downloaded up front.
 *  - POST /share (from the installed app's share sheet): read on the device,
 *    kept in this worker's memory for up to a minute, and handed to the page
 *    once via postMessage. It is never written to a cache or sent anywhere.
 *  - Bump CACHE_VERSION to discard old caches on the next activation.
 */
const CACHE_VERSION = "safeclick-v6";
const PAGES = ["/", "/simple", "/help", "/examples", "/learn", "/guide", "/privacy"];
const ASSET_PATTERN = /\/_next\/static\/[^"'\s)]+/g;

async function precache() {
  const cache = await caches.open(CACHE_VERSION);
  const assets = new Set();
  assets.add("/theme-init.js");
  for (const page of PAGES) {
    try {
      const res = await fetch(page, { cache: "no-cache" });
      if (!res.ok) continue;
      const html = await res.clone().text();
      await cache.put(page, res);
      for (const match of html.matchAll(ASSET_PATTERN)) assets.add(match[0]);
    } catch {
      // Ignore: a page that fails now will be cached on a later visit.
    }
  }
  // Cache each asset individually so one failure does not abort the rest.
  await Promise.all(
    [...assets].map((url) =>
      fetch(url)
        .then((res) => (res.ok ? cache.put(url, res) : undefined))
        .catch(() => undefined),
    ),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Most recent share, held in memory only. */
let pendingShare = null;
const SHARE_TTL_MS = 60_000;

async function receiveShare(request) {
  try {
    const form = await request.formData();
    const field = (name) => (typeof form.get(name) === "string" ? form.get(name).slice(0, 5000) : "");
    const image = form.get("image");
    pendingShare = {
      title: field("title"),
      text: field("text"),
      url: field("url"),
      image: image instanceof File && image.size > 0 ? image : null,
      at: Date.now(),
    };
    return Response.redirect("/?shared=1", 303);
  } catch {
    return Response.redirect("/?shared=unavailable", 303);
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type !== "GET_SHARE" || !event.source) return;
  const fresh = pendingShare && Date.now() - pendingShare.at < SHARE_TTL_MS ? pendingShare : null;
  pendingShare = null;
  event.source.postMessage({ type: "SHARE", payload: fresh });
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.method === "POST" && url.pathname === "/share") {
    event.respondWith(receiveShare(request));
    return;
  }
  if (request.method !== "GET") return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/ocr/") || url.pathname === "/theme-init.js") {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && PAGES.includes(url.pathname)) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = (await caches.match(url.pathname)) || (await caches.match("/guide"));
          return (
            cached ||
            new Response("SafeClick AI is offline and this page has not been saved yet.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }),
    );
  }
});

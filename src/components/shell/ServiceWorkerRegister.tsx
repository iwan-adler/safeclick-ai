"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker in production builds only, so that
 * development hot-reloading is never served from a stale cache.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Offline support is optional; the app works normally without it.
    });
  }, []);
  return null;
}

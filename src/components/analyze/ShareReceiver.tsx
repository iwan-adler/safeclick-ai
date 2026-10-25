"use client";

import { Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { combineShared, type SharedFields } from "@/lib/share";
import { useAnalyzer } from "./AnalyzerProvider";

interface SharePayload extends SharedFields {
  image: File | null;
}

type Notice = { tone: "ok" | "warn"; text: string } | null;

function requestShare(): Promise<SharePayload | null> {
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

/**
 * Picks up content shared to SafeClick from another app (see the share
 * target in app/manifest.ts). The content arrives from the service worker on
 * this device, fills the input, and is never analyzed automatically: the
 * person reviews it first.
 */
export function ShareReceiver() {
  const { setMessage, setMode, screenshot } = useAnalyzer();
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("shared");
    if (!shared) return;
    // Remove the flag so a reload does not try again.
    window.history.replaceState(null, "", window.location.pathname);

    const available = shared === "1" && "serviceWorker" in navigator;
    let active = true;
    (available ? requestShare() : Promise.resolve(null)).then((payload) => {
      if (!active) return;
      if (!payload || (!payload.image && !combineShared(payload))) {
        setNotice({ tone: "warn", text: "The shared content didn't come through. You can paste it or add a screenshot instead." });
        return;
      }
      setMode("message");
      if (payload.image) {
        void screenshot.read(payload.image);
        setNotice({ tone: "ok", text: "Screenshot received. Check the text it reads, then press Analyze." });
      } else {
        setMessage(combineShared(payload));
        setNotice({ tone: "ok", text: "Shared message received. Review it, then press Analyze." });
      }
    });
    return () => {
      active = false;
    };
    // Runs once on arrival; the analyzer callbacks are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!notice) return null;
  return (
    <div
      role="status"
      className={
        "mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13.5px] animate-fade-up " +
        (notice.tone === "ok" ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100" : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100")
      }
    >
      <Share2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">{notice.text}</p>
      <button type="button" onClick={() => setNotice(null)} className="rounded p-0.5 hover:bg-black/5">
        <X aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}

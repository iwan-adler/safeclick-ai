"use client";

/**
 * Senior-mode preferences, saved only in this browser (localStorage):
 * whether the app opens in simple mode, its language, and one family contact
 * for the "call" button. Messages are never stored.
 */
import { useSyncExternalStore } from "react";
import type { SimpleLanguage } from "./verdict";

export interface SimplePrefs {
  /** Open simple mode whenever the app starts on this phone. */
  enabled: boolean;
  language: SimpleLanguage;
  contactName: string;
  contactPhone: string;
}

export const DEFAULT_PREFS: SimplePrefs = { enabled: false, language: "hi", contactName: "", contactPhone: "" };

const KEY = "safeclick-simple";
const EVENT = "safeclick-simple-change";

let cachedRaw: string | null | undefined;
let cachedPrefs: SimplePrefs = DEFAULT_PREFS;

/** Returns the same object until the stored value changes (required by useSyncExternalStore). */
export function readPrefs(): SimplePrefs {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedPrefs;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<SimplePrefs>) : {};
    cachedPrefs = {
      enabled: parsed.enabled === true,
      language: parsed.language === "en" ? "en" : "hi",
      contactName: typeof parsed.contactName === "string" ? parsed.contactName.slice(0, 40) : "",
      contactPhone: typeof parsed.contactPhone === "string" ? parsed.contactPhone.slice(0, 20) : "",
    };
  } catch {
    cachedPrefs = DEFAULT_PREFS;
  }
  return cachedPrefs;
}

export function savePrefs(update: Partial<SimplePrefs>) {
  const next = { ...readPrefs(), ...update };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the choice applies only until reload.
    cachedRaw = JSON.stringify(next);
    cachedPrefs = next;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useSimplePrefs(): SimplePrefs {
  return useSyncExternalStore(subscribe, readPrefs, () => DEFAULT_PREFS);
}

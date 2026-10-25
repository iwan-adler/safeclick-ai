"use client";

/**
 * Read-aloud with the phone's built-in voices (Web Speech API).
 * Only fixed verdict phrases are spoken, never the message being checked,
 * so nothing private reaches a speech engine even where a voice is
 * network-backed.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { SimpleLanguage } from "./verdict";

function pickVoice(language: SimpleLanguage): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const prefix = language === "hi" ? "hi" : "en-in";
  const matches = voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(prefix));
  // Prefer voices that run on the device.
  return matches.find((v) => v.localService) ?? matches[0] ?? (language === "en" ? voices.find((v) => v.lang.startsWith("en")) : undefined);
}

const noopSubscribe = () => () => {};

export function useSpeech(language: SimpleLanguage) {
  const supported = useSyncExternalStore(noopSubscribe, () => "speechSynthesis" in window, () => false);
  const [speaking, setSpeaking] = useState(false);

  // Stop talking when the screen goes away.
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language === "hi" ? "hi-IN" : "en-IN";
      const voice = pickVoice(language);
      if (voice) u.voice = voice;
      u.rate = 0.9;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    [language],
  );

  return { supported, speaking, speak, stop };
}

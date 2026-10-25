"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { analyzeMessage, type AnalysisMode, type AnalysisOutcome } from "@/lib/analysis";
import { useScreenshotReader } from "./useScreenshotReader";

/**
 * Holds the current message and result in React memory only.
 * Nothing here is written to localStorage, cookies or any server, so the
 * message disappears when the tab is closed or reloaded.
 */

type Status = "idle" | "scanning" | "done";

interface AnalyzerState {
  message: string;
  setMessage: (value: string) => void;
  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;
  outcome: AnalysisOutcome | null;
  /** The exact text the current outcome was computed from. */
  analyzedText: string;
  status: Status;
  /** Increments on every analysis so result views can reset local UI state. */
  runId: number;
  /** Sets the message to `text` and analyzes it (optionally switching mode). */
  analyze: (text: string, mode?: AnalysisMode) => void;
  clear: () => void;
  /** Screenshot-to-text reader; fills `message` when done. */
  screenshot: ReturnType<typeof useScreenshotReader>;
}

const AnalyzerContext = createContext<AnalyzerState | null>(null);

/** Brief, purposeful scan animation. Not used to fake "AI thinking". */
const SCAN_MS = 420;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AnalyzerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<AnalysisMode>("message");
  const [outcome, setOutcome] = useState<AnalysisOutcome | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [analyzedText, setAnalyzedText] = useState("");
  const [runId, setRunId] = useState(0);
  const screenshot = useScreenshotReader(setMessage);
  const resetScreenshot = screenshot.reset;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Read the latest mode inside the stable `analyze` callback.
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const analyze = useCallback((input: string, nextMode?: AnalysisMode) => {
    setMessage(input);
    if (nextMode) setMode(nextMode);
    if (timer.current) clearTimeout(timer.current);
    // Analysis itself is synchronous and instant; only the reveal is delayed.
    const result = analyzeMessage(input, { mode: nextMode ?? modeRef.current });
    if (!result.ok) {
      setOutcome(result);
      setStatus("done");
      return;
    }
    setStatus("scanning");
    const finish = () => {
      setAnalyzedText(input);
      setOutcome(result);
      setStatus("done");
      setRunId((n) => n + 1);
    };
    if (prefersReducedMotion()) finish();
    else timer.current = setTimeout(finish, SCAN_MS);
  }, []);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setMessage("");
    setOutcome(null);
    setAnalyzedText("");
    setStatus("idle");
    resetScreenshot();
  }, [resetScreenshot]);

  const value = useMemo(
    () => ({ message, setMessage, mode, setMode, outcome, analyzedText, status, runId, analyze, clear, screenshot }),
    [message, mode, outcome, analyzedText, status, runId, analyze, clear, screenshot],
  );

  return <AnalyzerContext.Provider value={value}>{children}</AnalyzerContext.Provider>;
}

export function useAnalyzer(): AnalyzerState {
  const ctx = useContext(AnalyzerContext);
  if (!ctx) throw new Error("useAnalyzer must be used inside <AnalyzerProvider>");
  return ctx;
}

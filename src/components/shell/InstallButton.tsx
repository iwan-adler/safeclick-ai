"use client";

import { MonitorDown } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../ui/primitives";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * "Install app" button. Only rendered when the browser reports SafeClick
 * can be installed (Chromium's beforeinstallprompt), so it never appears as
 * a button that does nothing.
 */
export function InstallButton({ className }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!promptEvent) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await promptEvent.prompt();
        await promptEvent.userChoice;
        setPromptEvent(null);
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl bg-[#2f54eb] px-3 py-2.5 text-left text-[13px] font-medium text-white hover:bg-[#2343c9]",
        className,
      )}
    >
      <MonitorDown aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="flex flex-col">
        Install SafeClick
        <span className="text-[11px] font-normal text-white/80">Share messages to it from other apps</span>
      </span>
    </button>
  );
}

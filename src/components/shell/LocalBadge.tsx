"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../ui/primitives";

/**
 * "Local analysis" status pill. The explanation is exposed as an accessible
 * description and shown on hover, focus, or tap.
 */
export function LocalBadge({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={ref} className="group relative">
      <button
        type="button"
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors",
          variant === "dark"
            ? "bg-white/[0.06] text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/10"
            : "bg-mint-50 text-mint-700 ring-1 ring-inset ring-mint-100 hover:bg-mint-100",
        )}
      >
        <span className="h-2 w-2 rounded-full bg-mint-500 animate-pulse-dot" aria-hidden="true" />
        Local analysis
      </button>
      <div
        id={id}
        role="tooltip"
        className={cn(
          "absolute z-50 w-64 rounded-xl bg-navy-900 p-3 text-xs leading-relaxed text-slate-200 shadow-[var(--shadow-raised)] ring-1 ring-white/10 transition-opacity duration-150",
          variant === "dark" ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2",
          open ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
        )}
      >
        Messages are checked by rules that run in your browser. Your text is not uploaded, stored, or sent to an AI
        service, and links are never opened.
      </div>
    </div>
  );
}

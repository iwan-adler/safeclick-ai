"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "./primitives";

export function Disclosure({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="border-b border-line last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-ink hover:bg-sunken/50"
        >
          {title}
          <ChevronDown aria-hidden="true" className={cn("h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-200", open && "rotate-180")} />
        </button>
      </h3>
      <div id={id} hidden={!open} className="space-y-3 px-5 pb-5 text-[14px] leading-relaxed text-ink-muted animate-fade-in">
        {children}
      </div>
    </div>
  );
}

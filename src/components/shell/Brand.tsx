import { cn } from "../ui/primitives";

/** SafeClick mark: a cursor paused mid-click, drawn in a rounded tile. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-8 w-8 shrink-0", className)}>
      {/* Solid fills only: an SVG gradient id would be duplicated between the
          desktop sidebar and mobile header, and break when one is hidden. */}
      <rect width="32" height="32" rx="9" fill="#2f54eb" />
      <path d="M9 0h14a9 9 0 0 1 9 9v7H0V9a9 9 0 0 1 9-9z" fill="#4a6bff" opacity="0.55" />
      <path d="M10 8.5 L10 22 L13.4 18.8 L15.9 24 L18.2 23 L15.7 17.9 L20.4 17.6 Z" fill="#fff" strokeLinejoin="round" />
      <rect x="21.2" y="8.5" width="1.9" height="6" rx="0.95" fill="#c5d0ff" />
      <rect x="24.4" y="8.5" width="1.9" height="6" rx="0.95" fill="#c5d0ff" />
    </svg>
  );
}

export function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="flex flex-col leading-none">
        <span className={cn("text-[15px] font-semibold tracking-[-0.01em]", inverted ? "text-white" : "text-ink")}>
          SafeClick <span className={inverted ? "text-[#c5d0ff]" : "text-brand-600"}>AI</span>
        </span>
        <span className={cn("mt-1 text-[11px]", inverted ? "text-slate-400" : "text-ink-subtle")}>
          Pause. Understand. Stay Safe.
        </span>
      </span>
    </span>
  );
}

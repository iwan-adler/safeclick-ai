import { CircleCheck, Link2Off, TriangleAlert } from "lucide-react";
import type { UrlReport } from "@/lib/analysis";

/** Links are displayed as plain text only, never as clickable anchors. */
export function LinkReport({ urls }: { urls: UrlReport[] }) {
  if (urls.length === 0) return null;
  return (
    <section aria-labelledby="links-title" className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="links-title" className="text-[15px] font-semibold text-ink">
          Links in this message <span className="font-normal text-ink-subtle">({urls.length})</span>
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-subtle">
          <Link2Off aria-hidden="true" className="h-3.5 w-3.5" /> Never opened
        </span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {urls.map((u) => (
          <li key={u.start} className="rounded-xl border border-line p-3">
            <p className="font-mono text-[12.5px] text-ink [overflow-wrap:anywhere]">{u.raw}</p>
            {u.host && u.host !== u.raw && (
              <p className="mt-1 text-xs text-ink-subtle">
                Domain: <span className="font-mono text-ink-muted [overflow-wrap:anywhere]">{u.host}</span>
              </p>
            )}
            {u.findings.length === 0 ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                <CircleCheck aria-hidden="true" className="h-3.5 w-3.5 text-mint-700" />
                No unusual characteristics found. That alone does not make a link safe.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {u.findings.map((f) => (
                  <li key={f.id} className="flex gap-2 text-[13px] leading-snug">
                    <TriangleAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                    <span>
                      <span className="font-medium text-ink">{f.label}.</span>{" "}
                      <span className="text-ink-muted">{f.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

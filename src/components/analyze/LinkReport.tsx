import { CircleCheck, Link2Off, ScanEye, TriangleAlert } from "lucide-react";
import type { UrlReport } from "@/lib/analysis";
import { urlAnatomy, type PartKind, type UrlAnatomy } from "@/lib/analysis/url-anatomy";
import { cn } from "../ui/primitives";

const PART_STYLE: Record<PartKind, { cls: string; label: string }> = {
  scheme: { cls: "text-ink-subtle", label: "protocol" },
  userinfo: { cls: "bg-coral-100 text-coral-700 line-through decoration-coral-500", label: "ignored" },
  subdomain: { cls: "text-ink-subtle", label: "subdomain" },
  domain: { cls: "rounded bg-brand-100 px-1 font-semibold text-brand-700", label: "real domain" },
  port: { cls: "text-ink-subtle", label: "port" },
  path: { cls: "text-ink-subtle", label: "path" },
};

/** Highlights non-ASCII characters inside a part of the address. */
function Chars({ text }: { text: string }) {
  return (
    <>
      {[...text].map((ch, i) =>
        ch.charCodeAt(0) > 127 ? (
          <mark key={i} className="rounded-sm bg-coral-100 text-coral-700 underline decoration-coral-500 decoration-2">
            {ch}
          </mark>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </>
  );
}

function Anatomy({ anatomy }: { anatomy: UrlAnatomy }) {
  return (
    <div className="mt-2 rounded-lg border border-line bg-sunken/60 p-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
        <ScanEye aria-hidden="true" className="h-3.5 w-3.5" />
        Link X-ray
      </p>
      <p className="mt-1.5 flex flex-wrap items-end font-mono text-[12.5px] leading-6 [overflow-wrap:anywhere]">
        {anatomy.parts.map((part, i) => (
          <span key={i} className="inline-flex flex-col">
            <span className={PART_STYLE[part.kind].cls}>
              <Chars text={part.text} />
            </span>
            {(part.kind === "domain" || part.kind === "userinfo") && (
              <span className={cn("font-sans text-[10px] leading-3", part.kind === "domain" ? "text-brand-700" : "text-coral-700")}>
                {PART_STYLE[part.kind].label}
              </span>
            )}
          </span>
        ))}
      </p>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
        This link is controlled by whoever owns{" "}
        <strong className="font-mono font-semibold text-ink [overflow-wrap:anywhere]">
          <Chars text={anatomy.ownerShown} />
        </strong>
        {anatomy.ownerShown !== anatomy.owner && (
          <span className="font-mono text-[11.5px] text-ink-subtle [overflow-wrap:anywhere]"> (really {anatomy.owner})</span>
        )}
        . Everything
        before it is chosen freely by that owner.
        {anatomy.parts.some((p) => p.kind === "userinfo") && " The crossed-out part before the @ is ignored by browsers."}
      </p>
      {anatomy.displayHost && (
        <p className="mt-1 text-[12.5px] text-ink-muted">
          Shown on screen as <span className="font-mono text-ink">{anatomy.displayHost}</span>.
        </p>
      )}
      {anatomy.lookalikes.length > 0 && (
        <ul className="mt-2 space-y-1">
          {anatomy.lookalikes.map((l) => (
            <li key={l.codePoint} className="flex items-center gap-2 text-[12.5px] text-coral-700">
              <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="rounded bg-coral-100 px-1 font-mono">{l.char}</span> is a {l.script} character ({l.codePoint})
                {l.looksLike ? (
                  <>
                    {" "}
                    that looks like the Latin letter <span className="rounded bg-surface px-1 font-mono text-ink">{l.looksLike}</span>
                  </>
                ) : null}
                .
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
        {urls.map((u) => {
          const anatomy = urlAnatomy(u.raw);
          return (
            <li key={u.start} className="rounded-xl border border-line p-3">
              <p className="font-mono text-[12.5px] text-ink [overflow-wrap:anywhere]">{u.raw}</p>
              {anatomy && <Anatomy anatomy={anatomy} />}
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
                        <span className="font-medium text-ink">{f.label}.</span> <span className="text-ink-muted">{f.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

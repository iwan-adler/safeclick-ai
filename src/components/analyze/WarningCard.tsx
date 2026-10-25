"use client";

import { Download, Share2, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/analysis";
import { buildCardContent, buildCardText, type CardContent, type CardLanguage } from "@/lib/warning-card";
import { CopyButton } from "../ui/CopyButton";
import { Button, buttonClass, cn } from "../ui/primitives";

const W = 1080;
const H = 1350;

const LEVEL_COLORS: Record<CardContent["level"], { band: string; soft: string; text: string }> = {
  high: { band: "#e2554c", soft: "#fef2f1", text: "#b2342c" },
  caution: { band: "#ee9a1a", soft: "#fff8eb", text: "#9a5705" },
  lower: { band: "#1fa975", soft: "#ecfaf3", text: "#0b7550" },
};

/** Wraps text to a width, returning the lines. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Draws the card, shrinking the text until everything fits above the footer.
 * Everything happens on this device; the canvas never leaves it unless shared.
 */
function drawCard(canvas: HTMLCanvasElement, c: CardContent) {
  for (let scale = 1; scale >= 0.6; scale -= 0.05) {
    if (drawAtScale(canvas, c, scale)) return;
  }
  drawAtScale(canvas, c, 0.6);
}

/** Returns false if the content ran into the footer at this scale. */
function drawAtScale(canvas: HTMLCanvasElement, c: CardContent, scale: number): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;
  const px = (n: number) => Math.round(n * scale);
  const family = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  const colors = LEVEL_COLORS[c.level];
  const pad = 80;
  const textWidth = W - pad * 2;

  ctx.fillStyle = "#f6f7fb";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(40, 40, W - 80, H - 80, 40);
  ctx.fill();
  ctx.fillStyle = colors.band;
  ctx.beginPath();
  ctx.roundRect(40, 40, W - 80, 24, [40, 40, 0, 0]);
  ctx.fill();

  // Brand mark and name.
  ctx.save();
  ctx.translate(pad, 110);
  ctx.scale(2.2, 2.2);
  ctx.fillStyle = "#2f54eb";
  ctx.beginPath();
  ctx.roundRect(0, 0, 32, 32, 9);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fill(new Path2D("M10 8.5 L10 22 L13.4 18.8 L15.9 24 L18.2 23 L15.7 17.9 L20.4 17.6 Z"));
  ctx.fillStyle = "#c5d0ff";
  ctx.fillRect(21.2, 8.5, 1.9, 6);
  ctx.fillRect(24.4, 8.5, 1.9, 6);
  ctx.restore();
  ctx.fillStyle = "#0f172a";
  ctx.font = `600 38px ${family}`;
  ctx.fillText("SafeClick AI", pad + 90, 160);

  let y = 270;
  ctx.font = `700 ${px(60)}px ${family}`;
  for (const line of wrap(ctx, c.title, textWidth)) {
    ctx.fillText(line, pad, y);
    y += px(74);
  }

  y += 10;
  ctx.font = `700 ${px(40)}px ${family}`;
  const label = c.levelLabel;
  const lw = ctx.measureText(label).width + 56;
  ctx.fillStyle = colors.soft;
  ctx.beginPath();
  ctx.roundRect(pad, y, lw, px(72), px(36));
  ctx.fill();
  ctx.fillStyle = colors.text;
  ctx.fillText(label, pad + 28, y + px(50));
  y += px(130);

  const section = (heading: string, items: string[], bullet: (i: number) => void) => {
    ctx.fillStyle = "#475569";
    ctx.font = `600 ${px(32)}px ${family}`;
    ctx.fillText(heading.toUpperCase(), pad, y);
    y += px(56);
    ctx.font = `500 ${px(38)}px ${family}`;
    items.forEach((item, i) => {
      const lines = wrap(ctx, item, textWidth - 60);
      bullet(i);
      ctx.fillStyle = "#0f172a";
      for (const line of lines) {
        ctx.fillText(line, pad + 60, y);
        y += px(50);
      }
      y += px(14);
    });
    y += px(24);
  };

  section(c.signsHeading, c.signs, () => {
    ctx.fillStyle = colors.band;
    ctx.beginPath();
    ctx.arc(pad + 18, y - 13, 10, 0, Math.PI * 2);
    ctx.fill();
  });
  section(c.stepsHeading, c.steps, () => {
    ctx.strokeStyle = "#1fa975";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(pad + 4, y - 16);
    ctx.lineTo(pad + 16, y - 4);
    ctx.lineTo(pad + 36, y - 30);
    ctx.stroke();
  });

  if (c.excerpt) {
    ctx.fillStyle = "#f1f3f8";
    ctx.font = `italic 400 ${px(32)}px ${family}`;
    const lines = wrap(ctx, `“${c.excerpt}”`, textWidth - 48).slice(0, 4);
    ctx.beginPath();
    ctx.roundRect(pad, y - 10, textWidth, lines.length * px(44) + 40, 24);
    ctx.fill();
    ctx.fillStyle = "#475569";
    y += px(30);
    for (const line of lines) {
      ctx.fillText(line, pad + 24, y);
      y += px(44);
    }
  }

  ctx.fillStyle = "#5f6b80";
  ctx.font = `500 28px ${family}`;
  const footer = wrap(ctx, c.footer, textWidth);
  const footerTop = H - 100 - (footer.length - 1) * 38 - 40;
  footer.forEach((line, i) => ctx.fillText(line, pad, H - 100 - (footer.length - 1 - i) * 38));
  return y <= footerTop;
}

export function WarningCardButton({ result, message }: { result: AnalysisResult; message: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<CardLanguage>("en");
  const [includeExcerpt, setIncludeExcerpt] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  const content = useMemo(
    () => buildCardContent(result, language, { message, includeExcerpt }),
    [result, language, message, includeExcerpt],
  );

  useEffect(() => {
    if (open && canvasRef.current) drawCard(canvasRef.current, content);
  }, [open, content]);

  const toBlob = () =>
    new Promise<Blob | null>((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) resolve(null);
      else canvas.toBlob(resolve, "image/png");
    });

  const show = () => {
    setOpen(true);
    dialogRef.current?.showModal();
    try {
      const probe = new File([""], "probe.png", { type: "image/png" });
      setCanShareFiles(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanShareFiles(false);
    }
  };

  const download = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "safeclick-warning.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const share = async () => {
    const blob = await toBlob();
    if (!blob) return;
    try {
      await navigator.share({ files: [new File([blob], "safeclick-warning.png", { type: "image/png" })], text: buildCardText(content) });
    } catch {
      // Share sheet dismissed: nothing to do.
    }
  };

  return (
    <>
      <button type="button" onClick={show} className={buttonClass("ghost", "sm")}>
        <Users aria-hidden="true" className="h-4 w-4" />
        Warn family
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-labelledby="warn-title"
        className="m-auto w-[min(44rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[var(--radius-card)] border border-line bg-surface p-0 text-ink shadow-[var(--shadow-raised)] backdrop:bg-navy-950/50"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="warn-title" className="text-lg font-semibold tracking-tight">
                Warn a family member
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                A picture of this result for parents, grandparents or friends. It&apos;s made on this device and only leaves it
                if you share it.
              </p>
            </div>
            <button type="button" onClick={() => dialogRef.current?.close()} className="rounded-lg p-1.5 text-ink-subtle hover:bg-sunken hover:text-ink">
              <X aria-hidden="true" className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Card language" className="flex rounded-lg bg-sunken p-0.5">
              {(
                [
                  ["en", "English"],
                  ["hi", "हिन्दी"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={language === value}
                  onClick={() => setLanguage(value)}
                  className={cn(
                    "h-8 rounded-md px-3 text-[13px] font-medium",
                    language === value ? "bg-surface text-ink shadow-[var(--shadow-card)]" : "text-ink-subtle hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[13px] text-ink-muted">
              <input type="checkbox" checked={includeExcerpt} onChange={(e) => setIncludeExcerpt(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
              Include a short, masked excerpt of the message
            </label>
          </div>

          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            role="img"
            aria-label={`Warning card: ${content.levelLabel}. ${content.signs.join(", ")}.`}
            className="mx-auto mt-4 block h-auto w-full max-w-[22rem] rounded-xl border border-line"
          />

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {canShareFiles && (
              <Button variant="primary" size="sm" onClick={share}>
                <Share2 aria-hidden="true" className="h-4 w-4" />
                Share
              </Button>
            )}
            <Button size="sm" variant={canShareFiles ? "secondary" : "primary"} onClick={download}>
              <Download aria-hidden="true" className="h-4 w-4" />
              Download image
            </Button>
            <CopyButton label="Copy as text" getText={() => buildCardText(content)} />
          </div>
        </div>
      </dialog>
    </>
  );
}

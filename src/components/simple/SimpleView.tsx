"use client";

import Link from "next/link";
import {
  ClipboardPaste,
  ImagePlus,
  Keyboard,
  Languages,
  LoaderCircle,
  OctagonX,
  Phone,
  PhoneCall,
  RotateCcw,
  Send,
  Settings,
  ShieldCheck,
  TriangleAlert,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeMessage, MAX_MESSAGE_LENGTH, type AnalysisResult } from "@/lib/analysis";
import { copyText } from "@/lib/clipboard";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/ocr";
import { combineShared, requestShare } from "@/lib/share";
import { savePrefs, useSimplePrefs } from "@/lib/simple/prefs";
import { useSpeech } from "@/lib/simple/speech";
import { SIMPLE_STRINGS, simpleVerdict, telHref, type SimpleTone } from "@/lib/simple/verdict";
import { buildCardContent, buildCardText } from "@/lib/warning-card";
import { BrandMark } from "../shell/Brand";
import { useScreenshotReader } from "../analyze/useScreenshotReader";
import { cn } from "../ui/primitives";

type Stage = "home" | "typing" | "working" | "result" | "setup";

const TONE_UI: Record<SimpleTone, { panel: string; icon: typeof OctagonX }> = {
  danger: { panel: "bg-[#b2342c] text-white", icon: OctagonX },
  caution: { panel: "bg-[#fbd88f] text-[#3a2400]", icon: TriangleAlert },
  calm: { panel: "bg-[#0b7550] text-white", icon: ShieldCheck },
};

const BIG_BUTTON =
  "flex w-full items-center gap-4 rounded-2xl px-6 py-5 text-left text-[22px] font-semibold leading-tight transition-[transform,background-color] active:scale-[0.98] min-h-[76px]";

export function SimpleView() {
  const prefs = useSimplePrefs();
  const t = SIMPLE_STRINGS[prefs.language];
  const [stage, setStage] = useState<Stage>("home");
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const { supported: canSpeak, speaking, speak, stop } = useSpeech(prefs.language);
  const tel = prefs.contactPhone ? telHref(prefs.contactPhone) : null;
  const familyName = prefs.contactName.trim() || (prefs.language === "hi" ? "परिवार" : "family");

  const check = useCallback((message: string) => {
    const r = analyzeMessage(message.slice(0, MAX_MESSAGE_LENGTH));
    if (!r.ok) return;
    setResult(r);
    setStage("result");
  }, []);

  const reader = useScreenshotReader(
    useCallback(
      (ocrText: string) => {
        if (ocrText.trim()) {
          setText(ocrText);
          check(ocrText);
        }
      },
      [check],
    ),
  );

  const readImage = (file: File) => {
    setNotice(null);
    setStage("working");
    void reader.read(file);
  };

  // If reading a screenshot fails, fall back to typing with an explanation.
  const ocrFailed = stage === "working" && (reader.state.status === "error" || (reader.state.status === "done" && reader.state.empty));
  const view: Stage = ocrFailed ? "typing" : stage;
  const shownNotice = notice ?? (ocrFailed ? t.ocrFailed : null);

  // Content shared from WhatsApp etc. is checked straight away in simple mode.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("shared")) return;
    window.history.replaceState(null, "", window.location.pathname);
    const ok = params.get("shared") === "1" && "serviceWorker" in navigator;
    let active = true;
    (ok ? requestShare() : Promise.resolve(null)).then((payload) => {
      if (!active) return;
      if (payload?.image) readImage(payload.image);
      else if (payload && combineShared(payload)) {
        const shared = combineShared(payload);
        setText(shared);
        check(shared);
      } else setNotice(SIMPLE_STRINGS[prefs.language].sharedFailed);
    });
    return () => {
      active = false;
    };
    // Runs once on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage === "result") resultRef.current?.focus();
  }, [stage]);

  const paste = async () => {
    setNotice(null);
    try {
      const clip = await navigator.clipboard.readText();
      if (clip.trim()) {
        setText(clip);
        check(clip);
      } else {
        setNotice(t.emptyClipboard);
        setStage("typing");
      }
    } catch {
      setNotice(t.pasteFailed);
      setStage("typing");
    }
  };

  const reset = () => {
    stop();
    reader.reset();
    setText("");
    setResult(null);
    setNotice(null);
    setStage("home");
  };

  const verdict = result ? simpleVerdict(result, prefs.language) : null;

  const sendToFamily = async () => {
    if (!result) return;
    const message = buildCardText(buildCardContent(result, prefs.language));
    try {
      if (navigator.share) {
        await navigator.share({ text: message });
        return;
      }
    } catch {
      return; // share sheet dismissed
    }
    await copyText(message);
  };

  return (
    <div className="page-enter mx-auto flex min-h-[calc(100dvh-7rem)] max-w-xl flex-col text-ink" lang={prefs.language}>
      <header className="mb-6 flex items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <BrandMark className="h-11 w-11" />
          <span className="text-[26px] font-bold tracking-tight">{t.appTitle}</span>
        </span>
        <span className="flex gap-2">
          <button
            type="button"
            onClick={() => savePrefs({ language: prefs.language === "hi" ? "en" : "hi" })}
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[17px] font-semibold"
          >
            <Languages aria-hidden="true" className="h-5 w-5" />
            {t.languageName}
          </button>
          <button
            type="button"
            onClick={() => setStage(stage === "setup" ? "home" : "setup")}
            aria-label={t.setup}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface"
          >
            <Settings aria-hidden="true" className="h-5 w-5" />
          </button>
        </span>
      </header>

      {shownNotice && view !== "result" && (
        <p role="alert" className="mb-4 rounded-2xl bg-amber-50 px-5 py-4 text-[19px] leading-snug text-amber-700">
          {shownNotice}
        </p>
      )}

      {view === "home" && (
        <section className="flex flex-1 flex-col gap-4">
          <h1 className="mb-2 text-[30px] font-bold leading-tight tracking-tight">{t.tagline}</h1>
          <button type="button" onClick={paste} className={cn(BIG_BUTTON, "bg-primary text-white")}>
            <ClipboardPaste aria-hidden="true" className="h-8 w-8 shrink-0" />
            {t.paste}
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={cn(BIG_BUTTON, "border-2 border-line bg-surface")}>
            <ImagePlus aria-hidden="true" className="h-8 w-8 shrink-0 text-brand-600" />
            {t.screenshot}
          </button>
          <button type="button" onClick={() => setStage("typing")} className={cn(BIG_BUTTON, "border-2 border-line bg-surface")}>
            <Keyboard aria-hidden="true" className="h-8 w-8 shrink-0 text-brand-600" />
            {t.type}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const image = e.target.files?.[0];
              if (image) readImage(image);
              e.target.value = "";
            }}
          />
        </section>
      )}

      {view === "typing" && (
        <section className="flex flex-1 flex-col gap-4">
          <label htmlFor="simple-text" className="text-[24px] font-bold">
            {t.typeHint}
          </label>
          <textarea
            id="simple-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            autoFocus
            className="w-full rounded-2xl border-2 border-line bg-surface p-4 text-[21px] leading-relaxed outline-none focus:border-brand-500"
          />
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => check(text)}
            className={cn(BIG_BUTTON, "justify-center bg-primary text-white disabled:bg-line-strong")}
          >
            {t.check}
          </button>
          <button type="button" onClick={reset} className="py-2 text-[19px] font-semibold text-brand-700 underline">
            {t.cancel}
          </button>
        </section>
      )}

      {view === "working" && (
        <section role="status" className="flex flex-1 flex-col items-center justify-center gap-5 py-16 text-center">
          <LoaderCircle aria-hidden="true" className="h-16 w-16 animate-spin text-brand-600" />
          <p className="text-[26px] font-bold">{reader.state.status === "reading" ? t.reading : t.checking}</p>
        </section>
      )}

      {view === "result" && verdict && (
        <section className="flex flex-1 flex-col gap-4">
          <div
            ref={resultRef}
            tabIndex={-1}
            role="alert"
            className={cn("rounded-3xl p-6 outline-none animate-fade-up", TONE_UI[verdict.tone].panel)}
          >
            {(() => {
              const Icon = TONE_UI[verdict.tone].icon;
              return <Icon aria-hidden="true" className="h-14 w-14" />;
            })()}
            <h1 className="mt-3 text-[32px] font-bold leading-tight">{verdict.title}</h1>
            <ul className="mt-4 space-y-3">
              {verdict.steps.map((step) => (
                <li key={step} className="flex gap-3 text-[22px] font-semibold leading-snug">
                  <span aria-hidden="true">•</span>
                  {step}
                </li>
              ))}
            </ul>
            {verdict.reasons.length > 0 && (
              <p className="mt-4 text-[18px] leading-snug opacity-90">
                <span className="font-bold">{t.reasonsTitle}</span> {verdict.reasons.join(" · ")}
              </p>
            )}
          </div>

          {canSpeak && (
            <button
              type="button"
              onClick={() => (speaking ? stop() : speak(verdict.speech))}
              className={cn(BIG_BUTTON, "border-2 border-line bg-surface")}
            >
              {speaking ? <VolumeX aria-hidden="true" className="h-8 w-8 shrink-0" /> : <Volume2 aria-hidden="true" className="h-8 w-8 shrink-0 text-brand-600" />}
              {speaking ? t.stopListening : t.listen}
            </button>
          )}
          {tel && (
            <a href={tel} className={cn(BIG_BUTTON, "bg-[#0b7550] text-white")}>
              <PhoneCall aria-hidden="true" className="h-8 w-8 shrink-0" />
              {t.askFamily(familyName)}
            </a>
          )}
          <button type="button" onClick={sendToFamily} className={cn(BIG_BUTTON, "border-2 border-line bg-surface")}>
            <Send aria-hidden="true" className="h-8 w-8 shrink-0 text-brand-600" />
            {t.sendFamily}
          </button>
          {verdict.tone !== "calm" && (
            <a href="tel:1930" className={cn(BIG_BUTTON, "border-2 border-[#b2342c] bg-surface text-[#b2342c] dark:text-[#ff9f98]")}>
              <Phone aria-hidden="true" className="h-8 w-8 shrink-0" />
              {t.lostMoney}
            </a>
          )}
          <button type="button" onClick={reset} className={cn(BIG_BUTTON, "justify-center bg-sunken")}>
            <RotateCcw aria-hidden="true" className="h-7 w-7 shrink-0" />
            {t.another}
          </button>
        </section>
      )}

      {view === "setup" && <FamilySetup onDone={() => setStage("home")} />}

      {view === "home" && tel && (
        <a href={tel} className={cn(BIG_BUTTON, "mt-6 bg-[#0b7550] text-white")}>
          <PhoneCall aria-hidden="true" className="h-8 w-8 shrink-0" />
          {t.askFamily(familyName)}
        </a>
      )}

      <footer className="mt-8 space-y-3 pb-4 text-center">
        <p className="text-[17px] leading-snug text-ink-muted">{t.privacy}</p>
        <Link href="/" className="inline-block py-2 text-[17px] font-semibold text-brand-700 underline">
          {t.fullApp}
        </Link>
      </footer>
    </div>
  );
}

function FamilySetup({ onDone }: { onDone: () => void }) {
  const prefs = useSimplePrefs();
  const t = SIMPLE_STRINGS[prefs.language];
  const [name, setName] = useState(prefs.contactName);
  const [phone, setPhone] = useState(prefs.contactPhone);
  const valid = phone.trim() === "" || telHref(phone) !== null;
  const field = "w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-[21px] outline-none focus:border-brand-500";

  return (
    <section aria-labelledby="setup-title" className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 id="setup-title" className="text-[28px] font-bold">
          {t.setupTitle}
        </h1>
        <button type="button" onClick={onDone} aria-label={t.cancel} className="rounded-xl p-2 hover:bg-sunken">
          <X aria-hidden="true" className="h-6 w-6" />
        </button>
      </div>
      <p className="text-[18px] leading-snug text-ink-muted">{t.setupHelp}</p>
      <label className="flex flex-col gap-2 text-[19px] font-semibold">
        {t.nameLabel}
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={field} autoComplete="off" />
      </label>
      <label className="flex flex-col gap-2 text-[19px] font-semibold">
        {t.phoneLabel}
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} className={field} autoComplete="off" />
      </label>
      <label className="flex items-center gap-3 text-[19px]">
        <input
          type="checkbox"
          checked={prefs.enabled}
          onChange={(e) => savePrefs({ enabled: e.target.checked })}
          className="h-7 w-7 accent-[var(--color-primary)]"
        />
        {prefs.language === "hi" ? "ऐप खुलते ही यह आसान स्क्रीन दिखाएँ" : "Open this simple screen whenever the app starts"}
      </label>
      <button
        type="button"
        disabled={!valid}
        onClick={() => {
          savePrefs({ contactName: name.trim(), contactPhone: phone.trim() });
          onDone();
        }}
        className={cn(BIG_BUTTON, "justify-center bg-primary text-white disabled:bg-line-strong")}
      >
        {t.save}
      </button>
      {prefs.contactPhone && (
        <button
          type="button"
          onClick={() => {
            savePrefs({ contactName: "", contactPhone: "" });
            setName("");
            setPhone("");
          }}
          className="py-2 text-[19px] font-semibold text-coral-700 underline"
        >
          {t.remove}
        </button>
      )}
    </section>
  );
}

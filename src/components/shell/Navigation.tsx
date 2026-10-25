"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../ui/primitives";
import { Wordmark } from "./Brand";
import { InstallButton } from "./InstallButton";
import { LocalBadge } from "./LocalBadge";
import { isActive, NAV_ITEMS } from "./nav";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, description, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                active ? "bg-white/[0.08] text-white" : "text-slate-300 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-400 transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <Icon
                aria-hidden="true"
                className={cn("h-[18px] w-[18px]", active ? "text-brand-200" : "text-slate-400 group-hover:text-slate-200")}
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className={cn("text-[11px]", active ? "text-slate-300" : "text-slate-400")}>{description}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-navy-950 px-4 py-5 lg:flex">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(120%_80%_at_0%_0%,rgb(74_107_255/0.22),transparent_70%)]"
      />
      <Link href="/" className="relative mb-8 rounded-lg px-2 py-1" aria-label="SafeClick AI home">
        <Wordmark inverted />
      </Link>
      <nav aria-label="Main" className="relative flex-1">
        <NavList />
      </nav>
      <InstallButton className="relative mt-6" />
      <div className="relative mt-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.06]">
        <LocalBadge />
        <p className="mt-2.5 px-1 text-[11px] leading-relaxed text-slate-400">
          No account, no tracking. Built for SafeSpace Hacks as an educational tool.
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
      // Keep keyboard focus inside the open menu.
      if (e.key === "Tab" && panel) {
        const items = [...panel.querySelectorAll<HTMLElement>("a,button")];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur lg:hidden">
        <Link href="/" aria-label="SafeClick AI home" className="rounded-lg">
          <Wordmark />
        </Link>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:bg-sunken"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" id="mobile-menu">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 bg-navy-950/40 animate-fade-in"
            onClick={close}
          />
          <div
            ref={panelRef}
            className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col bg-navy-950 px-4 py-5 shadow-2xl animate-fade-up"
          >
            <div className="mb-6 flex items-center justify-between">
              <Wordmark inverted />
              <button
                type="button"
                onClick={() => {
                  close();
                  buttonRef.current?.focus();
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X aria-hidden="true" className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <nav aria-label="Main" className="flex-1">
              <NavList onNavigate={close} />
            </nav>
            <InstallButton className="mt-6" />
            <p className="mt-4 px-1 text-[11px] leading-relaxed text-slate-400">
              Messages are analyzed in your browser and never uploaded.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

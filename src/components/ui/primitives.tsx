import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger-ghost";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-[0_1px_2px_rgb(35_67_201/0.3),inset_0_1px_0_rgb(255_255_255/0.12)] hover:bg-primary-hover active:translate-y-px disabled:bg-line-strong disabled:text-white disabled:shadow-none",
  secondary:
    "bg-surface text-ink border border-line hover:border-line-strong hover:bg-sunken active:translate-y-px disabled:text-ink-subtle",
  ghost: "text-ink-muted hover:bg-sunken hover:text-ink disabled:text-line-strong",
  "danger-ghost": "text-ink-muted hover:bg-coral-50 hover:text-coral-700 disabled:text-line-strong disabled:hover:bg-transparent",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
};

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", extra?: string) {
  return cn(
    "inline-flex select-none items-center justify-center rounded-[var(--radius-control)] font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-150 disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export type Tone = "neutral" | "brand" | "lavender" | "mint" | "amber" | "coral";

const TONES: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-muted ring-line",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  lavender: "bg-lavender-50 text-lavender-700 ring-lavender-100",
  mint: "bg-mint-50 text-mint-700 ring-mint-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  coral: "bg-coral-50 text-coral-700 ring-coral-100",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({ eyebrow, title, subtitle, aside }: { eyebrow: string; title: string; subtitle: string; aside?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[34px]">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-muted sm:text-base">{subtitle}</p>
      </div>
      {aside}
    </header>
  );
}

/** Progress bar with an accessible label. */
export function Progress({ value, max, label, tone = "brand" }: { value: number; max: number; label: string; tone?: "brand" | "mint" | "lavender" }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  const fill = { brand: "bg-primary", mint: "bg-mint-500", lavender: "bg-lavender-500" }[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-1.5 w-full overflow-hidden rounded-full bg-sunken"
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

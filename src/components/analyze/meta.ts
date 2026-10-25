import {
  Banknote,
  Clock,
  EyeOff,
  Gift,
  KeyRound,
  Link2,
  MessageSquareText,
  MonitorSmartphone,
  PhoneOff,
  ScanText,
  ShieldAlert,
  TrendingUp,
  UserX,
  type LucideIcon,
} from "lucide-react";
import type { ConcernLevel, Severity, SignalKind } from "@/lib/analysis";
import type { Tone } from "../ui/primitives";

export const KIND_ICON: Record<SignalKind, LucideIcon> = {
  urgency: Clock,
  sensitive: KeyRound,
  payment: Banknote,
  threat: ShieldAlert,
  impersonation: UserX,
  link: Link2,
  bypass: PhoneOff,
  lure: Gift,
  secrecy: EyeOff,
  device: MonitorSmartphone,
  obfuscation: ScanText,
  escalation: TrendingUp,
  generic: MessageSquareText,
};

export const KIND_LABEL: Record<SignalKind, string> = {
  urgency: "Urgency",
  sensitive: "Sensitive info",
  payment: "Payment pressure",
  threat: "Threat",
  impersonation: "Impersonation",
  link: "Suspicious link",
  bypass: "Avoids checks",
  lure: "Too good to be true",
  secrecy: "Secrecy",
  device: "Device access",
  obfuscation: "Disguised text",
  escalation: "Escalation",
  generic: "Generic wording",
};

export const SEVERITY_TONE: Record<Severity, Tone> = { low: "neutral", medium: "amber", high: "coral" };
export const SEVERITY_LABEL: Record<Severity, string> = { low: "Minor", medium: "Moderate", high: "Strong" };

/** Classes for the small icon tile next to each signal. */
export const SEVERITY_TILE: Record<Severity, string> = {
  low: "bg-sunken text-ink-muted",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-coral-50 text-coral-700",
};

/** Highlight classes for evidence inside the annotated message. */
export const SEVERITY_MARK: Record<Severity, string> = {
  low: "bg-lavender-100 decoration-lavender-500",
  medium: "bg-amber-100 decoration-amber-500",
  high: "bg-coral-100 decoration-coral-500",
};

export const LEVEL_STYLE: Record<ConcernLevel, { tone: Tone; stroke: string; text: string; soft: string; ring: string }> = {
  lower: { tone: "mint", stroke: "#1fa975", text: "text-mint-700", soft: "bg-mint-50", ring: "ring-mint-100" },
  caution: { tone: "amber", stroke: "#ee9a1a", text: "text-amber-700", soft: "bg-amber-50", ring: "ring-amber-100" },
  high: { tone: "coral", stroke: "#e2554c", text: "text-coral-700", soft: "bg-coral-50", ring: "ring-coral-100" },
};

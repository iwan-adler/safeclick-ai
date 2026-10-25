import { GraduationCap, HeartHandshake, Library, LifeBuoy, ScanSearch, ShieldCheck, Siren, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Analyze", description: "Check a message", icon: ScanSearch },
  { href: "/help", label: "Get help", description: "Already clicked or paid?", icon: Siren },
  { href: "/simple", label: "Simple mode", description: "For grandparents, in Hindi", icon: HeartHandshake },
  { href: "/examples", label: "Examples", description: "Fictional samples", icon: Library },
  { href: "/learn", label: "Learn", description: "Practice scenarios", icon: GraduationCap },
  { href: "/guide", label: "Safety Guide", description: "What to do next", icon: LifeBuoy },
  { href: "/privacy", label: "Privacy", description: "Data & limitations", icon: ShieldCheck },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

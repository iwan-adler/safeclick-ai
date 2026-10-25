import Link from "next/link";
import { buttonClass } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="page-enter card mx-auto mt-10 max-w-md p-8 text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">This page doesn&apos;t exist.</h1>
      <p className="mt-2 text-sm text-ink-muted">The link may be mistyped or out of date.</p>
      <Link href="/" className={buttonClass("primary", "md", "mt-6")}>
        Go to the analyzer
      </Link>
    </div>
  );
}

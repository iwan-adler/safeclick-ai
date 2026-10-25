"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { Button } from "./primitives";

export function CopyButton({ getText, label = "Copy", size = "sm" }: { getText: () => string; label?: string; size?: "sm" | "md" }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <Button
      size={size}
      variant="secondary"
      onClick={async () => setState((await copyText(getText())) ? "copied" : "failed")}
    >
      {state === "copied" ? (
        <Check aria-hidden="true" className="h-4 w-4 text-mint-700 animate-pop" />
      ) : (
        <Copy aria-hidden="true" className="h-4 w-4" />
      )}
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}</span>
    </Button>
  );
}

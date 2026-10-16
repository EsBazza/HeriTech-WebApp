import React from "react";
import { cn } from "./cn";

export type BadgeTone = "neutral" | "pine" | "success" | "warn" | "danger" | "accent";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-paper-2 text-ink-2 border-line",
  pine: "bg-pine-100 text-pine-700 border-pine-200",
  success: "bg-success-100 text-success border-success/20",
  warn: "bg-warn-100 text-warn border-warn/20",
  danger: "bg-danger-100 text-danger border-danger/20",
  accent: "bg-lantern-100 text-lantern-600 border-lantern/20",
};

export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-xs font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

import React from "react";
import { cn } from "./cn";

interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
}

export function Stat({ label, value, unit, hint, icon, className, tone = "light" }: StatProps) {
  const dark = tone === "dark";
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className={cn("flex items-center gap-1.5 text-sm", dark ? "text-white/70" : "text-ink-3")}>
        {icon}
        <span>{label}</span>
      </div>
      {/* Shrinks on narrow phones so a currency figure fits half the width */}
      <div className={cn("tabular font-display text-[clamp(1.6rem,7.5vw,2.125rem)] leading-none font-semibold break-words", dark ? "text-white" : "text-ink")}>
        {value}
        {unit && <span className={cn("ml-1.5 font-sans text-sm font-medium", dark ? "text-white/70" : "text-ink-3")}>{unit}</span>}
      </div>
      {hint && <p className={cn("text-xs", dark ? "text-white/60" : "text-ink-3")}>{hint}</p>}
    </div>
  );
}

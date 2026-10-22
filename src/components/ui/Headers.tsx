import React from "react";
import { cn } from "./cn";

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("block text-xs font-semibold uppercase tracking-wide text-brand-2", className)} {...props} />;
}

interface HeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  /** "dark" for headers on pine sections. */
  tone?: "light" | "dark";
}

export function PageHeader({ eyebrow, title, description, actions, className }: HeaderProps) {
  return (
    <header className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line", className)}>
      <div className="space-y-2 max-w-2xl">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="font-display text-4xl sm:text-[44px] leading-[1.05] font-semibold text-ink">{title}</h1>
        {description && <p className="text-base text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

export function SectionHeader({ eyebrow, title, description, actions, className, tone = "light" }: HeaderProps) {
  const dark = tone === "dark";
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-3", className)}>
      <div className="space-y-1.5 max-w-2xl">
        {eyebrow && <Eyebrow className={dark ? "text-pine-300" : undefined}>{eyebrow}</Eyebrow>}
        <h2 className={cn("font-display text-3xl sm:text-[34px] leading-tight font-semibold", dark ? "text-white" : "text-ink")}>{title}</h2>
        {description && <p className={cn("text-[15px]", dark ? "text-white/70" : "text-ink-2")}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

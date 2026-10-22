import React from "react";
import { cn } from "./cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-sm bg-paper-2", className)} aria-hidden />;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Optional "how it works" steps, shown as a numbered row under the description. */
  steps?: { icon?: React.ReactNode; title: React.ReactNode; body?: React.ReactNode }[];
  className?: string;
}

export function EmptyState({ icon, title, description, action, steps, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center text-center px-5 sm:px-6 py-12 sm:py-14 border border-dashed border-line-strong rounded-md bg-surface/60", className)}>
      {icon && <div className="w-11 h-11 rounded-full bg-pine-100 text-brand flex items-center justify-center mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink font-sans">{title}</h3>
      {description && <div className="text-sm text-ink-3 mt-1 max-w-sm">{description}</div>}
      {steps && steps.length > 0 && (
        <ol className="mt-7 grid gap-3 sm:grid-cols-3 w-full max-w-2xl text-left">
          {steps.map((s, i) => (
            <li key={i} className="relative rounded-lg border border-line bg-surface p-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 shrink-0 rounded-full bg-pine-700 text-white flex items-center justify-center" aria-hidden>
                  {s.icon ?? <span className="tabular text-sm font-semibold">{i + 1}</span>}
                </span>
                <span className="text-xs font-medium text-ink-3 tabular">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">{s.title}</p>
              {s.body && <p className="mt-1 text-xs text-ink-3 leading-relaxed">{s.body}</p>}
            </li>
          ))}
        </ol>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner({ label, className }: { label?: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center gap-3 py-20 text-sm text-ink-3", className)}>
      <span className="w-8 h-8 rounded-full border-2 border-brand-line border-t-pine-700 animate-spin" aria-hidden />
      {label ?? <span className="sr-only">Loading…</span>}
    </div>
  );
}

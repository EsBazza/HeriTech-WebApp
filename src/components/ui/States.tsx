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
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center text-center px-6 py-14 border border-dashed border-line-strong rounded-md bg-surface/60", className)}>
      {icon && <div className="w-11 h-11 rounded-full bg-pine-100 text-pine-700 flex items-center justify-center mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink font-sans">{title}</h3>
      {description && <div className="text-sm text-ink-3 mt-1 max-w-sm">{description}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ label, className }: { label?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-20 text-sm text-ink-3", className)}>
      <span className="w-8 h-8 rounded-full border-2 border-pine-200 border-t-pine-700 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

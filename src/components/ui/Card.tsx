import React from "react";
import { cn } from "./cn";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("bg-surface border border-line rounded-md shadow-card", className)} {...props} />;
}

interface CardHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-ink font-sans">{title}</h3>
        {description && <p className="text-sm text-ink-3 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

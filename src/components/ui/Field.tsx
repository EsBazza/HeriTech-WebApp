import React, { useId } from "react";
import { cn } from "./cn";

export const controlClass =
  "w-full bg-surface border border-line-strong rounded-sm px-3 text-[15px] text-ink placeholder:text-ink-3/70 transition-colors focus:outline-none focus:border-pine-500 focus:ring-2 focus:ring-pine-500/15 disabled:bg-paper-2";

interface FieldWrapProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  id: string;
  children: React.ReactNode;
  className?: string;
}

function FieldWrap({ label, hint, error, id, children, className }: FieldWrapProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

type Common = { label?: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode; wrapperClassName?: string };

export function Input({ label, hint, error, wrapperClassName, className, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & Common) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap label={label} hint={hint} error={error} id={fid} className={wrapperClassName}>
      <input id={fid} className={cn(controlClass, "h-11", error && "border-danger", className)} {...props} />
    </FieldWrap>
  );
}

export function Select({ label, hint, error, wrapperClassName, className, id, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & Common) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap label={label} hint={hint} error={error} id={fid} className={wrapperClassName}>
      <select id={fid} className={cn(controlClass, "h-11 pr-8", error && "border-danger", className)} {...props}>
        {children}
      </select>
    </FieldWrap>
  );
}

export function Textarea({ label, hint, error, wrapperClassName, className, id, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & Common) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap label={label} hint={hint} error={error} id={fid} className={wrapperClassName}>
      <textarea id={fid} className={cn(controlClass, "py-2.5 min-h-[96px]", error && "border-danger", className)} {...props} />
    </FieldWrap>
  );
}

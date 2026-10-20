import React, { useId } from "react";
import { cn } from "./cn";

// 16px on phones: iOS Safari zooms the page into any field with smaller text.
export const controlClass =
  "w-full bg-surface border border-line-strong rounded-sm px-3 text-base sm:text-[15px] text-ink placeholder:text-ink-3/70 transition-colors focus:outline-none focus:border-pine-500 focus:ring-2 focus:ring-pine-500/35 aria-invalid:border-danger disabled:bg-paper-2";

// A drawn chevron so the select looks the same on every platform.
const selectArrow =
  "appearance-none pr-10 bg-no-repeat bg-[length:16px] bg-[position:right_12px_center] bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6661' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]";

interface FieldWrapProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  id: string;
  children: React.ReactNode;
  className?: string;
}

function FieldWrap({ label, hint, error, required, id, children, className }: FieldWrapProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
          {required && (
            <span className="text-danger ml-0.5" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-sm text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type Common = { label?: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode; wrapperClassName?: string };

/** Links the control to its hint or error so screen readers read them with it. */
function a11y(fid: string, hint: React.ReactNode, error: React.ReactNode, describedBy?: string) {
  const own = error || hint ? `${fid}-msg` : undefined;
  return {
    "aria-describedby": [describedBy, own].filter(Boolean).join(" ") || undefined,
    "aria-invalid": error ? true : undefined,
  };
}

export function Input({ label, hint, error, wrapperClassName, className, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & Common) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap label={label} hint={hint} error={error} required={props.required} id={fid} className={wrapperClassName}>
      <input id={fid} className={cn(controlClass, "h-11", className)} {...props} {...a11y(fid, hint, error, props["aria-describedby"])} />
    </FieldWrap>
  );
}

export function Select({ label, hint, error, wrapperClassName, className, id, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & Common) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap label={label} hint={hint} error={error} required={props.required} id={fid} className={wrapperClassName}>
      <select id={fid} className={cn(controlClass, selectArrow, "h-11 cursor-pointer", className)} {...props} {...a11y(fid, hint, error, props["aria-describedby"])}>
        {children}
      </select>
    </FieldWrap>
  );
}

export function Textarea({ label, hint, error, wrapperClassName, className, id, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & Common) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap label={label} hint={hint} error={error} required={props.required} id={fid} className={wrapperClassName}>
      <textarea id={fid} className={cn(controlClass, "py-2.5 min-h-[96px]", className)} {...props} {...a11y(fid, hint, error, props["aria-describedby"])} />
    </FieldWrap>
  );
}

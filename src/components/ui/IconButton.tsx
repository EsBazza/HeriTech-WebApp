import React from "react";
import { cn } from "./cn";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: an icon-only button has no other accessible name. */
  "aria-label": string;
  tone?: "default" | "danger" | "inverse";
}

const tones = {
  default: "text-ink-2 hover:bg-pine-50 hover:text-ink",
  danger: "text-ink-3 hover:bg-danger-100 hover:text-danger",
  inverse: "text-white/80 hover:bg-white/10 hover:text-white",
};

/** A 44px square button for a single icon. */
export function IconButton({ tone = "default", className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

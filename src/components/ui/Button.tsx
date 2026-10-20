import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 font-medium rounded-md text-center leading-tight transition-[color,background-color,border-color,transform] duration-150 ease-out cursor-pointer active:scale-[0.97] disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed select-none";

const variants: Record<Variant, string> = {
  primary: "bg-pine-700 text-white hover:bg-pine-600",
  secondary: "bg-surface text-ink border border-line-strong hover:border-pine-500 hover:text-pine-700",
  ghost: "text-ink-2 hover:bg-pine-50 hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger-600",
  accent: "bg-lantern text-white hover:bg-lantern-600",
};

// Heights are minimums so long or translated labels wrap instead of overflowing.
// sm is 40px to look compact, with an invisible 44px touch area.
const sizes: Record<Size, string> = {
  sm: "min-h-10 py-1.5 px-3 text-sm after:absolute after:-inset-y-0.5 after:inset-x-0 after:content-['']",
  md: "min-h-11 py-2 px-4 text-[15px]",
  lg: "min-h-12 py-2.5 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

type LinkButtonProps = React.ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

export function LinkButton({ variant = "primary", size = "md", className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

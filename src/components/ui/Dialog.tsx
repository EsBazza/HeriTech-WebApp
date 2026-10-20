"use client";

import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "./cn";
import { IconButton } from "./IconButton";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Pinned under the scrolling body, above the phone's home indicator. */
  footer?: React.ReactNode;
  /** "sheet" rises from the bottom on phones and centres on larger screens; "drawer" slides in from the side. */
  variant?: "sheet" | "drawer";
  size?: "sm" | "md" | "lg";
  /** Fill the whole phone screen instead of a sheet (long forms such as checkout). */
  fullOnMobile?: boolean;
  closeLabel?: string;
  /** Set false while a step must not be abandoned (e.g. a payment in flight). */
  dismissible?: boolean;
  className?: string;
}

const widths = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };

/**
 * The one modal for the app: traps focus, closes on Escape or backdrop click,
 * locks page scroll, returns focus on close and keeps its header and footer
 * pinned while the body scrolls.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "sheet",
  size = "md",
  fullOnMobile = false,
  closeLabel = "Close",
  dismissible = true,
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissibleRef.current) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const drawer = variant === "drawer";

  return createPortal(
    <div
      className={cn("fixed inset-0 z-50 flex", drawer ? "justify-end" : "items-end sm:items-center justify-center sm:p-4")}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissible) onClose();
      }}
    >
      <div className="absolute inset-0 bg-pine-900/45 backdrop-blur-[2px] pointer-events-none" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex flex-col w-full bg-surface shadow-pop outline-none",
          drawer
            ? "h-full sm:max-w-[400px] animate-[drawer-in_0.22s_ease-out]"
            : cn(
                widths[size],
                "sm:rounded-xl sm:max-h-[min(90dvh,860px)] animate-[sheet-in_0.22s_ease-out]",
                fullOnMobile ? "h-[100dvh] sm:h-auto" : "max-h-[92dvh] rounded-t-xl"
              ),
          className
        )}
      >
        {!drawer && !fullOnMobile && <span className="sm:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong" aria-hidden />}
        <div className="flex items-start gap-3 px-5 pb-3 border-b border-line shrink-0 pt-[max(1rem,env(safe-area-inset-top,0px))] sm:pt-4">
          <div className="min-w-0 flex-1 pt-1.5">
            <h2 id={titleId} className="font-display text-2xl font-semibold leading-tight text-ink">
              {title}
            </h2>
            {description && (
              <div id={descId} className="text-sm text-ink-3 mt-1">
                {description}
              </div>
            )}
          </div>
          {dismissible && (
            <IconButton aria-label={closeLabel} onClick={onClose} className="-mr-2">
              <X className="w-5 h-5" />
            </IconButton>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-line bg-surface px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

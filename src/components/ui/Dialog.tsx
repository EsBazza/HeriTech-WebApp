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
  /** Overrides the scrolling body's padding, e.g. for edge-to-edge lists. */
  bodyClassName?: string;
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
  bodyClassName,
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

  // Phone sheets can be dragged down by their handle or header to close, like a native sheet.
  const drag = useRef<{ y: number; dy: number; t: number } | null>(null);
  const sheetDraggable = variant === "sheet" && !fullOnMobile && dismissible;

  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sheetDraggable || window.matchMedia("(min-width: 640px)").matches) return;
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    drag.current = { y: e.clientY, dy: 0, t: Date.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const panel = panelRef.current;
    if (!d || !panel) return;
    d.dy = Math.max(0, e.clientY - d.y);
    panel.style.transition = "none";
    panel.style.transform = `translateY(${d.dy}px)`;
  };
  const onDragEnd = () => {
    const d = drag.current;
    const panel = panelRef.current;
    drag.current = null;
    if (!d || !panel) return;
    const flicked = d.dy / Math.max(1, Date.now() - d.t) > 0.6 && d.dy > 40;
    if (d.dy > 110 || flicked) {
      panel.style.transition = "transform 0.2s ease-in";
      panel.style.transform = "translateY(100%)";
      setTimeout(() => onCloseRef.current(), 180);
    } else {
      panel.style.transition = "transform 0.35s var(--ease-spring)";
      panel.style.transform = "";
    }
  };

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
            ? "h-full sm:max-w-[400px] animate-[drawer-in_0.28s_var(--ease-sheet)]"
            : cn(
                widths[size],
                "sm:rounded-xl sm:max-h-[min(90dvh,860px)] animate-[sheet-in_0.32s_var(--ease-sheet)]",
                fullOnMobile ? "h-[100dvh] sm:h-auto" : "max-h-[92dvh] rounded-t-xl",
              ),
          className,
        )}
      >
        <div
          className={cn("shrink-0 border-b border-line", sheetDraggable && "touch-none sm:touch-auto")}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          {sheetDraggable && <span className="sm:hidden block mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong" aria-hidden />}
          <div
            className={cn(
              "flex items-start gap-3 px-5 pb-3 sm:pt-4",
              // Only full-height panels reach the status bar
              drawer || fullOnMobile ? "pt-[max(1rem,env(safe-area-inset-top,0px))]" : "pt-3",
            )}
          >
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
        </div>
        <div className={cn("flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5", bodyClassName)}>{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-surface px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

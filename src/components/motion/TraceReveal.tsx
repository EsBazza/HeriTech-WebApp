"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/components/ui";

export interface TraceTag {
  label: string;
  detail: string;
  /** Position over the photo, in percent of the hero box. */
  x: number;
  y: number;
}

interface TraceRevealProps {
  src: string;
  alt: string;
  tags?: TraceTag[];
  /** Everything layered above the photo (scrim, copy, cards). */
  children?: React.ReactNode;
  className?: string;
  /** Lets the parent show a keyboard/touch toggle. */
  renderToggle?: (state: {
    full: boolean;
    toggle: () => void;
  }) => React.ReactNode;
  /** Flood colour from the cursor (default) or from a fixed origin set in CSS. */
  followCursor?: boolean;
}

const INTERACTIVE = "a,button,input,select,textarea,label,form";

/**
 * "Before / after" hero. The photo starts muted; on mouse hover (or the
 * toggle, for touch and keyboard) colour floods out from the cursor and the
 * children react to `data-state` — e.g. leftovers assembling into a lantern.
 * The colour layer reuses the same image URL, so there is no second download.
 */
export function TraceReveal({
  src,
  alt,
  tags = [],
  children,
  className,
  renderToggle,
  followCursor = true,
}: TraceRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [hovering, setHovering] = useState(false);
  const [full, setFull] = useState(false);

  const setOrigin = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el || !followCursor) return;
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty("--trace-x", `${x}%`);
        el.style.setProperty("--trace-y", `${y}%`);
      });
    },
    [followCursor],
  );

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const toggle = useCallback(() => setFull((f) => !f), []);
  const state = full ? "full" : hovering ? "hover" : "idle";

  return (
    <div
      ref={ref}
      data-state={state}
      className={cn("trace relative isolate overflow-hidden", className)}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        setOrigin(e.clientX, e.clientY);
        setHovering(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setHovering(false);
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || hovering) return;
        // The cursor can already be over the photo when it appears (e.g. as the
        // intro lifts), so no pointerenter fires: start on the first movement.
        setOrigin(e.clientX, e.clientY);
        setHovering(true);
      }}
      onClick={(e) => {
        // Touch: tap the photo (not a control) to toggle the crafted scene
        if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
        if ((e.nativeEvent as PointerEvent).pointerType === "mouse") return;
        setOrigin(e.clientX, e.clientY);
        toggle();
      }}
    >
      {/* Muted base photo, and the colour layer masked from the cursor. The mask
          sits on a still wrapper so the slow zoom never moves its origin. */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="trace-camera absolute inset-0">
          <div className="absolute inset-0 kenburns">
            <Image
              src={src}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover grayscale-[0.75] sepia-[0.3] brightness-[0.58] contrast-[1.06]"
            />
          </div>
          <div className="trace-color absolute inset-0">
            <div className="absolute inset-0 kenburns">
              <Image
                src={src}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover saturate-[1.15]"
              />
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">{alt}</span>

      {children}

      {/* Provenance tags: appear once the scene is crafted */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] pointer-events-none hidden md:block"
      >
        {tags.map((t, i) => (
          <span
            key={t.label}
            className="trace-tag absolute flex items-center gap-2 rounded-full bg-surface/95 pl-1.5 pr-3 py-1.5 shadow-pop backdrop-blur"
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              ["--tag-delay" as string]: `${i * 60}ms`,
            }}
          >
            <span className="relative flex w-5 h-5 items-center justify-center rounded-full bg-pine-700">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
            <span className="text-[13px] leading-tight">
              <span className="block font-medium text-ink">{t.label}</span>
              <span className="block text-ink-3">{t.detail}</span>
            </span>
          </span>
        ))}
      </div>

      {renderToggle?.({ full, toggle })}
    </div>
  );
}

export default TraceReveal;

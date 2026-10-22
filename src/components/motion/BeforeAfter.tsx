"use client";

import React, { useEffect, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { cn } from "@/components/ui";

interface Side {
  src: string;
  label: string;
}

interface BeforeAfterProps {
  before: Side;
  after: Side;
  /** Accessible name for the slider. */
  label: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Drag (or use arrow keys) to compare the collected material with the
 * finished piece. A native range input drives it, so it works with mouse,
 * touch and keyboard, and screen readers announce the position.
 * On first view it sweeps once to show it can be dragged.
 */
export function BeforeAfter({ before, after, label, className, children }: BeforeAfterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(100);
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPos(50);
      setIntro(false);
      return;
    }
    // Start on the material, then reveal the finished piece
    const a = window.setTimeout(() => setPos(50), 450);
    const b = window.setTimeout(() => setIntro(false), 1700);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  return (
    <div ref={ref} className={cn("group relative overflow-hidden select-none", className)} style={{ ["--pos" as string]: `${pos}%` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after.src} alt={after.label} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div
        className={cn("absolute inset-0", intro && "transition-[clip-path] duration-[1200ms] ease-[cubic-bezier(0.65,0,0.35,1)]")}
        style={{ clipPath: "inset(0 calc(100% - var(--pos)) 0 0)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before.src} alt={before.label} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      </div>

      {/* Divider + handle */}
      <div
        aria-hidden
        className={cn("absolute top-0 bottom-0 w-0.5 -ml-px bg-white/90 shadow-[0_0_12px_rgb(0_0_0/0.35)] pointer-events-none", intro && "transition-[left] duration-[1200ms] ease-[cubic-bezier(0.65,0,0.35,1)]")}
        style={{ left: "var(--pos)" }}
      >
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-pine-900 shadow-pop flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-pine-500">
          <MoveHorizontal className="w-5 h-5" />
        </span>
      </div>

      {/* Side labels */}
      <span
        className="pointer-events-none absolute left-4 bottom-4 rounded-full bg-pine-900/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-opacity duration-300 max-w-[calc(50%-1.25rem)] truncate"
        style={{ opacity: pos > 18 ? 1 : 0 }}
      >
        {before.label}
      </span>
      <span
        className="pointer-events-none absolute right-4 bottom-4 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-medium text-ink shadow-card transition-opacity duration-300 max-w-[calc(50%-1.25rem)] truncate"
        style={{ opacity: pos < 82 ? 1 : 0 }}
      >
        {after.label}
      </span>

      {children}

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pos}
        aria-label={label}
        aria-valuetext={`${Math.round(pos)}% ${before.label}`}
        onChange={(e) => {
          setIntro(false);
          setPos(Number(e.target.value));
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />
    </div>
  );
}

export default BeforeAfter;

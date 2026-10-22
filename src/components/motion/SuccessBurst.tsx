import React from "react";
import { cn } from "@/components/ui";

// Paper, petal, fabric and wood scraps: the materials HeriTech collects.
const SCRAPS = [
  { x: "-46px", y: "62px", r: "120deg", d: "0s", c: "#eadfc8", w: 9, h: 7, br: "2px" },
  { x: "-22px", y: "80px", r: "-80deg", d: "0.06s", c: "#e8925a", w: 8, h: 8, br: "9999px 9999px 9999px 2px" },
  { x: "4px", y: "88px", r: "200deg", d: "0.02s", c: "#8fb09c", w: 10, h: 5, br: "2px" },
  { x: "28px", y: "76px", r: "-140deg", d: "0.1s", c: "#c99a6b", w: 4, h: 12, br: "9999px" },
  { x: "50px", y: "58px", r: "90deg", d: "0.04s", c: "#eadfc8", w: 8, h: 6, br: "2px" },
  { x: "-36px", y: "40px", r: "-200deg", d: "0.14s", c: "#c4471e", w: 6, h: 6, br: "9999px 9999px 9999px 2px" },
  { x: "38px", y: "36px", r: "160deg", d: "0.12s", c: "#8fb09c", w: 7, h: 4, br: "1px" },
];

/**
 * The success moment: a green ring pops in with a lantern-warm glow, a check
 * draws itself, and (optionally) a few festival scraps float up and fade.
 * Decorative only; pair it with text that says what happened.
 */
export function SuccessBurst({ size = 56, scraps = false, className }: { size?: number; scraps?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex items-center justify-center shrink-0", className)} style={{ width: size, height: size }} aria-hidden>
      {scraps &&
        SCRAPS.map((s, i) => (
          <span
            key={i}
            className="success-scrap"
            style={{
              ["--x" as string]: s.x,
              ["--y" as string]: s.y,
              ["--r" as string]: s.r,
              ["--d" as string]: s.d,
              width: s.w,
              height: s.h,
              borderRadius: s.br,
              background: s.c,
            }}
          />
        ))}
      <span className="success-ring absolute inset-0 rounded-full bg-success-solid" />
      <svg viewBox="0 0 24 24" className="relative w-1/2 h-1/2 text-white">
        <path
          className="success-check"
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

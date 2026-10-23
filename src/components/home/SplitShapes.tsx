"use client";

import React, { useId } from "react";
import { cn } from "@/components/ui";

/**
 * Lanterns that hang on the edges of the page: pieces an artisan could make from a
 * festival's leftover paper and frames. Decorative only; they sway from their string.
 */

function Cord({ id, top, x }: { id: string; top: number; x: number }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-str`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-ink-3)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--color-ink-3)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x={x - 0.6} y="0" width="1.2" height={top} fill={`url(#${id}-str)`} />
    </>
  );
}

/** A round paper lantern with ribs, caps and a tassel; the paper glows from a candle inside. */
export function HangingLantern({ tone = "lantern", className, style }: { tone?: "lantern" | "pine"; className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const paper = tone === "lantern" ? "var(--color-lantern)" : "var(--color-split-platform)";
  return (
    <svg viewBox="0 0 100 230" aria-hidden className={cn("hang-piece pointer-events-none overflow-visible", className)} style={style}>
      <defs>
        <radialGradient id={`${id}-paper`} cx="0.42" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#ffe6c4" />
          <stop offset="0.5" stopColor={paper} stopOpacity="0.8" />
          <stop offset="1" stopColor={paper} />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="rgb(242 166 90)" stopOpacity="0.3" />
          <stop offset="1" stopColor="rgb(242 166 90)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="hang-sway">
        <Cord id={id} top={62} x={50} />
        <circle className="hang-glow" cx="50" cy="112" r="70" fill={`url(#${id}-glow)`} />
        <rect x="37" y="60" width="26" height="9" rx="2" fill="var(--color-split-artisan)" />
        <ellipse cx="50" cy="112" rx="40" ry="44" fill={`url(#${id}-paper)`} />
        <g fill="none" stroke="var(--color-split-artisan)" strokeOpacity="0.35" strokeWidth="1">
          <ellipse cx="50" cy="112" rx="27" ry="44" />
          <ellipse cx="50" cy="112" rx="12" ry="44" />
          <line x1="50" y1="68" x2="50" y2="156" />
        </g>
        <rect x="37" y="154" width="26" height="9" rx="2" fill="var(--color-split-artisan)" />
        <g stroke={paper} strokeWidth="1.6" strokeLinecap="round" className="hang-tassel">
          <line x1="50" y1="163" x2="50" y2="206" />
          <line x1="47" y1="166" x2="45" y2="200" />
          <line x1="53" y1="166" x2="55" y2="200" />
        </g>
        <circle cx="50" cy="166" r="3" fill="var(--color-split-artisan)" />
      </g>
    </svg>
  );
}

/** A parol, the Filipino star lantern Pampanga is known for, with its two paper tails. */
export function Parol({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const cx = 80;
  const cy = 118;
  const star = Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 === 0 ? 58 : 24;
    const a = (Math.PI / 5) * k - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  const tip = (k: number) => {
    const a = (Math.PI / 5) * k - Math.PI / 2;
    return [cx + 58 * Math.cos(a), cy + 58 * Math.sin(a)];
  };
  const [lx, ly] = tip(6);
  const [rx, ry] = tip(4);
  return (
    <svg viewBox="0 0 160 260" aria-hidden className={cn("hang-piece pointer-events-none overflow-visible", className)} style={style}>
      <defs>
        <radialGradient id={`${id}-paper`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#ffe2b0" />
          <stop offset="0.55" stopColor="var(--color-lantern)" stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--color-lantern)" />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="rgb(242 166 90)" stopOpacity="0.28" />
          <stop offset="1" stopColor="rgb(242 166 90)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="hang-sway">
        <Cord id={id} top={cy - 58} x={cx} />
        <circle className="hang-glow" cx={cx} cy={cy} r="92" fill={`url(#${id}-glow)`} />
        <circle cx={cx} cy={cy} r="66" fill="none" stroke="var(--color-split-artisan)" strokeOpacity="0.55" strokeWidth="1.5" />
        <polygon points={star} fill={`url(#${id}-paper)`} stroke="var(--color-split-artisan)" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r="11" fill="#fff3dc" stroke="var(--color-split-artisan)" strokeWidth="1.2" />
        <g fill="none" strokeWidth="4" strokeLinecap="round" className="hang-tassel">
          <path d={`M${lx} ${ly} c -6 26, 10 44, -2 78`} stroke="var(--color-split-artisan)" />
          <path d={`M${rx} ${ry} c 6 26, -10 44, 2 78`} stroke="var(--color-split-platform)" />
        </g>
      </g>
    </svg>
  );
}

/** Banderitas: a small bunting flag sewn from a fabric offcut, with its stitched hem. */
function Pennant({ fill, stitch }: { fill: string; stitch: string }) {
  return (
    <svg viewBox="0 0 24 30" className="block w-full overflow-visible">
      <path d="M0 0 H24 L12 30 Z" fill={fill} />
      <path d="M3.5 2.5 H20.5 L12 24" fill="none" stroke={stitch} strokeWidth="0.9" strokeDasharray="1.6 1.8" strokeLinecap="round" />
    </svg>
  );
}

// The cord: a quadratic curve from (0, Y0) to (100%, Y0) sagging SAG px in the middle.
const Y0 = 14;
const SAG = 34;
const cordY = (t: number) => Y0 + 4 * SAG * t * (1 - t);

const FLAG_COLORS = [
  { fill: "var(--color-split-platform)", stitch: "rgb(255 255 255 / 0.7)" },
  { fill: "var(--color-lantern)", stitch: "rgb(255 236 210 / 0.75)" },
  { fill: "var(--color-paper-2)", stitch: "var(--color-ink-3)" },
  { fill: "var(--color-split-artisan)", stitch: "rgb(255 255 255 / 0.5)" },
];

/**
 * A festival line strung across the top of the section: a parol at one end, paper lanterns at
 * the other and banderitas between, all made from what a festival leaves behind.
 */
export function FestivalLine({ className }: { className?: string }) {
  const flags = Array.from({ length: 17 }, (_, i) => 0.18 + i * 0.0375);
  const at = (t: number): React.CSSProperties => ({ left: `${t * 100}%`, top: `${cordY(t)}px` });
  return (
    <div aria-hidden className={cn("festival-line pointer-events-none absolute inset-x-0 top-0", className)}>
      <svg className="absolute inset-x-0 top-0 h-[90px] w-full" viewBox="0 0 100 90" preserveAspectRatio="none">
        <path d={`M0 ${Y0} Q50 ${Y0 + 2 * SAG} 100 ${Y0}`} fill="none" stroke="var(--color-ink-3)" strokeOpacity="0.55" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      {flags.map((t, i) => (
        <span
          key={t}
          className={cn("flag absolute -translate-x-1/2 w-[18px] sm:w-[22px]", i % 2 === 1 && "max-sm:hidden")}
          style={{ ...at(t), "--k": 4 * SAG * (1 - 2 * t), "--i": i } as React.CSSProperties}
        >
          <Pennant {...FLAG_COLORS[i % FLAG_COLORS.length]} />
        </span>
      ))}
      <span className="absolute -translate-x-1/2" style={at(0.075)}>
        <Parol className="block w-[62px] sm:w-[74px] lg:w-[84px]" style={{ "--sway-dur": "7s", "--sway-delay": "-3s" } as React.CSSProperties} />
      </span>
      <span className="absolute -translate-x-1/2" style={at(0.885)}>
        <HangingLantern className="block w-[40px] sm:w-[48px] lg:w-[56px]" />
      </span>
      <span className="absolute -translate-x-1/2 max-sm:hidden" style={at(0.95)}>
        <HangingLantern tone="pine" className="block w-[34px] lg:w-[40px]" style={{ "--sway-dur": "7.6s", "--sway-delay": "-2s" } as React.CSSProperties} />
      </span>
    </div>
  );
}

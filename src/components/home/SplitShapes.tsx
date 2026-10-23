"use client";

import React from "react";
import { SPLIT } from "@/lib/escrow";
import { cn } from "@/components/ui";
import { useInView } from "@/components/motion/Reveal";

const SHARES = [
  { key: "artisan", pct: SPLIT.artisan, color: "var(--color-split-artisan)" },
  { key: "lgu", pct: SPLIT.lgu, color: "var(--color-split-platform)" },
  { key: "charity", pct: SPLIT.charityMaintenance, color: "var(--color-split-ngo)" },
];

/** The split drawn as a ring, the three arcs in the real proportions; sits behind the card's corner. */
export function SplitRing({ className }: { className?: string }) {
  const { ref, inView } = useInView<SVGSVGElement>();
  const gap = 1.6;
  let start = 0;
  return (
    <svg ref={ref} viewBox="0 0 320 320" aria-hidden className={cn("split-shape split-ring", inView && "is-in", className)}>
      <circle className="split-ring-orbit" cx="160" cy="160" r="152" fill="none" strokeWidth="1" strokeDasharray="2 7" />
      <circle cx="160" cy="160" r="104" fill="none" strokeWidth="1" className="split-ring-line" />
      <g transform="rotate(-90 160 160)">
        {SHARES.map((s, i) => {
          const len = s.pct - gap;
          const off = start;
          start += s.pct;
          return (
            <circle
              key={s.key}
              className="split-ring-arc"
              cx="160"
              cy="160"
              r="128"
              fill="none"
              stroke={s.color}
              strokeWidth="9"
              strokeLinecap="round"
              pathLength={100}
              style={{ "--len": len, "--off": -off - gap / 2, "--i": i } as React.CSSProperties}
            />
          );
        })}
      </g>
    </svg>
  );
}

/** A lantern frame seen from above: two nested hexagons and the candle at the centre. */
export function LanternFrame({ className }: { className?: string }) {
  const hex = (r: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const a = (Math.PI / 3) * k - Math.PI / 2;
      return `${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={cn("split-shape split-hex", className)}>
      <g className="split-hex-turn">
        <polygon points={hex(88)} fill="none" strokeWidth="1.25" className="split-ring-line" />
        <polygon points={hex(62)} fill="none" strokeWidth="1" strokeDasharray="3 6" className="split-ring-line" />
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const a = (Math.PI / 3) * k - Math.PI / 2;
          return <line key={k} x1={100 + 62 * Math.cos(a)} y1={100 + 62 * Math.sin(a)} x2={100 + 88 * Math.cos(a)} y2={100 + 88 * Math.sin(a)} strokeWidth="1" className="split-ring-line" />;
        })}
      </g>
      <circle cx="100" cy="100" r="5" className="split-candle" />
    </svg>
  );
}

/** One sale branching into three payouts; each line is as thick as its share. */
export function SplitFlow({ className }: { className?: string }) {
  const { ref, inView } = useInView<SVGSVGElement>();
  const ys = [20, 56, 92];
  return (
    <svg ref={ref} viewBox="0 0 280 112" aria-hidden className={cn("split-shape split-flow", inView && "is-in", className)}>
      <circle cx="22" cy="56" r="15" fill="none" strokeWidth="1.5" className="split-coin" />
      <circle cx="22" cy="56" r="7" className="split-coin-core" />
      {SHARES.map((s, i) => (
        <React.Fragment key={s.key}>
          <path
            className="split-flow-line"
            d={`M40 56 C 120 56, 140 ${ys[i]}, 250 ${ys[i]}`}
            fill="none"
            stroke={s.color}
            strokeWidth={Math.max(1.5, s.pct / 10)}
            strokeLinecap="round"
            pathLength={1}
            style={{ "--i": i } as React.CSSProperties}
          />
          <circle className="split-flow-dot" cx="262" cy={ys[i]} r="6" fill={s.color} style={{ "--i": i } as React.CSSProperties} />
        </React.Fragment>
      ))}
    </svg>
  );
}

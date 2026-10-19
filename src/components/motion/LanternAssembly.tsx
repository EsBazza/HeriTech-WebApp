import React from "react";

/**
 * Festival leftovers that assemble into a paper lantern.
 *
 * Idle: lantern paper, bamboo and marigold petals lie scattered and drift.
 * When the parent `.trace` is hovered/toggled, every scrap flies to its place
 * on the lantern (paper strips along the ribs of an ellipsoid, bamboo caps,
 * a marigold tassel) and the lantern lights up. Pure CSS transitions driven by
 * the parent's data-state; decorative only.
 */

// Lantern body: half-width A, half-height B, centred in a 440×520 stage
const STAGE_W = 440;
const STAGE_H = 520;
const CX = 220;
const CY = 220;
const A = 96;
const B = 118;

type Kind = "paper" | "bamboo" | "petal";

interface Piece {
  kind: Kind;
  color: string;
  w: number;
  h: number;
  // assembled
  tx: number;
  ty: number;
  tr: number;
  // scattered
  sx: number;
  sy: number;
  sr: number;
  delay: number;
  drift: number;
}

// Seeded PRNG so server and client render the same scatter (no hydration mismatch)
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const PAPER = ["#c2602f", "#d9823b", "#e3a24a", "#b84b2c", "#efd9b4", "#d06a35"];
const BAMBOO = "#b89a63";
const PETAL = ["#e8a33a", "#f0b84c", "#d9822b"];

function buildPieces(): Piece[] {
  const r = rng(20261104);
  const pieces: Piece[] = [];
  // Build order (ms): bottom ring, paper weaving upward, top ring, cord, tassel
  const scatter = () => {
    const airborne = r() < 0.14;
    return {
      // Keep the litter on the photo side, clear of the headline copy
      sx: -50 + r() * 520,
      sy: airborne ? 300 + r() * 80 : 392 + r() * 150,
      sr: r() * 360 - 180,
      drift: Math.round(r() * 4000),
    };
  };

  // Paper strips along 7 ribs, 6 segments each
  const ribs = [-75, -50, -25, 0, 25, 50, 75];
  const segs = 6;
  ribs.forEach((deg, k) => {
    const phi = (deg * Math.PI) / 180;
    for (let j = 0; j < segs; j++) {
      const t = ((j + 0.5) / segs) * Math.PI;
      const x = A * Math.sin(phi) * Math.sin(t);
      const y = -B * Math.cos(t);
      const dx = A * Math.sin(phi) * Math.cos(t);
      const dy = B * Math.sin(t);
      const len = Math.hypot(dx, dy) * (Math.PI / segs);
      // Outer ribs are foreshortened: thinner and slightly darker
      const thickness = 5 + 4 * Math.cos(phi);
      pieces.push({
        kind: "paper",
        color: PAPER[(k + j * 2) % PAPER.length],
        w: Math.max(10, len * 0.94),
        h: thickness,
        tx: CX + x,
        ty: CY + y,
        tr: (Math.atan2(dy, dx) * 180) / Math.PI,
        delay: 60 + (segs - 1 - j) * 70 + Math.abs(k - 3) * 22,
        ...scatter(),
      });
    }
  });

  // Bamboo: top ring, bottom ring, hanging cord
  const bamboo = (tx: number, ty: number, w: number, tr: number, delay: number) =>
    pieces.push({ kind: "bamboo", color: BAMBOO, w, h: 4, tx, ty, tr, delay, ...scatter() });
  bamboo(CX, CY + B + 4, 70, 0, 0);
  bamboo(CX, CY - B - 4, 70, 0, 500);
  bamboo(CX, CY - B - 34, 52, 90, 580);

  // Marigold tassel
  for (let i = 0; i < 5; i++) {
    pieces.push({
      kind: "petal",
      color: PETAL[i % PETAL.length],
      w: 26,
      h: 7,
      tx: CX - 16 + i * 8,
      ty: CY + B + 26,
      tr: 90,
      delay: 650 + i * 35,
      ...scatter(),
    });
  }
  return pieces;
}

// Round everything: server and browser trig can differ in the last digits,
// which would make the inline styles mismatch during hydration.
const r2 = (n: number) => Math.round(n * 100) / 100;
const PIECES = buildPieces().map((p) => ({
  ...p,
  w: r2(p.w),
  h: r2(p.h),
  tx: r2(p.tx),
  ty: r2(p.ty),
  tr: r2(p.tr),
  sx: r2(p.sx),
  sy: r2(p.sy),
  sr: r2(p.sr),
  delay: Math.round(p.delay),
}));

export function LanternAssembly({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`lantern-stage pointer-events-none ${className}`} style={{ width: STAGE_W, height: STAGE_H }}>
      {/* Warm light that blooms when the lantern is complete */}
      <span className="lantern-glow" style={{ left: CX, top: CY }} />
      {/* Lit paper membrane between the ribs */}
      <span className="lantern-body" style={{ left: CX - A, top: CY - B, width: A * 2, height: B * 2 }} />

      {PIECES.map((p, i) => (
        <span
          key={i}
          className="lantern-piece"
          style={
            {
              width: `${p.w}px`,
              height: `${p.h}px`,
              "--sx": `${p.sx}px`,
              "--sy": `${p.sy}px`,
              "--sr": `${p.sr}deg`,
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
              "--tr": `${p.tr}deg`,
              "--piece-delay": `${p.delay}ms`,
            } as React.CSSProperties
          }
        >
          <span
            className={`lantern-scrap lantern-${p.kind}`}
            style={{ background: p.color, animationDelay: `-${p.drift}ms` }}
          />
        </span>
      ))}
    </div>
  );
}

export default LanternAssembly;

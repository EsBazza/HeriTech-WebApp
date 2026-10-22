import React from "react";

/**
 * Festival leftovers that assemble into a paper lantern.
 *
 * Idle: lantern paper, bamboo and marigold petals lie scattered on the table.
 * When the parent `.trace` is hovered/toggled, every scrap flies to its place
 * on the lantern (paper strips along the ribs of an ellipsoid, bamboo caps,
 * a marigold tassel). Then the frame draws itself in, the candle catches,
 * a few embers rise, warm light pools on the table and the lantern settles
 * into a slow sway on its cord. Pure CSS driven by the parent's data-state;
 * decorative only, and static under reduced motion.
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

const PAPER = ["#c4471e", "#d9823b", "#e3a24a", "#b84b2c", "#efd9b4", "#d06a35"];
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
// which would make the inline styles and SVG paths mismatch during hydration.
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

// Bamboo ribs: horizontal rings, seen slightly from above (front arcs dip down)
const RINGS = [-0.78, -0.5, -0.18, 0.18, 0.5, 0.78].map((v) => {
  const y = r2(CY + B * v);
  const hw = r2(A * Math.sqrt(1 - v * v));
  return `M ${r2(CX - hw)} ${y} A ${hw} ${r2(hw * 0.16)} 0 0 0 ${r2(CX + hw)} ${y}`;
});
// Paper gores: the seams that run from cap to cap
const GORES = [-62, -31, 0, 31, 62].map((deg) => {
  const s = Math.sin((deg * Math.PI) / 180);
  const pts: string[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = (i / 16) * Math.PI;
    pts.push(`${r2(CX + A * s * Math.sin(t))} ${r2(CY - B * Math.cos(t))}`);
  }
  return `M ${pts.join(" L ")}`;
});
// Silk tassel threads below the marigold knot
const THREADS = Array.from({ length: 11 }, (_, i) => {
  const x0 = r2(CX - 7 + i * 1.4);
  const x1 = r2(CX - 13 + i * 2.6);
  return `M ${x0} ${CY + B + 36} Q ${r2((x0 + x1) / 2)} ${CY + B + 62} ${x1} ${CY + B + 86}`;
});
// Embers that rise once the candle catches
const EMBERS = (() => {
  const r = rng(7);
  return Array.from({ length: 8 }, (_, i) => ({
    x: r2(CX - 34 + r() * 68),
    rise: Math.round(110 + r() * 90),
    sway: Math.round(-24 + r() * 48),
    size: r2(2 + r() * 2.5),
    delay: Math.round(1300 + i * 260 + r() * 200),
  }));
})();

const drawDelay = (ms: number) => ({ "--draw-delay": `${ms}ms` }) as React.CSSProperties;

export function LanternAssembly({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`lantern-stage pointer-events-none ${className}`} style={{ width: STAGE_W, height: STAGE_H }}>
      {/* Warm light that blooms when the lantern is complete */}
      <span className="lantern-glow" style={{ left: CX, top: CY }} />
      {/* The light it throws onto the table below */}
      <span className="lantern-pool" style={{ left: CX, top: STAGE_H - 36 }} />

      {/* Everything that hangs from the cord sways together */}
      <div className="lantern-rig" style={{ transformOrigin: `${CX}px 0px` }}>
        {/* Lit paper membrane between the ribs */}
        <span className="lantern-body" style={{ left: CX - A, top: CY - B, width: A * 2, height: B * 2 }} />
        {/* The candle inside */}
        <span className="lantern-flame" style={{ left: CX, top: CY + 26 }} />

        <svg className="lantern-frame" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} width={STAGE_W} height={STAGE_H}>
          <defs>
            <linearGradient id="lantern-cap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5a2a17" />
              <stop offset="0.45" stopColor="#8a3d1f" />
              <stop offset="1" stopColor="#3d1c10" />
            </linearGradient>
            <linearGradient id="lantern-gold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#b8862f" />
              <stop offset="0.5" stopColor="#f2cf7a" />
              <stop offset="1" stopColor="#b8862f" />
            </linearGradient>
          </defs>

          {/* Cord and knot */}
          <path className="lantern-draw" pathLength={1} d={`M ${CX} 0 L ${CX} ${CY - B - 16}`} stroke="#7a3a1d" strokeWidth="2" fill="none" style={drawDelay(520)} />
          <circle className="lantern-fade" cx={CX} cy={CY - B - 46} r="4" fill="url(#lantern-gold)" />

          {/* Gores and ribs drawn over the lit paper */}
          {GORES.map((d, i) => (
            <path key={`g${i}`} className="lantern-draw" pathLength={1} d={d} stroke="rgb(120 46 20 / 0.32)" strokeWidth="1.2" fill="none" style={drawDelay(180 + i * 60)} />
          ))}
          {RINGS.map((d, i) => (
            <path key={`r${i}`} className="lantern-draw" pathLength={1} d={d} stroke="rgb(120 74 34 / 0.55)" strokeWidth="1.6" strokeLinecap="round" fill="none" style={drawDelay(360 + i * 55)} />
          ))}

          {/* Lacquered caps with a thin gold band */}
          <g className="lantern-fade">
            <rect x={CX - 42} y={CY - B - 16} width="84" height="15" rx="5" fill="url(#lantern-cap)" />
            <rect x={CX - 42} y={CY - B - 4} width="84" height="2.5" rx="1.25" fill="url(#lantern-gold)" />
            <rect x={CX - 38} y={CY + B + 1} width="76" height="13" rx="5" fill="url(#lantern-cap)" />
            <rect x={CX - 38} y={CY + B + 1} width="76" height="2.5" rx="1.25" fill="url(#lantern-gold)" />
          </g>

          {/* Silk tassel */}
          <g className="lantern-tassel" style={{ transformOrigin: `${CX}px ${CY + B + 30}px` }}>
            {THREADS.map((d, i) => (
              <path key={`t${i}`} d={d} stroke={i % 3 === 0 ? "#e3a24a" : "#b8321f"} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            ))}
            <circle cx={CX} cy={CY + B + 34} r="5" fill="url(#lantern-gold)" />
          </g>
        </svg>

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
            <span className={`lantern-scrap lantern-${p.kind}`} style={{ background: p.color, animationDelay: `-${p.drift}ms` }} />
          </span>
        ))}

        {/* Paper sheen: a soft highlight on the curve, above the strips */}
        <span className="lantern-sheen" style={{ left: CX - A, top: CY - B, width: A * 2, height: B * 2 }} />
      </div>

      {EMBERS.map((e, i) => (
        <span
          key={`e${i}`}
          className="lantern-ember"
          style={
            {
              left: e.x,
              top: CY - B - 18,
              width: e.size,
              height: e.size,
              "--rise": `-${e.rise}px`,
              "--sway": `${e.sway}px`,
              animationDelay: `${e.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default LanternAssembly;

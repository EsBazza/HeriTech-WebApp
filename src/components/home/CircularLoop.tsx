"use client";

import React from "react";
import { FileSignature, Hammer, QrCode, ScanLine, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

const C = 200; // centre
const R = 140; // ring radius
const LABEL_R = 186;

/**
 * The HeriTech loop as an orbit: a lantern-coloured tracer travels the ring
 * and lights each stage as it passes. Pure SVG + CSS; static under reduced motion.
 */
export function CircularLoop() {
  const { translateSync } = useTranslation();
  const stages = [
    { label: translateSync("Agreement"), icon: FileSignature },
    { label: translateSync("Scan"), icon: ScanLine },
    { label: translateSync("Pickup"), icon: QrCode },
    { label: translateSync("Craft"), icon: Hammer },
    { label: translateSync("Pass"), icon: ShieldCheck },
  ];

  return (
    <svg viewBox="-80 -14 560 428" className="loop-orbit w-full h-auto" role="img" aria-label={translateSync("The HeriTech loop: agreement, scan, pickup, craft and pass, all on one ledger")}>
      <defs>
        <radialGradient id="loop-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f2a65a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f2a65a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={C} cy={C} r={R + 34} fill="none" stroke="rgb(255 255 255 / 0.06)" />
      <circle cx={C} cy={C} r={R} fill="none" stroke="rgb(143 176 156 / 0.35)" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
      <g className="loop-tracer" style={{ transformOrigin: `${C}px ${C}px` }}>
        <circle cx={C} cy={C} r={R} fill="none" stroke="#f2a65a" strokeWidth="3" strokeLinecap="round" strokeDasharray={`90 ${2 * Math.PI * R}`} />
      </g>

      {/* Core: the one ledger everything writes to */}
      <circle cx={C} cy={C} r="78" fill="url(#loop-core)" className="loop-core" />
      <circle cx={C} cy={C} r="54" fill="#14281e" stroke="rgb(255 255 255 / 0.14)" />
      <text x={C} y={C - 4} textAnchor="middle" className="fill-white font-display" fontSize="21" fontWeight="600">
        HeriTech
      </text>
      <text x={C} y={C + 16} textAnchor="middle" fill="rgb(255 255 255 / 0.6)" fontSize="11" letterSpacing="1.5">
        {translateSync("ONE LEDGER")}
      </text>

      {stages.map((s, i) => {
        const a = ((-90 + i * 72) * Math.PI) / 180;
        const x = Math.round((C + R * Math.cos(a)) * 100) / 100;
        const y = Math.round((C + R * Math.sin(a)) * 100) / 100;
        const lx = Math.round((C + LABEL_R * Math.cos(a)) * 100) / 100;
        const ly = Math.round((C + LABEL_R * Math.sin(a)) * 100) / 100;
        const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        const Icon = s.icon;
        return (
          <g key={i} className="loop-node" style={{ animationDelay: `${i * 2}s` }}>
            <circle cx={x} cy={y} r="25" className="loop-node-disc" stroke="rgb(143 176 156 / 0.5)" strokeWidth="1.5" />
            <Icon x={x - 11} y={y - 11} width={22} height={22} color="#ffffff" strokeWidth={1.75} aria-hidden />
            <text x={lx} y={i === 0 ? ly - 2 : ly + 5} textAnchor={anchor} fill="rgb(255 255 255 / 0.85)" fontSize="15" fontWeight="500">
              <tspan fill="rgb(143 176 156)" fontSize="12">{`0${i + 1} `}</tspan>
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default CircularLoop;

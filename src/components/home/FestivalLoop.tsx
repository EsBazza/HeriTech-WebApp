"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileSignature, Hammer, Layers, QrCode, ScanLine, ShieldCheck, Smartphone, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Reveal } from "@/components/motion/Reveal";
import { cn, useMediaQuery } from "@/components/ui";

const RING = 32; // ring radius, % of the orbit's width
const LABEL_GAP = 9; // label distance outside a node, % of width
const STEP_MS = 3400;

/** Example festivals and what each leaves behind; the loop is the same for all. */
const FESTIVALS = [
  { name: "Yi Peng", place: "Chiang Mai", material: "paper lanterns" },
  { name: "Ganesh Chaturthi", place: "Mumbai", material: "marigold garlands" },
  { name: "Sinulog", place: "Cebu", material: "costume fabric" },
  { name: "Mid-Autumn", place: "Singapore", material: "lantern frames" },
];

interface Stage {
  label: string;
  who: string;
  body: string;
  icon: LucideIcon;
}

/**
 * "The same loop at every festival": pick a festival and the five steps run for
 * its material. A lantern light travels the ring and lights each step in turn;
 * the centre tells what happens there and who does it. Tapping a step takes over
 * from the autoplay. Still, with every step readable, under reduced motion.
 */
export function FestivalLoop() {
  const { translateSync, translateTemplate } = useTranslation();
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  // Plays only while the orbit is on screen.
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "0px 0px -15% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const [festival, setFestival] = useState(0);
  // `step` only grows, so the light always travels forward round the ring.
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const hover = useRef(false);

  const f = FESTIVALS[festival];
  const material = translateSync(f.material);
  const active = step % 5;

  const stages: Stage[] = [
    { label: translateSync("Agreement"), who: translateSync("Local government"), icon: FileSignature, body: translateTemplate("The festival signs a release, so its {material} can be collected on the record.", { material }) },
    { label: translateSync("Scan"), who: translateSync("LGU officer"), icon: ScanLine, body: translateTemplate("Gemini identifies the {material}, checks the condition and flags anything unsafe.", { material }) },
    { label: translateSync("Pickup"), who: translateSync("Verified artisan"), icon: QrCode, body: translateSync("The artisan collects it with a one-time handover code, so custody passes on the record.") },
    { label: translateSync("Craft"), who: translateSync("Verified artisan"), icon: Hammer, body: translateTemplate("The {material} becomes a new piece, tagged with the ID of the batch it came from.", { material }) },
    { label: translateSync("Pass"), who: translateSync("Buyer"), icon: ShieldCheck, body: translateSync("The buyer gets a Verified Impact Pass that anyone can scan and check.") },
  ];

  const points: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: Smartphone, title: translateSync("Works on any phone"), body: translateSync("Runs in the browser officers and artisans already use. Nothing to install.") },
    { icon: Layers, title: translateSync("Any festival, any leftover"), body: translateSync("Lanterns, flowers, fabric or wood: agreement, scan, pickup, craft, pass.") },
    { icon: ShieldCheck, title: translateSync("Proof anyone can check"), body: translateSync("Every pass opens a public record of its origin, maker and money split. No account needed.") },
  ];

  useEffect(() => {
    if (!auto || reduce || !inView) return;
    const id = window.setInterval(() => {
      if (!hover.current && document.visibilityState === "visible") setStep((s) => s + 1);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [auto, reduce, inView]);

  const pick = (i: number) => {
    setAuto(false);
    setStep((s) => s + ((i - (s % 5) + 5) % 5));
  };

  const pos = (i: number, r: number) => {
    const a = ((-90 + i * 72) * Math.PI) / 180;
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a), cos: Math.cos(a), sin: Math.sin(a) };
  };

  const circ = 2 * Math.PI * RING;
  const trail = ((active + (reduce ? 4 : 0)) / 5) * circ;
  const stage = stages[active];
  const StageIcon = stage.icon;

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 grid lg:grid-cols-12 gap-14 lg:gap-12 items-center">
      <div className="lg:col-span-5">
        <Reveal>
          <h2 id="loop-title" className="font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.025em] text-balance text-white">
            {translateSync("The same loop at every festival")}
          </h2>
          <p className="mt-6 text-[18px] text-white/85 leading-[1.6] max-w-[44ch] text-pretty">
            {translateSync("One system for every festival and every kind of leftover. Pick one and watch it run.")}
          </p>
        </Reveal>

        <Reveal delay={90}>
          <div role="group" aria-label={translateSync("Choose a festival")} className="mt-8 grid grid-cols-2 gap-2 max-w-[440px]">
            {FESTIVALS.map((x, i) => (
              <button
                key={x.name}
                type="button"
                aria-pressed={festival === i}
                onClick={() => {
                  setFestival(i);
                  if (!reduce) {
                    setAuto(true);
                    setStep((s) => s + ((5 - (s % 5)) % 5));
                  }
                }}
                className={cn(
                  "loop-chip group flex flex-col items-start min-h-11 px-4 py-2 rounded-2xl text-left cursor-pointer transition-[background-color,color,transform] duration-200 active:scale-[0.97]",
                  festival === i ? "bg-white text-pine-900" : "bg-white/[0.07] text-white hover:bg-white/[0.13]"
                )}
              >
                <span className="text-[15px] font-semibold leading-tight">{translateSync(x.name)}</span>
                <span className={cn("text-[13px] leading-tight", festival === i ? "text-pine-700" : "text-white/65")}>{translateSync(x.place)}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <ul className="mt-12 space-y-6">
          {points.map((point, i) => {
            const Icon = point.icon;
            return (
              <li key={point.title}>
                <Reveal delay={150 + i * 90} className="grid grid-cols-[40px_1fr] gap-4">
                  <span className="loop-point-icon w-10 h-10 rounded-full flex items-center justify-center" aria-hidden>
                    <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="font-display text-[24px] leading-[1.1] font-semibold tracking-[-0.015em] text-white">{point.title}</h3>
                    <p className="mt-1 text-[16px] text-white/80 leading-[1.55] max-w-[44ch] text-pretty">{point.body}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The orbit */}
      <div className="lg:col-span-7">
        <div
          ref={ref}
          data-on={inView}
          className="festival-loop relative mx-auto w-full max-w-[560px] aspect-square"
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") hover.current = true;
          }}
          onPointerLeave={() => {
            hover.current = false;
          }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
            {/* Slow outer drift */}
            <g className="loop-drift">
              <circle cx="50" cy="50" r="49" fill="none" stroke="rgb(255 255 255 / 0.09)" strokeWidth="0.25" strokeDasharray="0.6 2.4" />
            </g>
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgb(255 255 255 / 0.05)" strokeWidth="0.25" />
            {/* The ring, the lit trail behind the light, and the light itself */}
            <circle cx="50" cy="50" r={RING} fill="none" stroke="rgb(143 176 156 / 0.28)" strokeWidth="0.5" />
            <circle
              cx="50"
              cy="50"
              r={RING}
              fill="none"
              stroke="#f2a65a"
              strokeWidth="0.9"
              strokeLinecap="round"
              className="loop-trail"
              style={{ strokeDasharray: `${circ}`, strokeDashoffset: circ - trail }}
              transform="rotate(-90 50 50)"
            />
            <g className="loop-comet" style={{ transform: `rotate(${(reduce ? 4 : step) * 72}deg)` }}>
              <circle cx="50" cy={50 - RING} r="3.2" fill="#f2a65a" opacity="0.18" />
              <circle cx="50" cy={50 - RING} r="1.4" fill="#f2a65a" />
            </g>
            {/* Centre */}
            <circle cx="50" cy="50" r="22.5" className="loop-centre" />
          </svg>

          {/* Steps: real buttons on the ring */}
          {stages.map((s, i) => {
            const p = pos(i, RING);
            const l = pos(i, RING + LABEL_GAP);
            const Icon = s.icon;
            const on = reduce || i === active;
            const done = !reduce && i < active;
            return (
              <React.Fragment key={i}>
                <button
                  type="button"
                  onClick={() => pick(i)}
                  aria-pressed={i === active}
                  aria-label={translateTemplate("{step}: {body}", { step: s.label, body: s.body })}
                  data-on={i === active}
                  className={cn(
                    "loop-step absolute w-[13%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer",
                    on ? "bg-lantern text-white" : done ? "bg-pine-700 text-white" : "bg-pine-800 text-white/85"
                  )}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  {i === active && !reduce && <span key={step} aria-hidden className="loop-ripple absolute inset-0 rounded-full" />}
                  <Icon className="relative w-[42%] h-[42%]" strokeWidth={1.75} aria-hidden />
                </button>
                <span
                  aria-hidden
                  className={cn("absolute text-[14px] sm:text-[15px] font-medium whitespace-nowrap pointer-events-none transition-colors duration-300", i === active ? "text-white" : "text-white/70")}
                  style={{
                    left: `${l.x}%`,
                    top: `${l.y}%`,
                    transform: `translate(${l.cos > 0.3 ? "0" : l.cos < -0.3 ? "-100%" : "-50%"}, ${l.sin < -0.5 ? "-100%" : l.sin > 0.5 ? "0" : "-50%"})`,
                  }}
                >
                  {s.label}
                </span>
              </React.Fragment>
            );
          })}

          {/* What happens at this step, for this festival */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[41%] text-center" aria-live={auto ? "off" : "polite"}>
            {reduce ? (
              <div>
                <p className="font-display text-[clamp(1.25rem,3.2vw,1.75rem)] leading-tight font-semibold text-white">{translateSync(f.name)}</p>
                <p className="mt-1 text-[13px] sm:text-[14px] text-white/75 leading-snug">{translateTemplate("{material}, from collection to pass", { material })}</p>
              </div>
            ) : (
              <div key={`${festival}-${active}`} className="loop-detail">
                <span className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium text-glow">
                  <StageIcon className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
                  {stage.who}
                </span>
                <p className="mt-1 font-display text-[clamp(1.375rem,3.4vw,2rem)] leading-none font-semibold tracking-[-0.02em] text-white">{stage.label}</p>
                <p className="mt-2 text-[12.5px] sm:text-[14px] leading-[1.4] text-white/80 text-pretty hidden min-[400px]:block">{stage.body}</p>
              </div>
            )}
          </div>
        </div>

        {/* On the narrowest phones the centre is too small for the sentence, so it sits under the orbit */}
        {!reduce && (
          <p key={`${festival}-${active}-m`} className="loop-detail min-[400px]:hidden mt-4 text-center text-[15px] leading-[1.5] text-white/80 text-pretty">
            {stage.body}
          </p>
        )}
        {reduce && (
          <ol className="mt-8 space-y-3 max-w-md mx-auto">
            {stages.map((s) => (
              <li key={s.label} className="text-[15px] leading-[1.5] text-white/80">
                <span className="font-semibold text-white">{s.label}.</span> {s.body}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

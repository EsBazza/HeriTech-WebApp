"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileSignature, Hammer, Layers, Pause, Play, QrCode, ScanLine, ShieldCheck, Smartphone, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Reveal } from "@/components/motion/Reveal";
import { cn, useMediaQuery } from "@/components/ui";

const RING = 32; // ring radius, % of the orbit's width
const LABEL_GAP = 9; // label distance outside a node, % of width
const STEP_MS = 4200;
const COUNT = 5;

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
 * "The same loop at every festival": pick a festival and its material runs
 * through the five steps. Each step plays for a few seconds, timed by the
 * progress bar under the ring, and a lantern light carries it round to the next.
 * Step buttons, previous / next and play / pause give full control; playback
 * holds under the mouse and off screen, and never starts under reduced motion.
 */
export function FestivalLoop() {
  const { translateSync, translateTemplate } = useTranslation();
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const orbitRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [festival, setFestival] = useState(0);
  // `step` only grows, so the light always travels forward round the ring.
  const [step, setStep] = useState(0);
  // play: running · pause: held mid-step by the button · manual: the visitor picked a step
  const [mode, setMode] = useState<"play" | "pause" | "manual">("play");
  const auto = mode === "play";

  useEffect(() => {
    const el = orbitRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "0px 0px -15% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const f = FESTIVALS[festival];
  const material = translateSync(f.material);
  const active = step % COUNT;
  const playing = auto && !reduce && inView && !hovering;

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

  /** Go to step i, always moving forward round the ring. */
  const goTo = (i: number, keepPlaying = false) => {
    if (!keepPlaying) setMode("manual");
    setStep((s) => s + ((i - (s % COUNT) + COUNT) % COUNT));
  };
  const next = () => goTo((active + 1) % COUNT);
  const prev = () => {
    setMode("manual");
    setStep((s) => Math.max(0, s - 1) + (s === 0 ? COUNT - 1 : 0));
  };
  const chooseFestival = (i: number) => {
    setFestival(i);
    goTo(0, true);
    if (!reduce) setMode("play");
  };

  const pos = (i: number, r: number) => {
    const a = ((-90 + i * 72) * Math.PI) / 180;
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a), cos: Math.cos(a), sin: Math.sin(a) };
  };

  const circ = 2 * Math.PI * RING;
  const trail = (active / COUNT) * circ;
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
            {translateSync("One system for every festival and every kind of leftover. Pick one and follow its material round the loop.")}
          </p>
        </Reveal>

        <Reveal delay={90}>
          <div role="group" aria-label={translateSync("Choose a festival")} className="mt-8 grid grid-cols-2 gap-2 max-w-[440px]">
            {FESTIVALS.map((x, i) => (
              <button
                key={x.name}
                type="button"
                aria-pressed={festival === i}
                onClick={() => chooseFestival(i)}
                className={cn(
                  "flex flex-col items-start min-h-11 px-4 py-2 rounded-2xl text-left cursor-pointer transition-[background-color,color,scale] duration-200 active:scale-[0.97]",
                  festival === i ? "bg-white text-pine-900" : "bg-white/[0.07] text-white hover:bg-white/[0.13]"
                )}
              >
                <span className="text-[15px] font-semibold leading-tight">{translateSync(x.name)}</span>
                <span className={cn("text-[13px] leading-tight", festival === i ? "text-pine-700" : "text-white/65")}>
                  {translateSync(x.place)} · {translateSync(x.material)}
                </span>
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

      <div className="lg:col-span-7" onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)} onPointerLeave={() => setHovering(false)}>
        {/* The orbit */}
        <div ref={orbitRef} data-on={inView} className="festival-loop relative mx-auto w-full max-w-[540px] aspect-square">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
            <g className="loop-drift">
              <circle cx="50" cy="50" r="49" fill="none" stroke="rgb(255 255 255 / 0.09)" strokeWidth="0.25" strokeDasharray="0.6 2.4" />
            </g>
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgb(255 255 255 / 0.05)" strokeWidth="0.25" />
            <circle cx="50" cy="50" r={RING} fill="none" stroke="rgb(143 176 156 / 0.28)" strokeWidth="0.5" />
            {/* The lit trail: everything this batch has been through so far. It clears when a new batch starts. */}
            <circle
              cx="50"
              cy="50"
              r={RING}
              fill="none"
              stroke="#f2a65a"
              strokeWidth="0.9"
              strokeLinecap="round"
              className="loop-trail"
              style={{ strokeDasharray: `${circ}`, strokeDashoffset: circ - trail, transition: active === 0 ? "none" : undefined, opacity: active === 0 ? 0 : 1 }}
              transform="rotate(-90 50 50)"
            />
            <g className="loop-comet" style={{ transform: `rotate(${step * 72}deg)` }}>
              <circle cx="50" cy={50 - RING} r="3.2" fill="#f2a65a" opacity="0.18" />
              <circle cx="50" cy={50 - RING} r="1.4" fill="#f2a65a" />
            </g>
            <circle cx="50" cy="50" r="22.5" className="loop-centre" />
          </svg>

          {stages.map((s, i) => {
            const p = pos(i, RING);
            const l = pos(i, RING + LABEL_GAP);
            const Icon = s.icon;
            const on = i === active;
            const done = i < active;
            return (
              <React.Fragment key={i}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-pressed={on}
                  aria-label={translateTemplate("Step {n} of 5, {step}", { n: String(i + 1), step: s.label })}
                  data-on={on}
                  className={cn(
                    "loop-step absolute w-[13%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer",
                    on ? "bg-lantern text-white" : done ? "bg-pine-700 text-white" : "bg-pine-800 text-white/85"
                  )}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  {on && !reduce && <span key={step} aria-hidden className="loop-ripple absolute inset-0 rounded-full" />}
                  <Icon className="relative w-[42%] h-[42%]" strokeWidth={1.75} aria-hidden />
                </button>
                <span
                  aria-hidden
                  className={cn("absolute text-[14px] sm:text-[15px] font-medium whitespace-nowrap pointer-events-none transition-colors duration-300", on ? "text-white" : "text-white/70")}
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
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[41%] text-center pointer-events-none">
            <div key={`${festival}-${active}`} className="loop-detail">
              <span className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium text-glow">
                <StageIcon className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
                {stage.who}
              </span>
              <p className="mt-1 font-display text-[clamp(1.375rem,3.4vw,2rem)] leading-none font-semibold tracking-[-0.02em] text-white">{stage.label}</p>
              <p className="mt-2 text-[12.5px] sm:text-[14px] leading-[1.4] text-white/80 text-pretty hidden min-[400px]:block">{stage.body}</p>
            </div>
          </div>
        </div>

        {/* On the narrowest phones the centre is too small for the sentence, so it sits under the orbit */}
        <p key={`${festival}-${active}-m`} className="loop-detail min-[400px]:hidden mt-2 text-center text-[15px] leading-[1.5] text-white/80 text-pretty">
          {stage.body}
        </p>

        {/* Controls: where you are, how long this step has left, and the way to take over */}
        <div className="mt-6 mx-auto max-w-[440px]">
          <div className="grid grid-cols-5 gap-1.5" aria-hidden>
            {stages.map((s, i) => (
              <span key={i} className="loop-seg h-1 rounded-full bg-white/15 overflow-hidden">
                {i < active && <span className="block h-full w-full bg-white/60" />}
                {i === active && (
                  <span
                    key={`${step}-${festival}-${mode === "manual"}`}
                    className={cn("block h-full w-full bg-glow origin-left", mode !== "manual" && !reduce && "loop-seg-fill")}
                    style={{ animationDuration: `${STEP_MS}ms`, animationPlayState: playing ? "running" : "paused" }}
                    onAnimationEnd={() => setStep((x) => x + 1)}
                  />
                )}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-[15px] text-white/80" aria-live={auto ? "off" : "polite"}>
              <span className="tabular text-white font-medium">{translateTemplate("Step {n} of 5", { n: String(active + 1) })}</span>
              <span className="sr-only">. {stage.label}. {stage.body}</span>
            </p>
            <div className="flex items-center gap-1 -mr-2">
              <button type="button" onClick={prev} aria-label={translateSync("Previous step")} className="loop-ctl">
                <ChevronLeft className="w-5 h-5" />
              </button>
              {!reduce && (
                <button type="button" onClick={() => setMode(auto ? "pause" : "play")} aria-pressed={auto} aria-label={auto ? translateSync("Pause the loop") : translateSync("Play the loop")} className="loop-ctl">
                  {auto ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              )}
              <button type="button" onClick={next} aria-label={translateSync("Next step")} className="loop-ctl">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

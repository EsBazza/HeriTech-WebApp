"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useInView } from "@/components/motion/Reveal";
import { cn, useMediaQuery } from "@/components/ui";

export interface LedgerFigures {
  kg: number;
  artisans: number;
  passes: number;
  charity: number;
}

/** Counts every copy of the figures up together, once, when the band enters view. */
function useCountIn(active: boolean, duration = 1600) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setP(1);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setP(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, duration]);
  return p;
}

/**
 * One endless row. It drifts on its own, speeds up with the page scroll and
 * follows the scroll's direction, and eases to a stop under a mouse so a figure
 * can be read. Off screen it stops drawing.
 */
function MarqueeTrack({
  children,
  speed,
  reverse = false,
  className,
}: {
  children: React.ReactNode;
  /** Resting speed in px per second. */
  speed: number;
  reverse?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const [copies, setCopies] = useState(2);

  // Enough copies to cover the row twice over, whatever the screen width.
  useEffect(() => {
    const wrap = wrapRef.current;
    const copy = copyRef.current;
    if (!wrap || !copy) return;
    const measure = () => {
      const w = copy.offsetWidth;
      if (w > 0) setCopies(Math.max(2, Math.ceil(wrap.offsetWidth / w) + 1));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(copy);
    measure();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const rail = railRef.current;
    const copy = copyRef.current;
    if (!wrap || !rail || !copy) return;

    let frame = 0;
    let last = 0;
    let lastY = window.scrollY;
    let x = 0;
    let boost = 1;
    let dir = 1;
    let pace = 1;

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (dy !== 0) dir = dy > 0 ? 1 : -1;

      const ease = (rate: number) => 1 - Math.exp(-dt * rate);
      const scrollSpeed = dt > 0 ? Math.abs(dy) / dt : 0;
      boost += (1 + Math.min(scrollSpeed / 350, 5) - boost) * ease(6);
      pace += ((hovered.current ? 0 : 1) - pace) * ease(5);

      const w = copy.offsetWidth || 1;
      x -= speed * boost * pace * dir * (reverse ? -1 : 1) * dt;
      x = ((x % w) - w) % w;
      rail.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      frame = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) {
        last = 0;
        lastY = window.scrollY;
        frame = requestAnimationFrame(tick);
      }
    });
    io.observe(wrap);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [speed, reverse]);

  return (
    <div
      ref={wrapRef}
      className={cn("marquee overflow-hidden", className)}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
      }}
    >
      <div ref={railRef} className="flex w-max will-change-transform">
        {Array.from({ length: copies }, (_, i) => (
          <div key={i} ref={i === 0 ? copyRef : undefined} className="flex shrink-0 items-center">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A four-point spark in lantern light, turning slowly as it travels. */
function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("marquee-spark shrink-0", className)}>
      <path d="M12 0c.7 6.6 4.8 10.9 12 12-7.2 1.1-11.3 5.4-12 12-.7-6.6-4.8-10.9-12-12C7.2 10.9 11.3 6.6 12 0Z" fill="currentColor" />
    </svg>
  );
}

/**
 * The band under the hero: the live ledger figures as one endless line of type,
 * over a slower tape of the steps every piece goes through, running the other way.
 */
export function LedgerMarquee({ stats, offline }: { stats: LedgerFigures | null; offline: boolean }) {
  const { translateSync, formatNumber, formatCurrency } = useTranslation();
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const { ref, inView } = useInView<HTMLElement>();
  const p = useCountIn(inView && stats != null);

  const figures = [
    { label: translateSync("of festival material traced"), value: stats ? formatNumber(Math.round(stats.kg * p * 10) / 10) : "—", unit: "kg" },
    { label: translateSync("verified artisans"), value: stats ? formatNumber(Math.round(stats.artisans * p)) : "—" },
    { label: translateSync("impact passes issued"), value: stats ? formatNumber(Math.round(stats.passes * p)) : "—" },
    { label: translateSync("raised for charity and upkeep"), value: stats ? formatCurrency(Math.round(stats.charity * p * 100) / 100) : "—" },
  ];

  const steps = [
    translateSync("Collected at the festival"),
    translateSync("Classified by Gemini"),
    translateSync("Matched to a verified artisan"),
    translateSync("Made by hand"),
    translateSync("Verified on the public record"),
  ];

  const figureRow = figures.map((f) => (
    <span key={f.label} className="flex items-baseline gap-[0.35em] pr-[0.6em] whitespace-nowrap">
      <span className="font-display font-semibold tabular tracking-[-0.03em] text-white">
        {f.value}
        {f.unit && <span className="ml-[0.12em] text-[0.5em] font-medium tracking-normal text-white/70">{f.unit}</span>}
      </span>
      <span className="font-display italic font-medium text-[0.42em] tracking-[-0.005em] text-white/70">{f.label}</span>
      <Spark className="ml-[0.45em] w-[0.32em] h-[0.32em] self-center text-glow" />
    </span>
  ));

  return (
    <section ref={ref} className="ledger-band text-white" aria-labelledby="ledger-title">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-12 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="ledger-title" className="flex items-center gap-2.5 text-base font-medium text-white/85">
          <span className={cn("w-2 h-2 rounded-full shrink-0", offline ? "bg-warn" : "bg-pine-300 ledger-pulse")} aria-hidden />
          {offline ? translateSync("The ledger can't be reached right now.") : translateSync("Live from the HeriTech ledger")}
        </h2>
        <a href="/impact" className="inline-flex items-center gap-1.5 min-h-11 text-base text-white/80 hover:text-white transition-colors">
          {translateSync("See the full impact record")}
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {/* Read by screen readers once, in order; the moving rows below are decoration */}
      <dl className="sr-only">
        {figures.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>{stats ? `${f.value}${f.unit ? ` ${f.unit}` : ""}` : translateSync("Not available")}</dd>
          </div>
        ))}
      </dl>

      <div aria-hidden className="mt-4 lg:mt-6">
        {reduce ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-y-2 text-[clamp(3.5rem,7vw,6.5rem)] leading-[1.05]">{figureRow}</div>
        ) : (
          <MarqueeTrack speed={46} className="marquee-fade py-2 text-[clamp(3.5rem,7vw,6.5rem)] leading-[1.05]">
            {figureRow}
          </MarqueeTrack>
        )}

        {/* The tape: every piece's five steps, running against the figures */}
        <div className="marquee-tape mt-6 lg:mt-8">
          {reduce ? (
            <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-[14px] uppercase tracking-[0.18em] text-white/70">{steps.join(" · ")}</p>
          ) : (
            <MarqueeTrack speed={30} reverse className="py-4">
              {steps.map((s, i) => (
                <span key={s} className="flex items-center gap-5 pr-5 whitespace-nowrap text-[14px] font-medium uppercase tracking-[0.18em] text-white/75">
                  <span className="font-display italic normal-case tracking-normal text-[20px] text-glow tabular">{String(i + 1).padStart(2, "0")}</span>
                  {s}
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                </span>
              ))}
            </MarqueeTrack>
          )}
        </div>
      </div>
    </section>
  );
}

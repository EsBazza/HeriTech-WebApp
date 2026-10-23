"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
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
 * One endless row. It drifts on its own, picks up speed with the page scroll and
 * follows its direction, and eases to a stop under the mouse or when paused.
 * The figure passing the middle of the screen comes up to full light; the rest
 * sit back. Positions are measured on resize only, so a frame writes styles and
 * reads nothing. Off screen it stops drawing.
 */
function MarqueeTrack({ children, speed, paused, className }: { children: React.ReactNode; speed: number; paused: boolean; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const pausedRef = useRef(paused);
  const layout = useRef({ copy: 1, view: 1, items: [] as { el: HTMLElement; mid: number }[] });
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const rail = railRef.current;
    const copy = copyRef.current;
    if (!wrap || !rail || !copy) return;
    const measure = () => {
      const w = copy.offsetWidth;
      if (w <= 0) return;
      setCopies(Math.max(2, Math.ceil(wrap.offsetWidth / w) + 1));
      layout.current = {
        copy: w,
        view: wrap.offsetWidth,
        items: [...rail.querySelectorAll<HTMLElement>("[data-mq-item]")].map((el) => ({ el, mid: el.offsetLeft + el.offsetWidth / 2 })),
      };
    };
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(copy);
    measure();
    return () => ro.disconnect();
  }, [copies]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const rail = railRef.current;
    if (!wrap || !rail) return;

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
      boost += (1 + Math.min(scrollSpeed / 450, 3.5) - boost) * ease(5);
      pace += ((hovered.current || pausedRef.current ? 0 : 1) - pace) * ease(5);

      const { copy: w, view, items } = layout.current;
      x -= speed * boost * pace * dir * dt;
      x = ((x % w) - w) % w;
      rail.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;

      // The spotlight: full light at the centre, falling off over half the row.
      const half = view / 2;
      for (const it of items) {
        const d = Math.min(Math.abs(it.mid + x - half) / half, 1);
        const f = 1 - d * d;
        it.el.style.opacity = (0.38 + 0.62 * f).toFixed(3);
        it.el.style.setProperty("--lit", f.toFixed(3));
      }
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
  }, [speed]);

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

/** The band under the hero: the live ledger figures as one endless line of type. */
export function LedgerMarquee({ stats, offline }: { stats: LedgerFigures | null; offline: boolean }) {
  const { translateSync, formatNumber, formatCurrency } = useTranslation();
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [paused, setPaused] = useState(false);
  const { ref, inView } = useInView<HTMLElement>();
  const p = useCountIn(inView && stats != null);

  const figures = [
    { label: translateSync("of festival material traced"), value: stats ? formatNumber(Math.round(stats.kg * p * 10) / 10) : "—", unit: "kg" },
    { label: translateSync("verified artisans"), value: stats ? formatNumber(Math.round(stats.artisans * p)) : "—" },
    { label: translateSync("impact passes issued"), value: stats ? formatNumber(Math.round(stats.passes * p)) : "—" },
    { label: translateSync("raised for charity and upkeep"), value: stats ? formatCurrency(Math.round(stats.charity * p * 100) / 100) : "—" },
  ];

  const row = figures.map((f) => (
    <span key={f.label} className="flex items-center">
      <span data-mq-item className="mq-item flex items-center gap-3.5 sm:gap-4">
        <span className="font-display font-semibold tabular lining-nums text-[clamp(2.75rem,5.2vw,4.75rem)] leading-[0.9] tracking-[-0.04em] text-white whitespace-nowrap">
          {f.value}
          {f.unit && <span className="ml-1 font-display text-[0.42em] font-medium italic tracking-[-0.01em] text-white/75">{f.unit}</span>}
        </span>
        <span className="max-w-[12.5ch] text-[15px] sm:text-[16px] leading-[1.25] font-medium text-white/80 text-balance">{f.label}</span>
      </span>
      <span aria-hidden className="mq-mark mx-7 sm:mx-10 lg:mx-12" />
    </span>
  ));

  return (
    <section ref={ref} className="ledger-band ledger-band--plain text-white py-8 lg:py-10" aria-labelledby="ledger-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-x-6">
        <h2 id="ledger-title" className="flex items-center gap-2.5 text-[15px] font-medium text-white/90">
          <span className={cn("ledger-live w-2 h-2 rounded-full shrink-0", offline ? "bg-warn" : "bg-pine-300")} aria-hidden />
          {offline ? translateSync("The ledger can't be reached right now.") : translateSync("Live from the HeriTech ledger")}
        </h2>
        <div className="flex items-center gap-1 -mr-2.5">
          <a href="/impact" className="group inline-flex items-center gap-1.5 min-h-11 sm:px-2 text-[15px] text-white/80 hover:text-white transition-colors">
            {translateSync("See the full impact record")}
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
          {!reduce && (
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-pressed={paused}
              aria-label={paused ? translateSync("Play the figures") : translateSync("Pause the figures")}
              className="w-11 h-11 inline-flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-[background-color,color,transform] cursor-pointer"
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Read by screen readers once, in order; the moving row is decoration */}
      <dl className="sr-only">
        {figures.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>{stats ? `${f.value}${f.unit ? ` ${f.unit}` : ""}` : translateSync("Not available")}</dd>
          </div>
        ))}
      </dl>

      <div aria-hidden className="mt-3 lg:mt-4">
        {reduce ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-y-5">{row}</div>
        ) : (
          <MarqueeTrack speed={44} paused={paused} className="marquee-fade py-2">
            {row}
          </MarqueeTrack>
        )}
      </div>
    </section>
  );
}

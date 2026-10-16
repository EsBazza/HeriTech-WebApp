"use client";

import React, { useEffect, useState } from "react";
import { useInView } from "./Reveal";

interface CountUpProps {
  value: number;
  /** Formats the in-flight number (e.g. currency, locale grouping). */
  format?: (n: number) => string;
  duration?: number;
  decimals?: number;
}

/** Counts from 0 to `value` the first time it enters the viewport. */
export function CountUp({ value, format = (n) => String(n), duration = 1400, decimals = 0 }: CountUpProps) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const factor = 10 ** decimals;
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(eased * value * factor) / factor);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, decimals]);

  return (
    <span ref={ref} className="tabular">
      {format(shown)}
    </span>
  );
}

export default CountUp;

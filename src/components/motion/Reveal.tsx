"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui";

/** Fires once when the element scrolls into view. */
export function useInView<T extends Element>(options: IntersectionObserverInit = { rootMargin: "0px 0px -10% 0px" }) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);
  return { ref, inView };
}

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Delay in ms, for simple staggering of siblings. */
  delay?: number;
}

/**
 * Subtle fade-up on scroll. Content is only hidden once JS is running
 * (html.js), so it stays readable without JS and for crawlers.
 */
export function Reveal({ delay = 0, className, style, children, ...props }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("reveal", inView && "is-visible", className)} style={delay ? ({ ...style, "--reveal-delay": `${delay}ms` } as React.CSSProperties) : style} {...props}>
      {children}
    </div>
  );
}

export default Reveal;

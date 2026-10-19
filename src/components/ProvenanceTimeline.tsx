"use client";

import React from "react";
import { cn } from "@/components/ui";
import { useInView } from "@/components/motion/Reveal";

export interface ProvenanceEvent {
  title: React.ReactNode;
  detail?: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  /** Pending steps render muted with a hollow marker. */
  pending?: boolean;
}

/** Vertical chain-of-custody list used on product and verify pages. */
export function ProvenanceTimeline({
  events,
  className,
  animate = false,
}: {
  events: ProvenanceEvent[];
  className?: string;
  /** Draw the chain step by step when it scrolls into view. */
  animate?: boolean;
}) {
  const { ref, inView } = useInView<HTMLOListElement>();
  return (
    <ol ref={ref} className={cn("relative", animate && "journey", animate && inView && "is-visible", className)}>
      {events.map((e, i) => {
        const last = i === events.length - 1;
        return (
          <li key={i} className="journey-step relative flex gap-4 pb-6 last:pb-0" style={{ ["--i" as string]: i }}>
            {!last && <span className="journey-line absolute left-[15px] top-8 bottom-0 w-px bg-line-strong" aria-hidden />}
            <span
              className={cn(
                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                e.pending ? "bg-surface border-dashed border-line-strong text-ink-3" : "bg-pine-100 border-pine-200 text-pine-700"
              )}
            >
              {e.icon ?? <span className="w-2 h-2 rounded-full bg-current" />}
            </span>
            <div className="min-w-0 pt-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h4 className={cn("text-[15px] font-medium font-sans", e.pending ? "text-ink-3" : "text-ink")}>{e.title}</h4>
                {e.meta && <span className="text-xs text-ink-3 tabular">{e.meta}</span>}
              </div>
              {e.detail && <div className="text-sm text-ink-2 mt-1 leading-relaxed">{e.detail}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default ProvenanceTimeline;

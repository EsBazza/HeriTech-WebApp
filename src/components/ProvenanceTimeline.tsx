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

/**
 * Vertical chain-of-custody list used on product and verify pages, drawn as a
 * string of lanterns: recorded steps are lit, the latest one keeps a soft
 * breathing halo, and steps still to come stay dark.
 */
export function ProvenanceTimeline({
  events,
  className,
  animate = false,
}: {
  events: ProvenanceEvent[];
  className?: string;
  /** Light the lanterns one after another when the list scrolls into view. */
  animate?: boolean;
}) {
  const { ref, inView } = useInView<HTMLOListElement>();
  const latest = events.reduce((acc, e, i) => (e.pending ? acc : i), -1);

  return (
    <ol ref={ref} className={cn("relative", animate && "journey", animate && inView && "is-visible", className)}>
      {events.map((e, i) => {
        const last = i === events.length - 1;
        const nextLit = !last && !events[i + 1].pending;
        return (
          <li
            key={i}
            className="journey-step relative flex gap-4 pb-6 last:pb-0"
            style={{ ["--i" as string]: i }}
            aria-current={i === latest ? "step" : undefined}
          >
            {!last && (
              <span className={cn("journey-line absolute left-[15px] top-8 bottom-0 w-px", nextLit ? "bg-lantern/45" : "bg-line-strong")} aria-hidden />
            )}
            <span className="relative z-10 shrink-0">
              {i === latest && <span className="journey-halo" aria-hidden />}
              <span
                className={cn(
                  "relative w-8 h-8 rounded-full flex items-center justify-center border",
                  e.pending ? "bg-surface border-dashed border-line-strong text-ink-3" : "journey-lamp bg-lantern-100 border-lantern/35 text-lantern-600",
                )}
              >
                {e.icon ?? <span className="w-2 h-2 rounded-full bg-current" />}
              </span>
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

/**
 * The same journey as a compact horizontal string, for sheets and cards.
 * `reached` is the index of the latest step that has happened.
 */
export function LanternString({ steps, reached, className, label }: { steps: string[]; reached: number; className?: string; label?: string }) {
  return (
    <ol className={cn("flex items-start", className)} aria-label={label}>
      {steps.map((step, i) => {
        const lit = i <= reached;
        const current = i === reached;
        return (
          <li key={step} className="relative flex-1 flex flex-col items-center text-center min-w-0" aria-current={current ? "step" : undefined}>
            {i > 0 && (
              <span
                className={cn("absolute top-[7px] right-1/2 w-full h-px transition-colors duration-500", i <= reached ? "bg-lantern/50" : "bg-line-strong")}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "lantern-dot relative z-10 w-[15px] h-[15px] rounded-full border-2",
                lit ? "bg-lantern border-lantern-100" : "bg-surface border-line-strong",
              )}
              data-lit={lit}
              data-current={current}
              aria-hidden
            />
            <span className={cn("mt-1.5 text-xs leading-tight px-0.5", current ? "text-ink font-medium" : lit ? "text-ink-2" : "text-ink-3")}>
              {step}
              <span className="sr-only">{lit ? ", done" : ", not yet"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default ProvenanceTimeline;

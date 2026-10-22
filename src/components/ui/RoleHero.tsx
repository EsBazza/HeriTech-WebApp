import React from "react";
import { cn } from "./cn";
import { Stat } from "./Stat";

export interface RoleHeroStat {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

interface RoleHeroProps {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Primary action(s), shown top-right on desktop. */
  actions?: React.ReactNode;
  stats?: RoleHeroStat[];
  /** Slim: no stats row, less padding (for map-style pages). */
  slim?: boolean;
  /** Max width of the inner column; match the page content below so the edges line up. */
  width?: "4xl" | "6xl" | "7xl";
  className?: string;
}

const WIDTH = { "4xl": "max-w-4xl", "6xl": "max-w-6xl", "7xl": "max-w-7xl" } as const;

/**
 * Header band for every workspace: the hero's palette (pine scrim lit by the
 * lantern's amber) with what this person has done so far and what to do next.
 */
export function RoleHero({ eyebrow, title, description, actions, stats, slim, width = "7xl", className }: RoleHeroProps) {
  return (
    <section className={cn("ledger-band text-white", className)}>
      <div className={cn("relative mx-auto px-4 sm:px-6 lg:px-8", WIDTH[width], slim ? "py-8" : "py-10 lg:py-12")}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <span className="block text-xs font-semibold uppercase tracking-wide text-pine-300">{eyebrow}</span>
            <h1 className="font-display text-4xl sm:text-[44px] leading-[1.05] font-semibold text-white">{title}</h1>
            {description && <p className="text-[15px] text-white/75">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>

        {!slim && stats && stats.length > 0 && (
          <div className={cn("mt-8 grid grid-cols-2 gap-3", stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-sm p-4 sm:p-5">
                  {Icon && (
                    <span className="ledger-icon mb-3 w-8 h-8 rounded-full flex items-center justify-center" aria-hidden>
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </span>
                  )}
                  <Stat tone="dark" label={s.label} value={s.value} unit={s.unit} hint={s.hint} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

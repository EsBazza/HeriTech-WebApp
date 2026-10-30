"use client";

import React from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { SPLIT, calculateEscrowSplit } from "@/lib/escrow";
import { cn } from "@/components/ui";
import { useInView } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";

interface EscrowBarProps {
  /** When provided, each row shows the actual amount for this price. */
  amount?: number;
  /** HeriTech Circle reward; it comes out of the developers' row only, so the rows add up to what the buyer pays. */
  discountPercent?: number;
  /** Names the NGO or tree-planting partner in the NGO row. */
  ngoName?: string;
  /** Hide per-row descriptions for tight spaces (cards, checkout). */
  compact?: boolean;
  /** Fill the bar and count up the amounts when it scrolls into view. */
  animate?: boolean;
  className?: string;
}

/** The single artisan / LGU / developers / NGO split visual used across the app. */
export function EscrowBar({ amount, discountPercent = 0, ngoName, compact, animate = false, className }: EscrowBarProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const { translateSync, formatCurrency } = useTranslation();
  const split = amount != null ? calculateEscrowSplit(amount, { discountPercent }) : null;

  const rows = [
    {
      key: "artisan",
      pct: SPLIT.artisan,
      color: "bg-split-artisan",
      label: translateSync("Paid to artisan"),
      desc: translateSync("Sent to the maker or cooperative, with a fair-trade floor price."),
      value: split?.artisanPayout,
    },
    {
      key: "lgu",
      pct: SPLIT.lgu,
      color: "bg-split-platform",
      label: translateSync("Paid to the local government"),
      desc: translateSync("Covers municipal collection, sorting and transport of festival material."),
      value: split?.lguShare,
    },
    {
      key: "developers",
      pct: SPLIT.developers,
      color: "bg-split-dev",
      label: translateSync("Paid to the developers"),
      desc: translateSync("Keeps HeriTech built, hosted and secure."),
      value: split?.developerShare,
    },
    {
      key: "ngo",
      pct: SPLIT.ngo,
      color: "bg-split-ngo",
      label: ngoName ? `${translateSync("Paid to")} ${translateSync(ngoName)}` : translateSync("Paid to NGOs & tree planting"),
      desc: translateSync("Goes to a partner NGO or tree-planting group."),
      value: split?.ngoShare,
    },
  ];

  return (
    <div ref={ref} className={cn("space-y-4", animate && "split-anim", animate && inView && "is-visible", className)}>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-paper-2"
        role="img"
        aria-label={`${SPLIT.artisan}% artisan, ${SPLIT.lgu}% local government, ${SPLIT.developers}% developers, ${SPLIT.ngo}% NGOs and tree planting`}
      >
        {rows.map((r) => (
          <div key={r.key} className={cn("split-seg h-full", r.color)} style={{ width: `${r.pct}%` }} />
        ))}
      </div>

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.key} className="flex items-start gap-3">
            <span className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", r.color)} aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink">
                  <span className="tabular text-ink-3 mr-1.5">{r.pct}%</span>
                  {r.label}
                </span>
                {r.value != null && (
                  <span className="tabular text-sm font-semibold text-ink">
                    {animate ? <CountUp value={r.value} decimals={2} format={formatCurrency} /> : formatCurrency(r.value)}
                  </span>
                )}
              </div>
              {!compact && <p className="text-xs text-ink-3 mt-0.5">{r.desc}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EscrowBar;

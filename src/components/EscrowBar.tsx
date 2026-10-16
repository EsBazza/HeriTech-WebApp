"use client";

import React from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { SPLIT, calculateEscrowSplit } from "@/lib/escrow";
import { cn } from "@/components/ui";

interface EscrowBarProps {
  /** When provided, each row shows the actual amount for this price. */
  amount?: number;
  /** Overrides the NGO row label with the partner fund name. */
  ngoName?: string;
  /** Hide per-row descriptions for tight spaces (cards, checkout). */
  compact?: boolean;
  className?: string;
}

/** The single 70 / 20 / 10 split visual used across the app. */
export function EscrowBar({ amount, ngoName, compact, className }: EscrowBarProps) {
  const { translateSync, formatCurrency } = useTranslation();
  const split = amount != null ? calculateEscrowSplit(amount) : null;

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
      key: "platform",
      pct: SPLIT.platform,
      color: "bg-split-platform",
      label: translateSync("Collection & platform"),
      desc: translateSync("Covers municipal collection, transport and running HeriTech."),
      value: split?.platformFee,
    },
    {
      key: "ngo",
      pct: SPLIT.ngo,
      color: "bg-split-ngo",
      label: ngoName ? `${translateSync("Donated to")} ${translateSync(ngoName)}` : translateSync("Donated to NGO partner"),
      desc: translateSync("Logged publicly on the impact ledger for every sale."),
      value: split?.ngoContribution,
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-paper-2" role="img" aria-label="70% artisan, 20% platform, 10% NGO">
        {rows.map((r) => (
          <div key={r.key} className={cn("h-full", r.color)} style={{ width: `${r.pct}%` }} />
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
                  <span className="tabular text-sm font-semibold text-ink">{formatCurrency(r.value)}</span>
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

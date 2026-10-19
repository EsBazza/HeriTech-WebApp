"use client";

import React, { useEffect, useState } from "react";
import { Gift, Wallet } from "lucide-react";
import { apiJson } from "@/lib/api";
import { useTranslation } from "@/contexts/TranslationContext";
import type { LoyaltyState } from "@/lib/loyalty";

interface LoyaltyResponse extends LoyaltyState {
  rules: { passesForReward: number; spendForReward: number; discountPercent: number };
  summary: string;
  saveUrl: string | null;
}

function Progress({ label, value, max, display }: { label: string; value: number; max: number; display: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-white/70">{label}</span>
        <span className="tabular font-medium">{display}</span>
      </div>
      <div className="h-2 rounded-full bg-white/15 overflow-hidden">
        <div className="h-full rounded-full bg-lantern transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** HeriTech Circle progress for the signed-in buyer, with their Google Wallet loyalty card. */
export function LoyaltyCard() {
  const { translateSync, formatCurrency } = useTranslation();
  const [data, setData] = useState<LoyaltyResponse | null>(null);

  useEffect(() => {
    apiJson<LoyaltyResponse>("/api/loyalty").then((result) => result.success && result.data && setData(result.data));
  }, []);

  if (!data) return null;
  const { rules } = data;

  return (
    <div className="rounded-lg bg-pine-800 text-white p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">{translateSync("HeriTech Circle")}</p>
          <p className="font-display text-2xl font-semibold mt-1">
            {data.rewardAvailable
              ? translateSync(`${rules.discountPercent}% off your next order is ready`)
              : translateSync(`Unlock ${rules.discountPercent}% off your next order`)}
          </p>
        </div>
        <span className="w-10 h-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
          <Gift className="w-5 h-5 text-lantern" />
        </span>
      </div>

      {!data.rewardAvailable && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Progress
            label={translateSync("Impact Passes")}
            value={data.passesTowardReward}
            max={rules.passesForReward}
            display={`${data.passesTowardReward} / ${rules.passesForReward}`}
          />
          <Progress
            label={translateSync("Spent")}
            value={data.spendTowardReward}
            max={rules.spendForReward}
            display={`${formatCurrency(data.spendTowardReward)} / ${formatCurrency(rules.spendForReward)}`}
          />
        </div>
      )}

      <p className="text-xs text-white/70">
        {translateSync(
          `Collect ${rules.passesForReward} passes or spend $${rules.spendForReward}, whichever comes first. The discount comes from HeriTech's share, so artisans and local governments are always paid in full.`
        )}
      </p>

      {data.saveUrl && (
        <a
          href={data.saveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-medium text-white hover:opacity-90"
        >
          <Wallet className="h-4 w-4" aria-hidden />
          {translateSync("Add loyalty card to Google Wallet")}
        </a>
      )}
    </div>
  );
}

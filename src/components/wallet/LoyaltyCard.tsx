"use client";

import React, { useEffect, useState } from "react";
import { Gift, RefreshCw } from "lucide-react";
import { apiJson } from "@/lib/api";
import { useTranslation } from "@/contexts/TranslationContext";
import { WalletButtonLink } from "@/components/wallet/AddToWalletButton";
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
      <div className="flex items-baseline justify-between text-sm">
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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setFailed(false);
    apiJson<LoyaltyResponse>("/api/loyalty").then((result) => {
      if (result.success && result.data) setData(result.data);
      else setFailed(true);
    });
  }, [attempt]);

  if (!data && failed) {
    return (
      <div className="rounded-lg bg-pine-800 text-white p-5 flex flex-wrap items-center justify-between gap-3" role="alert">
        <p className="text-sm text-white/80">{translateSync("Your HeriTech Circle progress couldn't load.")}</p>
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="inline-flex items-center gap-2 min-h-11 px-4 rounded-md text-sm font-medium bg-white/10 hover:bg-white/15 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          {translateSync("Try again")}
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg bg-pine-800 p-5 sm:p-6 space-y-4 animate-pulse" role="status" aria-label={translateSync("Loading HeriTech Circle")}>
        <div className="h-3 w-28 rounded-full bg-white/15" />
        <div className="h-6 w-3/4 rounded-full bg-white/15" />
        <div className="h-2 w-full rounded-full bg-white/10" />
      </div>
    );
  }
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

      <p className="text-sm">
        <span className="font-display text-2xl font-semibold tabular">{data.kgDiverted ?? 0} kg</span>{" "}
        <span className="text-white/70">{translateSync("of festival material diverted by your purchases")}</span>
      </p>

      <p className="text-sm text-white/70">
        {translateSync(
          `Collect ${rules.passesForReward} passes or spend ${formatCurrency(rules.spendForReward)}, whichever comes first. The discount comes from HeriTech's share, so artisans and local governments are always paid in full.`
        )}
      </p>

      {data.saveUrl && <WalletButtonLink href={data.saveUrl} />}
    </div>
  );
}

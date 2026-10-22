"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { EscrowBar } from "@/components/EscrowBar";
import { Badge, Card, RoleHero, SectionHeader, Skeleton, cn, type BadgeTone } from "@/components/ui";
import { Coins, Landmark, Leaf as LeafIcon, QrCode as PassIcon } from "lucide-react";
import { apiJson } from "@/lib/api";
import type { PublicStats } from "@/app/api/stats/route";
import { SPLIT } from "@/lib/escrow";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  role: "artisan" | "lgu";
  country: string | null;
  kgDiverted: number;
  batches: number;
}

type FilterRole = "all" | LeaderboardEntry["role"];

export default function ImpactLeaderboardPage() {
  const { user } = useAuth();
  const { formatNumber, formatCurrency, translateSync } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState<FilterRole>("all");
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    apiJson<PublicStats>("/api/stats").then((result) => {
      if (result.success && result.data) setStats(result.data);
      else setOffline(true);
      setLoading(false);
    });
  }, []);

  const leaderboard: LeaderboardEntry[] = stats?.leaderboard ?? [];
  const filteredData = leaderboard.filter((entry) => selectedFilter === "all" || entry.role === selectedFilter);
  const maxKg = Math.max(1, ...leaderboard.map((e) => e.kgDiverted));

  const roleTag: Record<LeaderboardEntry["role"], { label: string; tone: BadgeTone }> = {
    artisan: { label: translateSync("Artisan"), tone: "pine" },
    lgu: { label: translateSync("Local government officer"), tone: "neutral" },
  };

  const split = stats?.escrowSplitSummary;
  const festivals = stats?.festivals ?? [];
  const v = (x: React.ReactNode) => (loading ? <Skeleton className="h-8 w-24" /> : offline ? "—" : x);

  return (
    <div>
      <RoleHero
        width="6xl"
        eyebrow={translateSync("Public impact record")}
        title={translateSync("Global impact")}
        description={translateSync("Live totals from every collection, sale and donation recorded on HeriTech. Anyone can check this page.")}
        stats={[
          { icon: LeafIcon, label: translateSync("Material collected"), unit: "kg", hint: translateSync("Logged at collection points after festivals"), value: loading ? "—" : offline ? "—" : formatNumber(stats?.totalKgCollected ?? 0) },
          { icon: Coins, label: translateSync("Paid to artisans"), hint: `${SPLIT.artisan}% ${translateSync("of every sale")}`, value: loading ? "—" : offline ? "—" : formatCurrency(split?.artisanPayout ?? 0) },
          { icon: Landmark, label: translateSync("Paid to local governments"), hint: `${SPLIT.lgu}% ${translateSync("of every sale")}`, value: loading ? "—" : offline ? "—" : formatCurrency(split?.lguShare ?? 0) },
          { icon: PassIcon, label: translateSync("Impact passes issued"), hint: translateSync("Each one publicly verifiable"), value: loading ? "—" : offline ? "—" : formatNumber(stats?.totalPassesIssued ?? 0) },
        ]}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-12">
      {offline && (
        <p role="alert" className="text-sm text-warn bg-warn-100 border border-warn/20 rounded-md px-4 py-2.5">
          {translateSync("The figures can't load right now. Try again shortly.")}
        </p>
      )}

      {/* Festivals + money */}
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-ink font-sans">{translateSync("Collection by festival")}</h2>
          <p className="text-sm text-ink-3">{translateSync("Collected so far against each release agreement's agreed quota.")}</p>
          {loading ? (
            <div className="mt-6 space-y-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : festivals.length === 0 ? (
            <p className="mt-6 text-sm text-ink-3">{translateSync("No release agreements recorded yet.")}</p>
          ) : (
            <ul className="mt-6 space-y-5">
              {festivals.map((f) => {
                const pct = Math.min(100, Math.max(0, f.quotaProgress ?? 0));
                const over = f.collectedKg > f.allocatedKg;
                return (
                  <li key={`${f.festival}-${f.country}`}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-ink truncate">
                        {translateSync(f.festival)} <span className="font-normal text-ink-3">· {translateSync(f.country)}</span>
                      </span>
                      <span className="tabular text-ink-2 shrink-0">
                        {formatNumber(f.collectedKg)} / {formatNumber(f.allocatedKg)} kg
                        {over && <span className="ml-1.5 text-warn font-medium">{translateSync("over agreed")}</span>}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-paper-2 overflow-hidden" role="img" aria-label={`${pct}%`}>
                      <div className="h-full rounded-full bg-pine-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2 p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-ink font-sans">{translateSync("Where the money went")}</h2>
            <p className="text-sm text-ink-3">
              {translateSync("Total sales")}: <span className="tabular font-medium text-ink">{formatCurrency(split?.totalGrossVolume ?? 0)}</span>
            </p>
          </div>
          <EscrowBar amount={split?.totalGrossVolume ?? 0} compact />
        </Card>
      </div>

      {/* Leaderboard */}
      <section className="space-y-5">
        <SectionHeader
          title={translateSync("Leaderboard")}
          description={translateSync("Officers are ranked by the kilograms they logged, artisans by the kilograms they picked up.")}
          actions={
            <div className="flex w-full sm:w-auto items-center gap-1 p-1 rounded-md bg-paper-2 border border-line" role="group" aria-label={translateSync("Show")}>
              {[
                { id: "all", label: translateSync("All") },
                { id: "artisan", label: translateSync("Artisans") },
                { id: "lgu", label: translateSync("Local governments") },
              ].map((tab) => {
                const active = selectedFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    aria-pressed={active}
                    onClick={() => setSelectedFilter(tab.id as FilterRole)}
                    className={cn(
                      "flex-1 sm:flex-none min-h-10 px-3 py-1.5 rounded-sm text-sm leading-tight transition-colors cursor-pointer",
                      active ? "bg-surface text-ink font-medium shadow-card" : "text-ink-3 hover:text-ink"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          }
        />

        <Card className="overflow-hidden">
          {loading && (
            <div className="divide-y divide-line" role="status" aria-label={translateSync("Loading leaderboard")}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          )}
          {!loading && filteredData.length === 0 && (
            <p className="px-6 py-8 text-sm text-ink-3 text-center">{translateSync("No collections recorded yet.")}</p>
          )}
          <ol className="divide-y divide-line">
            {filteredData.map((row) => {
              const isCurrentUser = Boolean(user && row.id.endsWith(`:${user.id}`));
              const tag = roleTag[row.role];
              return (
                <li key={row.id} className={cn("grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[3rem_1.4fr_1fr_auto] items-center gap-3 sm:gap-5 px-4 sm:px-6 py-3.5", isCurrentUser && "bg-lantern-100/50")}>
                  <span className={cn("tabular font-display text-2xl text-center", row.rank <= 3 ? "text-ink font-semibold" : "text-ink-3")}>{row.rank}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {translateSync(row.name)}
                      {isCurrentUser && (
                        <Badge tone="accent" className="ml-2">
                          {translateSync("You")}
                        </Badge>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge tone={tag.tone}>{tag.label}</Badge>
                      {row.country && <span className="text-xs text-ink-3 truncate">{translateSync(row.country)}</span>}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="h-1.5 rounded-full bg-paper-2 overflow-hidden">
                      <div className="h-full rounded-full bg-pine-300" style={{ width: `${(row.kgDiverted / maxKg) * 100}%` }} />
                    </div>
                    <p className="text-xs text-ink-3 mt-1 tabular">
                      {row.batches} {row.batches === 1 ? translateSync("batch") : translateSync("batches")}
                    </p>
                  </div>
                  <span className="tabular text-sm font-semibold text-ink text-right">{formatNumber(row.kgDiverted)} kg</span>
                </li>
              );
            })}
          </ol>
        </Card>
      </section>
    </div>
    </div>
  );
}

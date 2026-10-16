"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { TreeMap } from "@/components/impact/TreeMap";
import { EscrowBar } from "@/components/EscrowBar";
import { Badge, Card, PageHeader, SectionHeader, Skeleton, Stat, cn, type BadgeTone } from "@/components/ui";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  role: "artisan" | "buyer" | "lgu";
  region: string;
  country: string;
  kgDiverted: number;
  transactions: number;
}

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  {
    rank: 1,
    id: "lead_01",
    name: "Cordillera Botanical Cooperative",
    role: "artisan",
    region: "Baguio City",
    country: "Philippines",
    kgDiverted: 480.5,
    transactions: 34,
  },
  {
    rank: 2,
    id: "lead_02",
    name: "Varanasi Municipal Clean Rivers Unit",
    role: "lgu",
    region: "Varanasi",
    country: "India",
    kgDiverted: 395.2,
    transactions: 28,
  },
  {
    rank: 3,
    id: "lead_03",
    name: "Lanna Heritage Joinery",
    role: "artisan",
    region: "Chiang Mai",
    country: "Thailand",
    kgDiverted: 320.0,
    transactions: 22,
  },
  {
    rank: 4,
    id: "lead_04",
    name: "Elena Rostova (Heritage Studio)",
    role: "buyer",
    region: "Singapore",
    country: "Singapore",
    kgDiverted: 245.8,
    transactions: 19,
  },
  {
    rank: 5,
    id: "lead_05",
    name: "Nirmalaya Bio-Craft Collective",
    role: "artisan",
    region: "Uttar Pradesh",
    country: "India",
    kgDiverted: 215.4,
    transactions: 16,
  },
  {
    rank: 6,
    id: "lead_06",
    name: "Chiang Mai City Waste Management Office",
    role: "lgu",
    region: "Chiang Mai",
    country: "Thailand",
    kgDiverted: 198.0,
    transactions: 14,
  },
  {
    rank: 7,
    id: "lead_07",
    name: "Cebu Ancestral Weavers Cooperative",
    role: "artisan",
    region: "Cebu",
    country: "Philippines",
    kgDiverted: 175.6,
    transactions: 13,
  },
  {
    rank: 8,
    id: "lead_08",
    name: "Marcus Vance Interior Arch",
    role: "buyer",
    region: "Tokyo",
    country: "Japan",
    kgDiverted: 154.2,
    transactions: 11,
  },
  {
    rank: 9,
    id: "lead_09",
    name: "Pingxi Sustainable Papermaking",
    role: "artisan",
    region: "New Taipei",
    country: "Taiwan",
    kgDiverted: 138.0,
    transactions: 10,
  },
  {
    rank: 10,
    id: "lead_10",
    name: "Baguio City Environment & Parks Bureau",
    role: "lgu",
    region: "Baguio",
    country: "Philippines",
    kgDiverted: 122.5,
    transactions: 9,
  },
];

type FilterRole = "all" | "artisan" | "buyer" | "lgu";

// Shown only when the ledger API is unreachable, and labelled as sample data.
const SAMPLE_STATS = {
  totalKgCollected: 303.2,
  totalPassesIssued: 3,
  escrowSplitSummary: { totalGrossVolume: 162, artisanPayout70: 113.4, lguPlatformFee20: 32.4, ngoTrustFund10: 16.2 },
  festivals: [
    { festival: "Yi Peng Lantern Festival", country: "Thailand", allocatedKg: 400, collectedKg: 212, quotaProgress: 53 },
    { festival: "Panagbenga Festival", country: "Philippines", allocatedKg: 250, collectedKg: 168, quotaProgress: 67 },
    { festival: "Ganesh Chaturthi", country: "India", allocatedKg: 600, collectedKg: 150, quotaProgress: 25 },
  ],
};

export default function ImpactLeaderboardPage() {
  const { user } = useAuth();
  const { formatNumber, formatCurrency, translateSync } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState<FilterRole>("all");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSample, setIsSample] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setStats(SAMPLE_STATS);
          setIsSample(true);
        }
      } catch (err) {
        console.error("Failed to load impact stats:", err);
        setStats(SAMPLE_STATS);
        setIsSample(true);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const filteredData = LEADERBOARD_DATA.filter((entry) => selectedFilter === "all" || entry.role === selectedFilter);
  const maxKg = Math.max(...LEADERBOARD_DATA.map((e) => e.kgDiverted));

  const roleTag: Record<LeaderboardEntry["role"], { label: string; tone: BadgeTone }> = {
    artisan: { label: translateSync("Artisan"), tone: "pine" },
    buyer: { label: translateSync("Buyer"), tone: "accent" },
    lgu: { label: translateSync("LGU officer"), tone: "neutral" },
  };

  const split = stats?.escrowSplitSummary;
  const festivals: any[] = stats?.festivals ?? [];
  const v = (x: React.ReactNode) => (loading ? <Skeleton className="h-8 w-24" /> : x);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      <PageHeader
        eyebrow={translateSync("Public impact ledger")}
        title={translateSync("Global impact")}
        description={translateSync("Live totals from every collection, sale and donation recorded on HeriTech. Anyone can view this page.")}
      />

      {isSample && (
        <p className="text-sm text-warn bg-warn-100 border border-warn/20 rounded-md px-4 py-2.5">
          {translateSync("The ledger is offline, so these are sample figures.")}
        </p>
      )}

      {/* KPIs */}
      <Card className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-line">
        <Stat className="p-5 sm:p-6" label={translateSync("Material diverted")} value={v(formatNumber(stats?.totalKgCollected ?? 0))} unit="kg" hint={translateSync("Kept out of landfill and rivers")} />
        <Stat className="p-5 sm:p-6" label={translateSync("Paid to artisans")} value={v(formatCurrency(split?.artisanPayout70 ?? 0))} hint={translateSync("70% of every sale")} />
        <Stat className="p-5 sm:p-6" label={translateSync("Donated to NGOs")} value={v(formatCurrency(split?.ngoTrustFund10 ?? 0))} hint={translateSync("10% of every sale")} />
        <Stat className="p-5 sm:p-6" label={translateSync("Impact passes issued")} value={v(formatNumber(stats?.totalPassesIssued ?? 0))} hint={translateSync("Each one publicly verifiable")} />
      </Card>

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
                return (
                  <li key={`${f.festival}-${f.country}`}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-ink truncate">
                        {translateSync(f.festival)} <span className="font-normal text-ink-3">· {translateSync(f.country)}</span>
                      </span>
                      <span className="tabular text-ink-2 shrink-0">
                        {formatNumber(f.collectedKg)} / {formatNumber(f.allocatedKg)} kg
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

      {/* Tree canopy map */}
      <TreeMap />

      {/* Leaderboard */}
      <section className="space-y-5">
        <SectionHeader
          title={translateSync("Leaderboard")}
          description={translateSync("Ranked by verified material diverted")}
          actions={
            <div className="flex items-center gap-1 p-1 rounded-md bg-paper-2 border border-line" role="tablist">
              {[
                { id: "all", label: translateSync("All") },
                { id: "artisan", label: translateSync("Artisans") },
                { id: "buyer", label: translateSync("Buyers") },
                { id: "lgu", label: translateSync("LGUs") },
              ].map((tab) => {
                const active = selectedFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedFilter(tab.id as FilterRole)}
                    className={cn(
                      "h-8 px-3 rounded-sm text-sm transition-colors cursor-pointer",
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
          <ol className="divide-y divide-line">
            {filteredData.map((row) => {
              const isCurrentUser = user?.fullName === row.name;
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
                      <span className="text-xs text-ink-3 truncate">
                        {translateSync(row.region)}, {translateSync(row.country)}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="h-1.5 rounded-full bg-paper-2 overflow-hidden">
                      <div className="h-full rounded-full bg-pine-300" style={{ width: `${(row.kgDiverted / maxKg) * 100}%` }} />
                    </div>
                    <p className="text-xs text-ink-3 mt-1 tabular">
                      {row.transactions} {translateSync("transactions")}
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
  );
}

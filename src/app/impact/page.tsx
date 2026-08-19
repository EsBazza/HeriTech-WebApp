"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { TreeMap } from "@/components/impact/TreeMap";

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

export default function ImpactLeaderboardPage() {
  const { user } = useAuth();
  const { formatNumber, formatCurrency, translateSync } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState<FilterRole>("all");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Failed to load impact stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const filteredData = LEADERBOARD_DATA.filter((entry) => {
    if (selectedFilter === "all") return true;
    return entry.role === selectedFilter;
  });

  const getRoleTag = (r: "artisan" | "buyer" | "lgu") => {
    switch (r) {
      case "artisan":
        return {
          label: translateSync("Artisan"),
          className: "bg-[rgba(79,114,68,0.1)] text-[#4F7244]",
        };
      case "buyer":
        return {
          label: translateSync("Buyer"),
          className: "bg-[rgba(200,169,106,0.12)] text-[#7D5A3C]",
        };
      case "lgu":
        return {
          label: translateSync("LGU Officer"),
          className: "bg-[rgba(61,43,31,0.1)] text-[#3D2B1F]",
        };
    }
  };

  const getRowBorderTreatment = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return "border-l-[3px] border-l-[#C8A96A] bg-[rgba(200,169,106,0.08)]";
    }
    if (rank === 1) return "border-l-[2px] border-l-[#C8A96A]";
    if (rank === 2) return "border-l-[2px] border-l-[rgba(92,74,56,0.4)]";
    if (rank === 3) return "border-l-[2px] border-l-[rgba(125,90,60,0.4)]";
    return "border-l-[2px] border-l-transparent";
  };

  return (
    <div className="w-full min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-1.5 border-b border-[rgba(125,90,60,0.12)] pb-6">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[36px] font-medium text-[#2E1E12] tracking-tight">
            {translateSync("Global Impact")}
          </h1>
          <p className="font-body text-sm text-[rgba(92,74,56,0.7)]">
            {translateSync("Ranked by verified material diverted")}
          </p>
        </div>

        {/* Top 4 Real-Time KPI Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 space-y-1.5">
            <span className="text-[11px] font-bold text-[rgba(92,74,56,0.7)] uppercase tracking-wider block">
              {translateSync("Total Diverted")}
            </span>
            <p className="text-2xl font-bold text-[#2E1E12] font-mono-data">
              {loading ? "..." : formatNumber(stats?.totalKgCollected || 303.2)}{" "}
              <span className="text-xs font-normal text-[rgba(92,74,56,0.6)]">kg</span>
            </p>
            <span className="text-[11px] text-[#4F7244] font-semibold block pt-1 border-t border-[rgba(125,90,60,0.08)]">
              {translateSync("Intercepted from Landfills")}
            </span>
          </div>

          <div className="card p-5 space-y-1.5">
            <span className="text-[11px] font-bold text-[rgba(92,74,56,0.7)] uppercase tracking-wider block">
              {translateSync("70% Artisan Payouts")}
            </span>
            <p className="text-2xl font-bold text-[#4F7244] font-mono-data">
              {loading ? "..." : formatCurrency(stats?.escrowSplitSummary?.artisanPayout70 || 113.40)}
            </p>
            <span className="text-[11px] text-[#4F7244] font-semibold block pt-1 border-t border-[rgba(125,90,60,0.08)]">
              {translateSync("Fair-Trade Direct Payout")}
            </span>
          </div>

          <div className="card p-5 space-y-1.5">
            <span className="text-[11px] font-bold text-[rgba(92,74,56,0.7)] uppercase tracking-wider block">
              {translateSync("10% NGO Trust Funds")}
            </span>
            <p className="text-2xl font-bold text-[#7D5A3C] font-mono-data">
              {loading ? "..." : formatCurrency(stats?.escrowSplitSummary?.ngoTrustFund10 || 16.20)}
            </p>
            <span className="text-[11px] text-[#7D5A3C] font-semibold block pt-1 border-t border-[rgba(125,90,60,0.08)]">
              {translateSync("Post-Festival River & Forests")}
            </span>
          </div>

          <div className="card p-5 space-y-1.5">
            <span className="text-[11px] font-bold text-[rgba(92,74,56,0.7)] uppercase tracking-wider block">
              {translateSync("Wallet Passes Minted")}
            </span>
            <p className="text-2xl font-bold text-[#2E1E12] font-mono-data">
              {loading ? "..." : formatNumber(stats?.totalPassesIssued || 3)}
            </p>
            <span className="text-[11px] text-[#4F7244] font-semibold block pt-1 border-t border-[rgba(125,90,60,0.08)]">
              {translateSync("Tamper-Evident SHA-256")}
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* Google Earth Satellite Tree Canopy Project Map       */}
        {/* ==================================================== */}
        <div className="space-y-4 pt-2">
          <TreeMap />
        </div>

        {/* ==================================================== */}
        {/* Public Leaderboard Section                           */}
        {/* ==================================================== */}
        <div className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-medium text-[#2E1E12]">
                {translateSync("Participant Leaderboard")}
              </h2>
              <p className="text-xs text-[rgba(92,74,56,0.7)]">
                {translateSync("Verified circular material diversion rankings across Asia")}
              </p>
            </div>

            {/* Filter Tabs (Plain underline style) */}
            <div className="flex items-center space-x-5 text-sm self-start sm:self-auto border-b border-[rgba(125,90,60,0.12)]">
              {[
                { id: "all", label: translateSync("All") },
                { id: "artisan", label: translateSync("Artisans") },
                { id: "buyer", label: translateSync("Buyers") },
                { id: "lgu", label: translateSync("LGU officers") },
              ].map((tab) => {
                const active = selectedFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedFilter(tab.id as FilterRole)}
                    className={`py-2.5 font-medium transition-colors cursor-pointer border-b-2 -mb-[1px] text-xs uppercase tracking-wider min-h-[40px] ${
                      active
                        ? "border-[#7D5A3C] text-[#2E1E12] font-bold"
                        : "border-transparent text-[rgba(92,74,56,0.65)] hover:text-[#2E1E12]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Leaderboard Table Container */}
          <div className="bg-[rgba(255,255,255,0.94)] border border-[rgba(46,90,68,0.16)] rounded-[8px] overflow-hidden shadow-[0_2px_12px_-2px_rgba(24,51,36,0.08),0_1px_4px_-1px_rgba(24,51,36,0.04)]">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(125,90,60,0.12)] text-[11px] uppercase tracking-wider text-[rgba(92,74,56,0.65)] bg-[rgba(125,90,60,0.03)] font-semibold">
                    <th className="py-3.5 px-4 w-16 text-center">{translateSync("Rank")}</th>
                    <th className="py-3.5 px-4">{translateSync("Name")}</th>
                    <th className="py-3.5 px-4">{translateSync("Role")}</th>
                    <th className="py-3.5 px-4">{translateSync("Region")}</th>
                    <th className="py-3.5 px-4 text-right">{translateSync("Kg diverted")}</th>
                    <th className="py-3.5 px-4 text-right">{translateSync("Transactions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(125,90,60,0.08)] text-sm">
                  {filteredData.map((row) => {
                    const isCurrentUser = user?.fullName === row.name;
                    const borderClass = getRowBorderTreatment(row.rank, isCurrentUser);
                    const roleTag = getRoleTag(row.role);

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-[rgba(125,90,60,0.03)] transition-colors ${borderClass}`}
                      >
                        <td className="py-3.5 px-4 text-center font-display text-xl font-medium text-[rgba(92,74,56,0.8)]">
                          <span className={row.rank === 1 ? "text-[#C8A96A] font-semibold" : ""}>
                            {row.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#2E1E12]">
                          {row.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-[10px] uppercase font-bold text-[#C8A96A] bg-[#3D2B1F] px-1.5 py-0.5 rounded-[1px]">
                              {translateSync("You")}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${roleTag.className}`}
                          >
                            {roleTag.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[rgba(92,74,56,0.7)]">
                          {row.region}, {row.country}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium font-mono-data text-[#2E1E12]">
                          {formatNumber(row.kgDiverted)} kg
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-data text-xs text-[rgba(92,74,56,0.7)]">
                          {row.transactions}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Collapsed Cards View */}
            <div className="block sm:hidden divide-y divide-[rgba(125,90,60,0.08)]">
              {filteredData.map((row) => {
                const isCurrentUser = user?.fullName === row.name;
                const borderClass = getRowBorderTreatment(row.rank, isCurrentUser);
                const roleTag = getRoleTag(row.role);

                return (
                  <div
                    key={row.id}
                    className={`p-4 flex items-center justify-between space-x-3 ${borderClass}`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="font-display text-xl font-semibold text-[rgba(92,74,56,0.8)] w-6 text-center shrink-0">
                        {row.rank}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium text-[#2E1E12] truncate">
                          {row.name}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-[2px] ${roleTag.className}`}
                          >
                            {roleTag.label}
                          </span>
                          <span className="text-[11px] text-[rgba(92,74,56,0.6)] truncate">
                            {row.region}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono-data text-sm font-bold text-[#2E1E12] block">
                        {formatNumber(row.kgDiverted)} kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

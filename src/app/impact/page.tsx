"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";

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
  const { formatNumber } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState<FilterRole>("all");

  const filteredData = LEADERBOARD_DATA.filter((entry) => {
    if (selectedFilter === "all") return true;
    return entry.role === selectedFilter;
  });

  const getRoleTag = (r: "artisan" | "buyer" | "lgu") => {
    switch (r) {
      case "artisan":
        return {
          label: "Artisan",
          className: "bg-[rgba(79,114,68,0.1)] text-[#4F7244]",
        };
      case "buyer":
        return {
          label: "Buyer",
          className: "bg-[rgba(200,169,106,0.12)] text-[#7D5A3C]",
        };
      case "lgu":
        return {
          label: "LGU Officer",
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
    <div className="w-full min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1.5 border-b border-[rgba(125,90,60,0.12)] pb-6">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[36px] font-medium text-[#2E1E12] tracking-tight">
            Impact ledger
          </h1>
          <p className="font-body text-sm text-[rgba(92,74,56,0.7)]">
            Ranked by verified material diverted
          </p>
        </div>

        {/* Filter Tabs (Plain underline style) */}
        <div className="flex items-center space-x-6 border-b border-[rgba(125,90,60,0.12)] text-sm">
          {[
            { id: "all", label: "All" },
            { id: "artisan", label: "Artisans" },
            { id: "buyer", label: "Buyers" },
            { id: "lgu", label: "LGU officers" },
          ].map((tab) => {
            const active = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as FilterRole)}
                className={`py-3 font-medium transition-colors cursor-pointer border-b-2 -mb-[1px] min-h-[44px] ${
                  active
                    ? "border-[#7D5A3C] text-[#2E1E12] font-semibold"
                    : "border-transparent text-[rgba(92,74,56,0.65)] hover:text-[#2E1E12]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Leaderboard Table Container */}
        <div className="bg-[rgba(255,255,255,0.85)] border border-[rgba(125,90,60,0.12)] rounded-[6px] overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(125,90,60,0.12)] text-[11px] uppercase tracking-wider text-[rgba(92,74,56,0.65)] bg-[rgba(125,90,60,0.03)] font-semibold">
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Region</th>
                  <th className="py-3.5 px-4 text-right">Kg diverted</th>
                  <th className="py-3.5 px-4 text-right">Transactions</th>
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
                            You
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
  );
}

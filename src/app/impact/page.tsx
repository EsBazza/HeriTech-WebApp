"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from "@/components/translation/TranslatableText";
import {
  BarChart3,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  CheckCircle2,
  Camera,
  MapPin,
  QrCode,
  Heart,
  Scale,
  Sparkles,
} from "lucide-react";
import { TreeMap } from "@/components/impact/TreeMap";

export default function ImpactPage() {
  const { formatCurrency, formatNumber, translateSync } = useTranslation();
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

  const workflowSteps = [
    {
      icon: Camera,
      tag: "Collection",
      title: translateSync("Material scanner"),
      description: translateSync(
        "Municipal teams photograph and categorize salvaged festival materials directly on site."
      ),
    },
    {
      icon: MapPin,
      tag: "Location",
      title: translateSync("Harvest map"),
      description: translateSync(
        "Locate active salvage depots and available craft materials across the region in real time."
      ),
    },
    {
      icon: QrCode,
      tag: "Custody",
      title: translateSync("QR handover"),
      description: translateSync(
        "Simple QR code scanning confirms physical material transfers from depots to artisan workshops."
      ),
    },
    {
      icon: ShieldCheck,
      tag: "Fair pay",
      title: translateSync("Direct payouts"),
      description: translateSync(
        "Artisan cooperatives receive guaranteed fair payouts directly on every completed order."
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col space-y-12 sm:space-y-16 pb-16">
      {/* 1. Top Header Banner */}
      <section className="section-main w-full pt-10 sm:pt-14 px-5 sm:px-12 max-w-7xl mx-auto space-y-8">
        <div className="space-y-3">
          <div className="flex items-center space-x-2.5 text-xs font-bold text-[#3E7B5C]">
            <BarChart3 className="w-4 h-4 text-[#3E7B5C]" />
            <span className="uppercase tracking-[0.14em] font-mono-data">
              {translateSync("REAL-TIME AUDITABLE DATA FEED")}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-[var(--text-heading)] tracking-tight">
            Public Impact & Diversion Ledger
          </h1>
          <p className="font-body text-sm sm:text-[15px] text-[var(--text-body)] max-w-2xl leading-relaxed">
            {translateSync(
              "Live telemetry tracking raw kilograms intercepted across Asia, fair-trade artisan earnings, and automated NGO fund disbursements."
            )}
          </p>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="card p-6 space-y-2">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              {translateSync("Total Material Diverted")}
            </span>
            <p className="text-3xl font-bold text-[var(--text-heading)] font-mono-data">
              {loading ? "..." : formatNumber(stats?.totalKgCollected || 303.2)}{" "}
              <span className="text-sm font-normal text-[var(--text-muted)]">kg</span>
            </p>
            <span className="text-xs text-[#3E7B5C] font-semibold flex items-center space-x-1.5 pt-1 border-t border-[var(--border-light)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{translateSync("Intercepted from Landfills")}</span>
            </span>
          </div>

          <div className="card p-6 space-y-2">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              {translateSync("70% Artisan Payouts")}
            </span>
            <p className="text-3xl font-bold text-[#2E5A44] font-mono-data">
              {loading ? "..." : formatCurrency(stats?.escrowSplitSummary?.artisanPayout70 || 113.40)}
            </p>
            <span className="text-xs text-[#2E5A44] font-semibold flex items-center space-x-1.5 pt-1 border-t border-[var(--border-light)]">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>{translateSync("Fair-Trade Direct Payout")}</span>
            </span>
          </div>

          <div className="card p-6 space-y-2">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              {translateSync("10% NGO Trust Funds")}
            </span>
            <p className="text-3xl font-bold text-[#3E7B5C] font-mono-data">
              {loading ? "..." : formatCurrency(stats?.escrowSplitSummary?.ngoTrustFund10 || 16.20)}
            </p>
            <span className="text-xs text-[#3E7B5C] font-semibold flex items-center space-x-1.5 pt-1 border-t border-[var(--border-light)]">
              <Leaf className="w-3.5 h-3.5" />
              <span>{translateSync("Post-Festival River & Forests")}</span>
            </span>
          </div>

          <div className="card p-6 space-y-2">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              {translateSync("Wallet Passes Minted")}
            </span>
            <p className="text-3xl font-bold text-[var(--text-heading)] font-mono-data">
              {loading ? "..." : formatNumber(stats?.totalPassesIssued || 3)}
            </p>
            <span className="text-xs text-[#3E7B5C] font-semibold flex items-center space-x-1.5 pt-1 border-t border-[var(--border-light)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{translateSync("Tamper-Evident SHA-256")}</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. THE WORKFLOW: How HeriTech Works */}
      <section className="section-alt w-full py-12 sm:py-16 px-5 sm:px-12">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-[1.5px] bg-[#3E7B5C] inline-block" />
              <span className="text-[11px] uppercase tracking-[0.14em] text-[#3E7B5C] font-bold">
                {translateSync("THE WORKFLOW")}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-[var(--text-heading)] tracking-tight">
              How HeriTech works
            </h2>
            <p className="font-body text-[13px] sm:text-sm text-[var(--text-body)] leading-relaxed">
              {translateSync(
                "Four steps connecting festival collection, artisan cooperatives, and verified craft delivery."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="card p-6 sm:p-8 space-y-4 hover:border-[#3E7B5C]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-[2px] bg-[#3E7B5C]/15 border border-[#3E7B5C]/30 flex items-center justify-center text-[#3E7B5C]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#3E7B5C] bg-[#3E7B5C]/10 px-2.5 py-0.5 rounded-[2px]">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-medium text-[var(--text-heading)]">
                    {step.title}
                  </h3>
                  <p className="font-body text-[13px] sm:text-sm text-[var(--text-body)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FAIR TRADE: How Payments Work */}
      <section className="section-main w-full py-12 sm:py-16 px-5 sm:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-[1.5px] bg-[#3E7B5C] inline-block" />
                <span className="text-[11px] uppercase tracking-[0.14em] text-[#3E7B5C] font-bold">
                  {translateSync("FAIR TRADE")}
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-[var(--text-heading)] tracking-tight">
                How payments work
              </h2>
              <p className="font-body text-[13px] sm:text-sm text-[var(--text-body)] leading-relaxed">
                {translateSync(
                  "Every purchase is divided transparently at checkout to ensure fair living wages for artisans."
                )}
              </p>
            </div>

            <div className="text-[11px] uppercase tracking-wider font-mono-data text-[#3E7B5C] bg-[#3E7B5C]/10 px-3.5 py-1.5 rounded-[2px] border border-[#3E7B5C]/25 font-bold self-start md:self-auto shadow-xs">
              {translateSync("Guaranteed payout")}
            </div>
          </div>

          {/* 70/20/10 Escrow Segment Blocks */}
          <div className="w-full rounded-[4px] overflow-hidden flex flex-col md:flex-row border border-[var(--forest-dark)]/30 divide-y md:divide-y-0 md:divide-x divide-[var(--forest-dark)]/40 shadow-xs">
            {/* 70% Segment */}
            <div className="w-full md:w-[70%] bg-[var(--forest-leaf)] p-6 sm:p-8 text-[#F4F7F4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#F4F7F4]">
                  70%
                </span>
                <div className="w-8 h-8 rounded-[2px] bg-black/20 flex items-center justify-center text-[#F4F7F4]">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#A3D9B5] font-bold">
                {translateSync("Direct artisan payout")}
              </p>
              <p className="text-xs sm:text-[13px] text-[#F4F7F4] leading-relaxed font-light">
                {translateSync(
                  "Sent directly to master weavers and artisan cooperatives with guaranteed minimum pricing."
                )}
              </p>
            </div>

            {/* 20% Segment */}
            <div className="w-full md:w-[20%] bg-[var(--forest-mid)] p-6 sm:p-8 text-[#F4F7F4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#F4F7F4]">
                  20%
                </span>
                <div className="w-8 h-8 rounded-[2px] bg-black/20 flex items-center justify-center text-[#F4F7F4]">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#A3D9B5] font-bold">
                {translateSync("Logistics and platform")}
              </p>
              <p className="text-xs sm:text-[13px] text-[#F4F7F4] leading-relaxed font-light">
                {translateSync(
                  "Covers collection bins, material transport, and depot operations."
                )}
              </p>
            </div>

            {/* 10% Segment */}
            <div className="w-full md:w-[10%] bg-[var(--forest-dark)] p-6 sm:p-8 text-[#F4F7F4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#8FBC8F]">
                  10%
                </span>
                <div className="w-8 h-8 rounded-[2px] bg-black/20 flex items-center justify-center text-[#8FBC8F]">
                  <Leaf className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#8FBC8F] font-bold">
                {translateSync("NGO trust fund")}
              </p>
              <p className="text-xs sm:text-[13px] text-[#F4F7F4] leading-relaxed font-light">
                {translateSync(
                  "Allocated to clean water, forest planting, and conservation funds."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Satellite Tree Canopy Growth Map */}
      <section className="section-alt w-full py-12 sm:py-16 px-5 sm:px-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <TreeMap />
        </div>
      </section>

      {/* 5. Regional Festivals Quota Table */}
      <section className="section-main w-full px-5 sm:px-12 max-w-7xl mx-auto">
        <div className="card p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-medium text-[var(--text-heading)]">
              {translateSync("Active Pan-Asian Municipal Quota Progress")}
            </h3>
            <p className="font-body text-xs text-[var(--text-muted)] mt-1">
              {translateSync(
                "Verified tonnage collection versus target salvage quota under active Step 0 MOUs."
              )}
            </p>
          </div>

          <div className="space-y-4">
            {stats?.festivals?.map((f: any) => (
              <div key={f.festival} className="space-y-2 p-4 rounded-[4px] bg-[var(--celadon-alt)]/60 border border-[var(--border-light)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold text-[var(--text-heading)]">
                  <span>
                    <TranslatableText>{f.festival}</TranslatableText> (<TranslatableText>{f.country}</TranslatableText>)
                  </span>
                  <span className="font-mono-data text-[var(--text-muted)]">
                    {formatNumber(f.collectedKg)} kg / {formatNumber(f.allocatedKg)} kg ({f.quotaProgress}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-[2px] bg-white border border-[var(--border-light)] overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, f.quotaProgress)}%` }}
                    className="h-full bg-[#3E7B5C] rounded-[1px] transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

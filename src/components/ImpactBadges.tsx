"use client";

import React from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Award } from "lucide-react";

export function ImpactBadges() {
  const { translateSync } = useTranslation();

  const culturalTiers = [
    {
      title: "Panagbenga Highland Tier",
      origin: "Baguio City, Philippines",
      metric: "50+ kg Diverted",
      description: "Supports native Bolo bamboo joinery and sun-dried everlasting flower weaving.",
    },
    {
      title: "Yi Peng Sky Tier",
      origin: "Chiang Mai, Thailand",
      metric: "25+ kg Diverted",
      description: "Intercepts non-combusted split bamboo lantern ribs and mulberry rice paper.",
    },
    {
      title: "Nirmalaya River Tier",
      origin: "Thane & Ganges, India",
      metric: "40+ kg Diverted",
      description: "Purifies riverbanks by diverting ceremonial temple garlands into natural organic inks.",
    },
    {
      title: "Zero-Waste Circular Tier",
      origin: "Pan-Asian Certified",
      metric: "100+ kg Diverted",
      description: "Achieved multi-region circular patronage across Philippine, Thai, and Indian artisan cooperatives.",
    },
  ];

  return (
    <section className="w-full bg-cream-alt py-12 sm:py-16 px-6 sm:px-10 lg:px-12 border-b border-[var(--border-light)]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-[1.5px] bg-[#7D5A3C] inline-block" />
              <span className="text-[11px] uppercase tracking-[0.14em] text-[#7D5A3C] font-bold">
                {translateSync("GOOGLE WALLET DIGITAL PASSES")}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-[var(--bark)] tracking-tight">
              Verified Circular Origin Credentials
            </h2>
            <p className="font-body text-[13px] sm:text-sm text-[var(--warm-gray)] leading-relaxed">
              {translateSync(
                "Earn verifiable digital origin credentials added directly to your Google Wallet whenever you purchase authenticated circular craft pieces."
              )}
            </p>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-[#7D5A3C] font-bold bg-[var(--cream)] px-3 py-2 rounded-[2px] border border-[var(--border-light)] self-start md:self-auto min-h-[44px]">
            <Award className="w-4 h-4 text-[#C8A96A]" />
            <span>{translateSync("Verifiable Passports")}</span>
          </div>
        </div>

        {/* 4 Cards on Cream with Mahogany Hairline Borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {culturalTiers.map((tier, idx) => (
            <div
              key={idx}
              className="bg-[var(--cream)] bg-linen border border-[var(--border-light)] rounded-[4px] p-5 space-y-3 hover:border-[var(--border-mid)] transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header: Title */}
                <h3 className="font-display text-lg font-semibold text-[var(--bark)] leading-snug">
                  {tier.title}
                </h3>

                {/* Origin Location */}
                <p className="text-xs font-medium text-[#7D5A3C]">
                  {tier.origin}
                </p>

                {/* Description */}
                <p className="text-[13px] text-[var(--warm-gray)] leading-relaxed">
                  {translateSync(tier.description)}
                </p>
              </div>

              {/* Metric Footer */}
              <div className="pt-3 border-t border-[var(--border-light)] flex items-center justify-between text-xs font-mono-data">
                <span className="text-[var(--warm-gray)]">{translateSync("Threshold:")}</span>
                <span className="text-[#4F7244] font-bold">{tier.metric}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ImpactBadges;

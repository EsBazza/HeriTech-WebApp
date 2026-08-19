"use client";

import React from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  TranslatableText,
  TranslatableHeading,
  TranslatableParagraph,
} from "@/components/translation/TranslatableText";
import { Award, ShieldCheck, Sparkles } from "lucide-react";

export function ImpactBadges() {
  const { translateSync } = useTranslation();

  const badges = [
    {
      emoji: "🌸",
      title: "Panagbenga Highland Patron",
      tier: "Gold Tier",
      origin: "Baguio City, Philippines",
      metric: "50+ kg Diverted",
      description: "Supports native Bolo bamboo joinery and sun-dried everlasting flower weaving.",
    },
    {
      emoji: "🏮",
      title: "Yi Peng Sky Guardian",
      tier: "Silver Tier",
      origin: "Chiang Mai, Thailand",
      metric: "25+ kg Diverted",
      description: "Intercepts non-combusted split bamboo lantern ribs and mulberry rice paper.",
    },
    {
      emoji: "🪷",
      title: "Nirmalaya River Protector",
      tier: "Emerald Tier",
      origin: "Thane & Ganges, India",
      metric: "40+ kg Diverted",
      description: "Purifies riverbanks by diverting ceremonial temple garlands into natural organic inks.",
    },
    {
      emoji: "🎋",
      title: "Zero-Waste Circular Pioneer",
      tier: "Master Tier",
      origin: "Pan-Asian Certified",
      metric: "100+ kg Diverted",
      description: "Achieved multi-region circular patronage across Philippine, Thai, and Indian guilds.",
    },
  ];

  return (
    <section className="w-full bg-[#EDE8DF] py-14 sm:py-16 px-6 sm:px-12 border-b border-[rgba(107,66,38,0.12)]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-[1.5px] bg-[#6B4226] inline-block" />
              <span className="text-[11px] uppercase tracking-[0.14em] text-[#6B4226] font-bold">
                {translateSync("GOOGLE WALLET IMPACT PROVENANCE")}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-[var(--bark)] tracking-tight">
              Tiered Google Impact Badges
            </h2>
            <p className="font-body text-sm text-[#8C7B6B] leading-relaxed">
              {translateSync(
                "Earn verifiable digital impact credentials added directly to your Google Wallet whenever you purchase authenticated circular craft pieces."
              )}
            </p>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-[#6B4226] font-bold bg-[var(--cream)] px-3 py-1.5 rounded-[2px] border border-[rgba(107,66,38,0.15)] self-start md:self-auto">
            <Award className="w-4 h-4 text-[#C9A96E]" />
            <span>{translateSync("Verifiable Passports")}</span>
          </div>
        </div>

        {/* Badges Grid (4 Cards on Cream with Mahogany Hairline Borders) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge, idx) => (
            <div
              key={idx}
              className="bg-[var(--cream)] border border-[rgba(107,66,38,0.15)] rounded-[4px] p-5 space-y-3 hover:border-[#6B4226]/50 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header: Emoji & Tier */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl" role="img" aria-label={badge.title}>
                    {badge.emoji}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-[#6B4226] bg-[#6B4226]/[0.08] px-2 py-0.5 rounded-[1px] border border-[#6B4226]/15">
                    {badge.tier}
                  </span>
                </div>

                {/* Badge Title */}
                <h3 className="font-display text-lg font-semibold text-[var(--bark)] leading-snug">
                  {badge.title}
                </h3>

                {/* Origin Location */}
                <p className="text-[11px] font-medium text-[#6B4226]">
                  {badge.origin}
                </p>

                {/* Description */}
                <p className="text-xs text-[#8C7B6B] leading-relaxed">
                  {translateSync(badge.description)}
                </p>
              </div>

              {/* Metric Footer */}
              <div className="pt-3 border-t border-[rgba(107,66,38,0.1)] flex items-center justify-between text-[11px] font-mono-data">
                <span className="text-[#8C7B6B]">{translateSync("Threshold:")}</span>
                <span className="text-[#4A6741] font-bold">{badge.metric}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ImpactBadges;

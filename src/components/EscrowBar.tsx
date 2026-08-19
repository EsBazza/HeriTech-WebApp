"use client";

import React from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  TranslatableText,
  TranslatableHeading,
  TranslatableParagraph,
} from "@/components/translation/TranslatableText";
import { Scale, Heart, Shield, Leaf } from "lucide-react";

export function EscrowBar() {
  const { translateSync } = useTranslation();

  return (
    <section className="w-full bg-[var(--cream)] py-14 sm:py-16 px-6 sm:px-12 border-b border-[rgba(107,66,38,0.12)]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-[1.5px] bg-[#6B4226] inline-block" />
              <span className="text-[11px] uppercase tracking-[0.14em] text-[#6B4226] font-bold">
                {translateSync("ECONOMIC FAIR-TRADE STANDARD")}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-[var(--bark)] tracking-tight">
              70/20/10 Transparent Escrow Architecture
            </h2>
            <p className="font-body text-sm text-[#8C7B6B] leading-relaxed">
              {translateSync(
                "Every transaction is divided automatically at checkout through smart financial splits, eliminating middleman markups and guaranteeing fair living wages."
              )}
            </p>
          </div>

          <div className="text-[11px] uppercase tracking-wider font-mono-data text-[#4A6741] bg-[#4A6741]/10 px-3 py-1.5 rounded-[2px] border border-[#4A6741]/20 font-bold self-start md:self-auto">
            100% {translateSync("AUDITABLE ESCROW")}
          </div>
        </div>

        {/* The Seamless Segmented Escrow Bar */}
        <div className="w-full rounded-[4px] overflow-hidden flex flex-col md:flex-row shadow-xs border border-[#2C1A0E]/30">
          {/* 70% Segment: Forest */}
          <div className="w-full md:w-[70%] bg-[var(--forest)] p-6 sm:p-7 text-[var(--linen)] space-y-2 border-b md:border-b-0 md:border-r border-[#2C1A0E]/40">
            <div className="flex items-center justify-between">
              <span className="font-display text-4xl sm:text-[42px] font-semibold text-[#E8D8B0]">
                70%
              </span>
              <div className="w-8 h-8 rounded-[2px] bg-black/20 flex items-center justify-center text-[#E8D8B0]">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#A8BFA3] font-bold">
              {translateSync("Direct Artisan Floor Price")}
            </p>
            <p className="text-xs text-[#E8D8B0]/80 leading-relaxed font-light">
              {translateSync(
                "Paid directly to certified master weavers, joiners, and craft guilds with guaranteed minimum fair-trade floor pricing."
              )}
            </p>
          </div>

          {/* 20% Segment: Mahogany */}
          <div className="w-full md:w-[20%] bg-[var(--mahogany)] p-6 sm:p-7 text-[var(--linen)] space-y-2 border-b md:border-b-0 md:border-r border-[#2C1A0E]/40">
            <div className="flex items-center justify-between">
              <span className="font-display text-4xl sm:text-[42px] font-semibold text-[#E8D8B0]">
                20%
              </span>
              <div className="w-8 h-8 rounded-[2px] bg-black/20 flex items-center justify-center text-[#E8D8B0]">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#A8BFA3] font-bold">
              {translateSync("Municipal Logistics & Platform")}
            </p>
            <p className="text-xs text-[#E8D8B0]/80 leading-relaxed font-light">
              {translateSync(
                "Covers municipal pickup bins, Gemini AI camera fleet, and GIS routing."
              )}
            </p>
          </div>

          {/* 10% Segment: Bark */}
          <div className="w-full md:w-[10%] bg-[var(--bark)] p-6 sm:p-7 text-[var(--linen)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-4xl sm:text-[42px] font-semibold text-[#C9A96E]">
                10%
              </span>
              <div className="w-8 h-8 rounded-[2px] bg-black/20 flex items-center justify-center text-[#C9A96E]">
                <Leaf className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#A8BFA3] font-bold">
              {translateSync("NGO Trust Fund")}
            </p>
            <p className="text-xs text-[#E8D8B0]/80 leading-relaxed font-light">
              {translateSync(
                "Transparent clean water, forest canopy, & conservation funds."
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EscrowBar;

"use client";

import React from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Heart, Scale, Leaf } from "lucide-react";

export function EscrowBar() {
  const { translateSync } = useTranslation();

  return (
    <section className="section-main w-full py-12 sm:py-[72px] px-5 sm:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-[1.5px] bg-[#7D5A3C] inline-block" />
              <span className="text-[11px] uppercase tracking-[0.14em] text-[#7D5A3C] font-bold">
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

          <div className="text-[11px] uppercase tracking-wider font-mono-data text-[#4F7244] bg-[#4F7244]/10 px-3 py-1.5 rounded-[2px] border border-[#4F7244]/20 font-bold self-start md:self-auto">
            {translateSync("Guaranteed payout")}
          </div>
        </div>

        {/* Escrow Bar Floating Container */}
        <div className="w-full rounded-[4px] overflow-hidden flex flex-col md:flex-row border border-[#3D2B1F]/30 divide-y md:divide-y-0 md:divide-x divide-[#3D2B1F]/40 shadow-xs">
          {/* 70% Segment: Forest */}
          <div className="w-full md:w-[70%] bg-[var(--forest)] p-6 sm:p-8 text-[#FAF7F2] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#FAF7F2]">
                70%
              </span>
              <div className="w-8 h-8 rounded-[2px] bg-black/20 flex items-center justify-center text-[#FAF7F2]">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#DFC48E] font-bold">
              {translateSync("Direct artisan payout")}
            </p>
            <p className="text-xs sm:text-[13px] text-[#FAF7F2] leading-relaxed font-light">
              {translateSync(
                "Sent directly to master weavers and artisan cooperatives with guaranteed minimum pricing."
              )}
            </p>
          </div>

          {/* 20% Segment: Mahogany */}
          <div className="w-full md:w-[20%] bg-[var(--mahogany)] p-6 sm:p-8 text-[#FAF7F2] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#FAF7F2]">
                20%
              </span>
              <div className="w-8 h-8 rounded-[2px] bg-black/20 flex items-center justify-center text-[#FAF7F2]">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#DFC48E] font-bold">
              {translateSync("Logistics and platform")}
            </p>
            <p className="text-xs sm:text-[13px] text-[#FAF7F2] leading-relaxed font-light">
              {translateSync(
                "Covers collection bins, material transport, and depot operations."
              )}
            </p>
          </div>

          {/* 10% Segment: Bark */}
          <div className="w-full md:w-[10%] bg-[var(--bark)] p-6 sm:p-8 text-[#FAF7F2] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#DFC48E]">
                10%
              </span>
              <div className="w-8 h-8 rounded-[2px] bg-black/20 flex items-center justify-center text-[#DFC48E]">
                <Leaf className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#DFC48E] font-bold">
              {translateSync("NGO trust fund")}
            </p>
            <p className="text-xs sm:text-[13px] text-[#FAF7F2] leading-relaxed font-light">
              {translateSync(
                "Allocated to clean water, forest planting, and conservation funds."
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EscrowBar;

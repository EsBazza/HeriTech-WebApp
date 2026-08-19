"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/TranslationContext";
import { ArrowRight, MapPin } from "lucide-react";

interface HeroSectionProps {
  totalDivertedKg?: number;
  totalArtisans?: number;
  totalTrustUsd?: number;
}

export function HeroSection({
  totalDivertedKg = 1240,
  totalArtisans = 48,
  totalTrustUsd = 1420,
}: HeroSectionProps) {
  const { formatNumber, translateSync } = useTranslation();

  return (
    <section className="relative w-full bg-[var(--bark)] overflow-hidden text-[#F5F5F0] py-16 sm:py-20 lg:py-24 px-6 sm:px-10 lg:px-12 border-b border-[#7D5A3C]/40">
      {/* Subtle 2.5% Opacity Hand-Woven Pattern Texture Overlay (Zero Border Noise) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] select-none"
        aria-hidden="true"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="hero-loom-pattern"
              width="48"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="36" stroke="#C8A96A" strokeWidth="2" />
              <line x1="16" y1="0" x2="16" y2="36" stroke="#C8A96A" strokeWidth="2" />
              <line x1="32" y1="0" x2="32" y2="36" stroke="#C8A96A" strokeWidth="2" />
              <rect x="0" y="4" width="24" height="6" fill="#7D5A3C" />
              <rect x="24" y="16" width="24" height="6" fill="#4F7244" />
              <rect x="0" y="28" width="24" height="6" fill="#7D5A3C" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-loom-pattern)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Core Value Proposition & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Eyebrow Label with 28px Gold Line */}
          <div className="flex items-center space-x-3">
            <span className="w-7 h-[1.5px] bg-[#C8A96A] inline-block" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#DFC48E] font-bold">
              {translateSync("PAN-ASIAN CIRCULAR MATERIAL SYSTEM")}
            </span>
          </div>

          {/* H1 Heading (High-Contrast Linen/Cream) */}
          <h1 className="font-display text-[32px] sm:text-[42px] lg:text-[54px] font-medium leading-[1.12] text-[#FAF7F2] tracking-tight">
            Where festival waste is{" "}
            <em className="italic text-[#DFC48E] font-normal not-italic font-serif">
              reborn
            </em>{" "}
            into certified heritage craft.
          </h1>

          {/* Clear, Jargon-Free Core Value Proposition */}
          <p className="font-body text-[15px] sm:text-base leading-relaxed text-[#F5F5F0] max-w-[500px]">
            {translateSync(
              "Festival materials across Asia are collected, verified, and transformed by local artisans into authentic, certified heritage pieces—with guaranteed direct fair-trade payouts on every purchase."
            )}
          </p>

          {/* Action Buttons with High-Contrast Touch Targets */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#marketplace-grid"
              className="px-6 py-3.5 rounded-[2px] bg-[#C8A96A] hover:bg-[#DFC48E] text-[#3D2B1F] text-xs uppercase tracking-wider font-bold transition-all shadow-xs inline-flex items-center space-x-2 min-h-[44px]"
            >
              <span>{translateSync("Explore marketplace")}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              href="/map"
              className="px-6 py-3.5 rounded-[2px] bg-transparent hover:bg-[#7D5A3C]/30 text-[#FAF7F2] border border-[#FAF7F2]/40 hover:border-[#C8A96A] text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center space-x-2 min-h-[44px]"
            >
              <MapPin className="w-4 h-4 text-[#DFC48E]" />
              <span>{translateSync("View harvest map")}</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Spaciously Padded Metric Cards (High WCAG AA Contrast) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 pt-2 lg:pt-0">
          {/* Stat Card 1 */}
          <div className="p-6 sm:p-7 rounded-[4px] bg-[#2A1D14]/90 border border-[#C8A96A]/30 backdrop-blur-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[#DFC48E] font-semibold">
              <span>{translateSync("Material Diverted")}</span>
              <span className="text-[#DFC48E] font-mono-data">01</span>
            </div>
            <div className="font-display text-3xl sm:text-[34px] lg:text-[38px] font-semibold text-[#FAF7F2]">
              {formatNumber(totalDivertedKg)}{" "}
              <span className="text-base font-normal text-[#DFC48E]">kg</span>
            </div>
            <p className="text-[13px] text-[#F5F5F0] leading-relaxed">
              {translateSync("Bamboo, botanical florals, and mulberry paper salvaged from cultural celebrations.")}
            </p>
          </div>

          {/* Stat Card 2 */}
          <div className="p-6 sm:p-7 rounded-[4px] bg-[#2A1D14]/90 border border-[#C8A96A]/30 backdrop-blur-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[#DFC48E] font-semibold">
              <span>{translateSync("Fair Escrow")}</span>
              <span className="text-[#DFC48E] font-mono-data">02</span>
            </div>
            <div className="font-display text-3xl sm:text-[34px] lg:text-[38px] font-semibold text-[#FAF7F2]">
              70%{" "}
              <span className="text-base font-normal text-[#DFC48E]">
                {translateSync("Direct Payout")}
              </span>
            </div>
            <p className="text-[13px] text-[#F5F5F0] leading-relaxed">
              {translateSync("Guaranteed living wage floor price transferred directly to artisan cooperatives.")}
            </p>
          </div>

          {/* Stat Card 3 */}
          <div className="p-6 sm:p-7 rounded-[4px] bg-[#2A1D14]/90 border border-[#C8A96A]/30 backdrop-blur-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[#DFC48E] font-semibold">
              <span>{translateSync("Audited Origin")}</span>
              <span className="text-[#DFC48E] font-mono-data">03</span>
            </div>
            <div className="font-display text-3xl sm:text-[34px] lg:text-[38px] font-semibold text-[#FAF7F2]">
              100%{" "}
              <span className="text-base font-normal text-[#DFC48E]">
                SHA-256
              </span>
            </div>
            <p className="text-[13px] text-[#F5F5F0] leading-relaxed">
              {translateSync("Every crafted piece is cryptographically verified from harvest to home.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

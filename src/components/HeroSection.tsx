"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  TranslatableText,
  TranslatableHeading,
  TranslatableParagraph,
} from "@/components/translation/TranslatableText";
import { ArrowRight, Sparkles, MapPin, Scale, ShieldCheck } from "lucide-react";

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
  const { formatNumber, formatCurrency, translateSync } = useTranslation();

  return (
    <section className="relative w-full bg-[var(--bark)] overflow-hidden text-[var(--linen)] py-14 sm:py-20 px-6 sm:px-12 border-b border-[#6B4226]/40">
      {/* 7% Opacity Hand-Woven Pattern Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07] select-none"
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
              {/* Warp grid */}
              <line x1="0" y1="0" x2="0" y2="36" stroke="#C9A96E" strokeWidth="3" />
              <line x1="16" y1="0" x2="16" y2="36" stroke="#C9A96E" strokeWidth="3" />
              <line x1="32" y1="0" x2="32" y2="36" stroke="#C9A96E" strokeWidth="3" />
              {/* Weft grid */}
              <rect x="0" y="4" width="24" height="6" fill="#6B4226" />
              <rect x="24" y="16" width="24" height="6" fill="#4A6741" />
              <rect x="0" y="28" width="24" height="6" fill="#6B4226" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-loom-pattern)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Eyebrow Label with 28px Gold Line */}
          <div className="flex items-center space-x-3">
            <span className="w-7 h-[1.5px] bg-[#C9A96E] inline-block" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#C9A96E] font-bold">
              {translateSync("PAN-ASIAN CIRCULAR MATERIAL SYSTEM")}
            </span>
          </div>

          {/* H1 Heading */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[52px] font-medium leading-[1.12] text-[#E8D8B0] tracking-tight">
            Where festival waste is{" "}
            <em className="italic text-[#C9A96E] font-normal not-italic font-serif">
              reborn
            </em>{" "}
            into certified heritage craft.
          </h1>

          {/* Body */}
          <p className="font-body text-sm sm:text-[15px] leading-relaxed text-[#A8BFA3] max-w-[440px]">
            {translateSync(
              "Intercepting ceremonial bamboo, paper, and floral offerings across Asia with Google Gemini AI—binding every upcycled piece to an auditable 70/20/10 escrow ledger and Google Wallet Impact Pass."
            )}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <a
              href="#marketplace-grid"
              className="px-5 py-3 rounded-[2px] bg-[#C9A96E] hover:bg-[#E0C48A] text-[#2C1A0E] text-xs uppercase tracking-wider font-bold transition-all shadow-xs inline-flex items-center space-x-2"
            >
              <span>{translateSync("Explore marketplace")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <Link
              href="/map"
              className="px-5 py-3 rounded-[2px] bg-transparent hover:bg-[#6B4226]/30 text-[#E8D8B0] border border-[#E8D8B0]/30 hover:border-[#C9A96E] text-xs uppercase tracking-wider font-medium transition-all inline-flex items-center space-x-2"
            >
              <MapPin className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>{translateSync("View harvest map")}</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Telemetry Stat Cards */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3.5">
          {/* Stat Card 1 */}
          <div className="p-5 rounded-[4px] bg-[#2C1A0E]/80 border border-[#C9A96E]/20 backdrop-blur-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#A8BFA3] font-medium">
              <span>{translateSync("Material Diverted")}</span>
              <span className="text-[#C9A96E]">01</span>
            </div>
            <div className="font-display text-3xl sm:text-[34px] font-semibold text-[#C9A96E]">
              {formatNumber(totalDivertedKg)} <span className="text-base font-normal text-[#E8D8B0]">kg</span>
            </div>
            <p className="text-[12px] text-[#A8BFA3]/80 leading-snug">
              {translateSync("Bamboo frames, floral nirmalaya, & mulberry paper salvaged.")}
            </p>
          </div>

          {/* Stat Card 2 */}
          <div className="p-5 rounded-[4px] bg-[#2C1A0E]/80 border border-[#C9A96E]/20 backdrop-blur-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#A8BFA3] font-medium">
              <span>{translateSync("Fair-Trade Escrow")}</span>
              <span className="text-[#C9A96E]">02</span>
            </div>
            <div className="font-display text-3xl sm:text-[34px] font-semibold text-[#C9A96E]">
              70% <span className="text-base font-normal text-[#E8D8B0]">{translateSync("Direct Payout")}</span>
            </div>
            <p className="text-[12px] text-[#A8BFA3]/80 leading-snug">
              {translateSync("Guaranteed floor price directly transferred to regional master guilds.")}
            </p>
          </div>

          {/* Stat Card 3 */}
          <div className="p-5 rounded-[4px] bg-[#2C1A0E]/80 border border-[#C9A96E]/20 backdrop-blur-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#A8BFA3] font-medium">
              <span>{translateSync("Audited Origin")}</span>
              <span className="text-[#C9A96E]">03</span>
            </div>
            <div className="font-display text-3xl sm:text-[34px] font-semibold text-[#C9A96E]">
              100% <span className="text-base font-normal text-[#E8D8B0]">{translateSync("SHA-256")}</span>
            </div>
            <p className="text-[12px] text-[#A8BFA3]/80 leading-snug">
              {translateSync("Every item issued a verifiable Google Wallet Digital Impact Pass.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

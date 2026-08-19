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
    <section className="relative w-full bg-[var(--bark)] overflow-hidden text-[var(--linen)] py-12 sm:py-16 lg:py-20 px-6 sm:px-10 lg:px-12 border-b border-[#7D5A3C]/40">
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
              <line x1="0" y1="0" x2="0" y2="36" stroke="#C8A96A" strokeWidth="3" />
              <line x1="16" y1="0" x2="16" y2="36" stroke="#C8A96A" strokeWidth="3" />
              <line x1="32" y1="0" x2="32" y2="36" stroke="#C8A96A" strokeWidth="3" />
              <rect x="0" y="4" width="24" height="6" fill="#7D5A3C" />
              <rect x="24" y="16" width="24" height="6" fill="#4F7244" />
              <rect x="0" y="28" width="24" height="6" fill="#7D5A3C" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-loom-pattern)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          {/* Eyebrow Label with 28px Gold Line */}
          <div className="flex items-center space-x-3">
            <span className="w-7 h-[1.5px] bg-[#C8A96A] inline-block" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#C8A96A] font-bold">
              {translateSync("PAN-ASIAN CIRCULAR MATERIAL SYSTEM")}
            </span>
          </div>

          {/* H1 Heading (Mobile: 30px, Tablet: 38px, Desktop: 52px) */}
          <h1 className="font-display text-[30px] sm:text-[38px] lg:text-[52px] font-medium leading-[1.14] text-[#EDE0C4] tracking-tight">
            Where festival waste is{" "}
            <em className="italic text-[#C8A96A] font-normal not-italic font-serif">
              reborn
            </em>{" "}
            into certified heritage craft.
          </h1>

          {/* Body */}
          <p className="font-body text-sm sm:text-[15px] leading-relaxed text-[#B0C4AB] max-w-[460px]">
            {translateSync(
              "Intercepting ceremonial bamboo, paper, and floral offerings across Asia with Google Gemini AI, binding every upcycled piece to an auditable 70/20/10 escrow ledger and Google Wallet Impact Pass."
            )}
          </p>

          {/* Action Buttons (Min 44px height) */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <a
              href="#marketplace-grid"
              className="px-5 py-3 rounded-[2px] bg-[#C8A96A] hover:bg-[#DFC48E] text-[#3D2B1F] text-xs uppercase tracking-wider font-bold transition-all shadow-xs inline-flex items-center space-x-2 min-h-[44px]"
            >
              <span>{translateSync("Explore marketplace")}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              href="/map"
              className="px-5 py-3 rounded-[2px] bg-transparent hover:bg-[#7D5A3C]/30 text-[#EDE0C4] border border-[#EDE0C4]/30 hover:border-[#C8A96A] text-xs uppercase tracking-wider font-medium transition-all inline-flex items-center space-x-2 min-h-[44px]"
            >
              <MapPin className="w-4 h-4 text-[#C8A96A]" />
              <span>{translateSync("View harvest map")}</span>
            </Link>
          </div>
        </div>

        {/* Right Column / Mobile Bottom Row: Stat Cards (3 across row on mobile/tablet) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3.5 pt-4 lg:pt-0">
          {/* Stat Card 1 */}
          <div className="p-4 sm:p-5 rounded-[4px] bg-[#3D2B1F]/85 border border-[#C8A96A]/20 backdrop-blur-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[#B0C4AB] font-medium">
              <span>{translateSync("Material Diverted")}</span>
              <span className="text-[#C8A96A]">01</span>
            </div>
            <div className="font-display text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#C8A96A]">
              {formatNumber(totalDivertedKg)} <span className="text-sm font-normal text-[#EDE0C4]">kg</span>
            </div>
            <p className="text-[12px] text-[#B0C4AB]/85 leading-snug">
              {translateSync("Bamboo frames, floral nirmalaya, & mulberry paper salvaged.")}
            </p>
          </div>

          {/* Stat Card 2 */}
          <div className="p-4 sm:p-5 rounded-[4px] bg-[#3D2B1F]/85 border border-[#C8A96A]/20 backdrop-blur-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[#B0C4AB] font-medium">
              <span>{translateSync("Fair Escrow")}</span>
              <span className="text-[#C8A96A]">02</span>
            </div>
            <div className="font-display text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#C8A96A]">
              70% <span className="text-sm font-normal text-[#EDE0C4]">{translateSync("Direct Payout")}</span>
            </div>
            <p className="text-[12px] text-[#B0C4AB]/85 leading-snug">
              {translateSync("Guaranteed floor price directly transferred to regional artisan cooperatives.")}
            </p>
          </div>

          {/* Stat Card 3 */}
          <div className="p-4 sm:p-5 rounded-[4px] bg-[#3D2B1F]/85 border border-[#C8A96A]/20 backdrop-blur-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[#B0C4AB] font-medium">
              <span>{translateSync("Audited Origin")}</span>
              <span className="text-[#C8A96A]">03</span>
            </div>
            <div className="font-display text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#C8A96A]">
              100% <span className="text-sm font-normal text-[#EDE0C4]">SHA-256</span>
            </div>
            <p className="text-[12px] text-[#B0C4AB]/85 leading-snug">
              {translateSync("Every item issued a verifiable Google Wallet Digital Impact Pass.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

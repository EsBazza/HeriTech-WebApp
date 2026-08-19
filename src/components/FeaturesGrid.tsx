"use client";

import React from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  TranslatableText,
  TranslatableHeading,
  TranslatableParagraph,
} from "@/components/translation/TranslatableText";
import { Camera, MapPin, QrCode, ShieldCheck, Sparkles, Scale } from "lucide-react";

export function FeaturesGrid() {
  const { translateSync } = useTranslation();

  const features = [
    {
      icon: Camera,
      title: translateSync("Google Gemini Multimodal AI Scanner"),
      description: translateSync(
        "Real-time visual material classification, degradation grading, and fiber analysis directly from on-site field photos taken by municipal collection officers."
      ),
      tag: "Gemini Vision AI",
    },
    {
      icon: MapPin,
      title: translateSync("Interactive Harvest Map & Regional Depots"),
      description: translateSync(
        "Live satellite viewfinders with device GPS positioning and SHA-256 tamper-evident telemetry hashes for festival waste pickup points."
      ),
      tag: "Google Maps Platform",
    },
    {
      icon: QrCode,
      title: translateSync("Physical Scannable 2D QR Chain-of-Custody"),
      description: translateSync(
        "Zero-NFC dependency: standard dynamic 2D QR codes ensure complete cross-device compatibility across emerging Asian craft cooperatives."
      ),
      tag: "Cross-Device Custody",
    },
    {
      icon: ShieldCheck,
      title: translateSync("70/20/10 Escrow & Google Wallet Passes"),
      description: translateSync(
        "70% direct artisan fair-trade floor payout, 20% municipal logistics, and 10% NGO trust funds backed by cryptographic Google Wallet passes."
      ),
      tag: "Google Wallet API",
    },
  ];

  return (
    <section className="w-full bg-[#EDE8DF] py-14 sm:py-16 px-6 sm:px-12 border-b border-[rgba(107,66,38,0.12)]">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-[1.5px] bg-[#6B4226] inline-block" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#6B4226] font-bold">
              {translateSync("CORE DIGITAL INFRASTRUCTURE")}
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-[var(--bark)] tracking-tight">
            How the circular digital ledger operates.
          </h2>
          <p className="font-body text-sm text-[#8C7B6B] leading-relaxed">
            {translateSync(
              "Four load-bearing digital layers coordinating municipal cleanup, master craft guilds, and verified consumer provenance."
            )}
          </p>
        </div>

        {/* 2-Column Grid with Hairline Dividers (No Card Shadows) */}
        <div className="grid grid-cols-1 md:grid-cols-2 border border-[rgba(107,66,38,0.15)] bg-[var(--cream)] rounded-[4px] overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[rgba(107,66,38,0.15)]">
          {/* Top Row / Col 1 & 2 */}
          <div className="divide-y divide-[rgba(107,66,38,0.15)]">
            {/* Feature 0 */}
            <div className="p-8 sm:p-10 space-y-4 hover:bg-[#EDE8DF]/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-[2px] bg-[#4A6741]/15 border border-[#4A6741]/30 flex items-center justify-center text-[#4A6741]">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B4226] bg-[#6B4226]/[0.08] px-2 py-0.5 rounded-[1px]">
                  {features[0].tag}
                </span>
              </div>
              <h3 className="font-display text-2xl font-medium text-[var(--bark)]">
                {features[0].title}
              </h3>
              <p className="font-body text-sm text-[#8C7B6B] leading-relaxed">
                {features[0].description}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 sm:p-10 space-y-4 hover:bg-[#EDE8DF]/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-[2px] bg-[#4A6741]/15 border border-[#4A6741]/30 flex items-center justify-center text-[#4A6741]">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B4226] bg-[#6B4226]/[0.08] px-2 py-0.5 rounded-[1px]">
                  {features[2].tag}
                </span>
              </div>
              <h3 className="font-display text-2xl font-medium text-[var(--bark)]">
                {features[2].title}
              </h3>
              <p className="font-body text-sm text-[#8C7B6B] leading-relaxed">
                {features[2].description}
              </p>
            </div>
          </div>

          {/* Right Column / Col 3 & 4 */}
          <div className="divide-y divide-[rgba(107,66,38,0.15)]">
            {/* Feature 1 */}
            <div className="p-8 sm:p-10 space-y-4 hover:bg-[#EDE8DF]/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-[2px] bg-[#4A6741]/15 border border-[#4A6741]/30 flex items-center justify-center text-[#4A6741]">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B4226] bg-[#6B4226]/[0.08] px-2 py-0.5 rounded-[1px]">
                  {features[1].tag}
                </span>
              </div>
              <h3 className="font-display text-2xl font-medium text-[var(--bark)]">
                {features[1].title}
              </h3>
              <p className="font-body text-sm text-[#8C7B6B] leading-relaxed">
                {features[1].description}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 sm:p-10 space-y-4 hover:bg-[#EDE8DF]/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-[2px] bg-[#4A6741]/15 border border-[#4A6741]/30 flex items-center justify-center text-[#4A6741]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B4226] bg-[#6B4226]/[0.08] px-2 py-0.5 rounded-[1px]">
                  {features[3].tag}
                </span>
              </div>
              <h3 className="font-display text-2xl font-medium text-[var(--bark)]">
                {features[3].title}
              </h3>
              <p className="font-body text-sm text-[#8C7B6B] leading-relaxed">
                {features[3].description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesGrid;

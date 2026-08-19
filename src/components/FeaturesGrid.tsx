"use client";

import React from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Camera, MapPin, QrCode, ShieldCheck } from "lucide-react";

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
        "Zero-NFC protocol: standard dynamic 2D QR codes ensure complete cross-device compatibility across emerging Asian craft cooperatives."
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
    <section className="w-full bg-cream-alt py-12 sm:py-16 px-6 sm:px-10 lg:px-12 border-b border-[var(--border-light)]">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-[1.5px] bg-[#7D5A3C] inline-block" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#7D5A3C] font-bold">
              {translateSync("CORE DIGITAL INFRASTRUCTURE")}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-[var(--bark)] tracking-tight">
            How the circular digital ledger operates.
          </h2>
          <p className="font-body text-[13px] sm:text-sm text-[var(--warm-gray)] leading-relaxed">
            {translateSync(
              "Four load-bearing digital layers coordinating municipal cleanup, artisan cooperatives, and verified consumer origin."
            )}
          </p>
        </div>

        {/* 2-Column Grid (Desktop & Tablet 2-col, Mobile 1-col) */}
        <div className="grid grid-cols-1 md:grid-cols-2 border border-[var(--border-light)] bg-[var(--cream)] rounded-[4px] overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[var(--border-light)]">
          {/* Col 1 */}
          <div className="divide-y divide-[var(--border-light)]">
            <div className="p-6 sm:p-8 lg:p-10 space-y-4 hover:bg-[#F2EDE3]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-[2px] bg-[#4F7244]/15 border border-[#4F7244]/30 flex items-center justify-center text-[#4F7244]">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#7D5A3C] bg-[#7D5A3C]/[0.08] px-2 py-0.5 rounded-[1px]">
                  {features[0].tag}
                </span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-medium text-[var(--bark)]">
                {features[0].title}
              </h3>
              <p className="font-body text-[13px] sm:text-sm text-[var(--warm-gray)] leading-relaxed">
                {features[0].description}
              </p>
            </div>

            <div className="p-6 sm:p-8 lg:p-10 space-y-4 hover:bg-[#F2EDE3]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-[2px] bg-[#4F7244]/15 border border-[#4F7244]/30 flex items-center justify-center text-[#4F7244]">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#7D5A3C] bg-[#7D5A3C]/[0.08] px-2 py-0.5 rounded-[1px]">
                  {features[2].tag}
                </span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-medium text-[var(--bark)]">
                {features[2].title}
              </h3>
              <p className="font-body text-[13px] sm:text-sm text-[var(--warm-gray)] leading-relaxed">
                {features[2].description}
              </p>
            </div>
          </div>

          {/* Col 2 */}
          <div className="divide-y divide-[var(--border-light)]">
            <div className="p-6 sm:p-8 lg:p-10 space-y-4 hover:bg-[#F2EDE3]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-[2px] bg-[#4F7244]/15 border border-[#4F7244]/30 flex items-center justify-center text-[#4F7244]">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#7D5A3C] bg-[#7D5A3C]/[0.08] px-2 py-0.5 rounded-[1px]">
                  {features[1].tag}
                </span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-medium text-[var(--bark)]">
                {features[1].title}
              </h3>
              <p className="font-body text-[13px] sm:text-sm text-[var(--warm-gray)] leading-relaxed">
                {features[1].description}
              </p>
            </div>

            <div className="p-6 sm:p-8 lg:p-10 space-y-4 hover:bg-[#F2EDE3]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-[2px] bg-[#4F7244]/15 border border-[#4F7244]/30 flex items-center justify-center text-[#4F7244]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#7D5A3C] bg-[#7D5A3C]/[0.08] px-2 py-0.5 rounded-[1px]">
                  {features[3].tag}
                </span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-medium text-[var(--bark)]">
                {features[3].title}
              </h3>
              <p className="font-body text-[13px] sm:text-sm text-[var(--warm-gray)] leading-relaxed">
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

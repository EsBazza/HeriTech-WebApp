"use client";

import React from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Camera, MapPin, QrCode, ShieldCheck } from "lucide-react";

export function FeaturesGrid() {
  const { translateSync } = useTranslation();

  const features = [
    {
      icon: Camera,
      title: translateSync("Material scanner"),
      description: translateSync(
        "Municipal teams photograph and categorize salvaged festival materials directly on site."
      ),
      tag: "Collection",
    },
    {
      icon: MapPin,
      title: translateSync("Harvest map"),
      description: translateSync(
        "Locate active salvage depots and available craft materials across the region in real time."
      ),
      tag: "Location",
    },
    {
      icon: QrCode,
      title: translateSync("QR handover"),
      description: translateSync(
        "Simple QR code scanning confirms physical material transfers from depots to artisan workshops."
      ),
      tag: "Custody",
    },
    {
      icon: ShieldCheck,
      title: translateSync("Direct payouts"),
      description: translateSync(
        "Artisan cooperatives receive guaranteed fair payouts directly on every completed order."
      ),
      tag: "Fair pay",
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
              {translateSync("THE WORKFLOW")}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-[var(--bark)] tracking-tight">
            How HeriTech works
          </h2>
          <p className="font-body text-[13px] sm:text-sm text-[var(--warm-gray)] leading-relaxed">
            {translateSync(
              "Four steps connecting festival collection, artisan cooperatives, and verified craft delivery."
            )}
          </p>
        </div>

        {/* 2-Column Grid */}
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

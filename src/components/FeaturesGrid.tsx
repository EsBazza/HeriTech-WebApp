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
    <section className="section-alt w-full py-12 sm:py-[72px] px-5 sm:px-12">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-[1.5px] bg-[#3E7B5C] inline-block" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#3E7B5C] font-bold">
              {translateSync("THE WORKFLOW")}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-[var(--text-heading)] tracking-tight">
            How HeriTech works
          </h2>
          <p className="font-body text-[13px] sm:text-sm text-[var(--text-body)] leading-relaxed">
            {translateSync(
              "Four steps connecting festival collection, artisan cooperatives, and verified craft delivery."
            )}
          </p>
        </div>

        {/* 2-Column Grid of Floating Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="card p-6 sm:p-8 lg:p-9 space-y-4 hover:border-[#3E7B5C]/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-[2px] bg-[#3E7B5C]/15 border border-[#3E7B5C]/30 flex items-center justify-center text-[#3E7B5C]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#3E7B5C] bg-[#3E7B5C]/10 px-2.5 py-0.5 rounded-[2px]">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-medium text-[var(--text-heading)]">
                  {feature.title}
                </h3>
                <p className="font-body text-[13px] sm:text-sm text-[var(--text-body)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesGrid;

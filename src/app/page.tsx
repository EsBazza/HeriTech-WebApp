"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { FeedCard, FeedMaterialBatch } from "@/components/FeedCard";
import { userRole } from "@/lib/roleGuard";

const CURATED_FEED_BATCHES: FeedMaterialBatch[] = [
  {
    id: "batch_01",
    title: "Panagbenga Botanical Loom Wall Tapestry",
    description:
      "Salvaged highland bolo bamboo and sun-dried strawflowers from Baguio City float sculptures. Hand-woven into archival wall decor.",
    price: 68.0,
    weightKg: 2.4,
    image: "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800",
    cooperativeName: "Cordillera Botanical Cooperative",
    region: "Baguio City",
    country: "Philippines",
    materialType: "Highland Bolo Bamboo",
    festival: "Panagbenga Festival",
  },
  {
    id: "batch_02",
    title: "Yi Peng Luminary Ambient Table Lamp",
    description:
      "Constructed with split bamboo frames and mulberry rice paper recovered post-celebration along the Ping River in Chiang Mai.",
    price: 85.0,
    weightKg: 1.8,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    cooperativeName: "Lanna Heritage Joinery",
    region: "Chiang Mai",
    country: "Thailand",
    materialType: "Mulberry Rice Paper & Bamboo",
    festival: "Yi Peng Lantern Festival",
  },
  {
    id: "batch_03",
    title: "Temple Nirmalaya Artisanal Watercolor Pigment Set",
    description:
      "Extracted from ceremonial marigolds and rose garland biomass. Solar-dried and milled into archival watercolor half-pans.",
    price: 45.0,
    weightKg: 3.5,
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",
    cooperativeName: "Nirmalaya Bio-Craft Collective",
    region: "Varanasi",
    country: "India",
    materialType: "Ceremonial Floral Biomass",
    festival: "Ganesh Chaturthi",
  },
  {
    id: "batch_04",
    title: "Pingxi Repulped Botanical Accordion Journal",
    description:
      "Recycled long-fiber lantern sheets reconstituted with indigenous fern inclusions and unbleached cotton binding cord.",
    price: 38.0,
    weightKg: 1.2,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800",
    cooperativeName: "Pingxi Sustainable Papermaking",
    region: "New Taipei",
    country: "Taiwan",
    materialType: "Mulberry Lantern Paper",
    festival: "Pingxi Lantern Festival",
  },
  {
    id: "batch_05",
    title: "Sinulog Festival Upcycled Abaca Bunting Tote",
    description:
      "Heavy-duty abaca fiber strips and ceremonial banner textiles repurposed into reinforced market bags.",
    price: 52.0,
    weightKg: 2.1,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
    cooperativeName: "Cebu Ancestral Weavers Cooperative",
    region: "Cebu City",
    country: "Philippines",
    materialType: "Abaca Fiber & Banner Textile",
    festival: "Sinulog Festival",
  },
  {
    id: "batch_06",
    title: "Loi Krathong Biodegradable Banana Leaf Wall Plate",
    description:
      "Compressed organic banana trunk fibers and natural gum arabic binder forming resilient wall art tiles.",
    price: 42.0,
    weightKg: 1.6,
    image: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800",
    cooperativeName: "Lanna Eco-Craft Community",
    region: "Sukhothai",
    country: "Thailand",
    materialType: "Organic Banana Fiber",
    festival: "Loi Krathong",
  },
];

export default function FeedHomePage() {
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const [batches, setBatches] = useState<FeedMaterialBatch[]>(CURATED_FEED_BATCHES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);

  // Live Countdown state inspired by reference card element
  const [timeLeft, setTimeLeft] = useState({ days: 22, hours: 23, mins: 5, secs: 36 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        return { ...prev, secs: 59, mins: prev.mins > 0 ? prev.mins - 1 : 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const role = userRole(user);

  const filterTags = [
    "All",
    "Bamboo",
    "Rice Paper",
    "Botanical Flora",
    "Abaca",
    "Philippines",
    "Thailand",
    "India",
  ];

  const filteredBatches = batches.filter((b) => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchDesc = b.description.toLowerCase().includes(q);
      const matchCoop = b.cooperativeName.toLowerCase().includes(q);
      const matchFestival = b.festival.toLowerCase().includes(q);
      const matchMat = b.materialType.toLowerCase().includes(q);
      const matchRegion = b.region.toLowerCase().includes(q);
      if (
        !matchTitle &&
        !matchDesc &&
        !matchCoop &&
        !matchFestival &&
        !matchMat &&
        !matchRegion
      ) {
        return false;
      }
    }

    if (selectedTag === "All") return true;
    if (selectedTag === "Philippines") return b.country === "Philippines";
    if (selectedTag === "Thailand") return b.country === "Thailand";
    if (selectedTag === "India") return b.country === "India";
    return (
      b.materialType.toLowerCase().includes(selectedTag.toLowerCase()) ||
      b.title.toLowerCase().includes(selectedTag.toLowerCase())
    );
  });

  return (
    <div className="w-full min-h-screen text-[#2A4737] pb-20">
      
      {/* HERO SECTION - Fresh Soft Botanical Light Sage Canvas */}
      <section className="relative w-full overflow-hidden bg-[#EFF6F1] border-b border-[#D2E4D7] text-[#1E4D34]">
        
        {/* Background Image: Sunlit Asian botanical craft studio with bamboo & tropical greens */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/fresh-botanical-hero-bg.png"
            alt="Sunlit Southeast Asian Botanical Craft Studio with Bamboo"
            fill
            className="object-cover object-center opacity-85 filter contrast-[1.02] brightness-[0.98]"
            priority
          />
          {/* Gentle light sage gradient overlay for clear typography */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#EFF6F1] via-[#EFF6F1]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#EFF6F1] via-transparent to-[#EFF6F1]/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Botanical Heritage Pill Badge */}
              <div className="inline-flex items-center space-x-2.5 bg-[#1E4D34] px-4 py-1.5 rounded-full border border-[#3A7B59]/40 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#8FBC8F] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F4F8F5]">
                  PAN-ASIAN CIRCULAR ORIGIN LEDGER
                </span>
              </div>

              {/* Light Sage Hero Title with HeriTech Logo Emblem and Partnered By Badges */}
              <div className="space-y-6">
                
                {/* Hero Title + Clean Background-Free HeriTech Logo Emblem */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                    <Image
                      src="/logo heritech.png"
                      alt="HeriTech Emblem"
                      width={80}
                      height={80}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                      priority
                    />
                  </div>
                  <div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#143826] uppercase leading-[0.95] font-display">
                      HERITECH <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E6B4A] via-[#3A7B59] to-[#C49B48]">2026</span>
                    </h1>
                    <p className="text-xs uppercase tracking-[0.18em] font-extrabold text-[#2E6B4A] pt-1">
                      CIRCULAR ORIGIN & PROVENANCE PROTOCOL
                    </p>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-[#2B523E] max-w-xl leading-relaxed font-body font-medium pt-1">
                  Transforming post-festival organic biomass into immutable heritage artifacts. Verified 70/15/15 financial escrow splits, Google Gemini AI material auditing, and digital provenance passes.
                </p>

                {/* Partnered By Section with 2 Clean Background-Free Partner Logos */}
                <div className="pt-4 border-t border-[#D5E6DC] max-w-lg">
                  <span className="text-[10px] uppercase font-extrabold tracking-[0.2em] text-[#5B8870] block mb-3">
                    PARTNERED BY
                  </span>
                  <div className="flex items-center space-x-6 flex-wrap gap-y-3">
                    
                    {/* Partner 1: EDUtech Asia (Clean background-free vector logo) */}
                    <div className="flex items-center space-x-2.5">
                      <div className="h-10 w-auto flex items-center justify-center">
                        <Image
                          src="/edutech-asia-clean.png"
                          alt="EDUtech Asia"
                          width={150}
                          height={40}
                          className="h-10 w-auto object-contain filter drop-shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Divider dot */}
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3A7B59]/40 hidden sm:inline-block" />

                    {/* Partner 2: University of the Assumption (Clean background-free emblem) */}
                    <div className="flex items-center space-x-2.5">
                      <div className="h-11 w-auto flex items-center justify-center">
                        <Image
                          src="/university-of-assumption.png"
                          alt="University of the Assumption"
                          width={44}
                          height={44}
                          className="h-11 w-auto object-contain filter drop-shadow-xs"
                        />
                      </div>
                      <div className="text-left">
                        <span className="text-[11px] font-extrabold uppercase text-[#1E4D34] block leading-none">
                          University of the Assumption
                        </span>
                        <span className="text-[9px] font-bold text-[#5B8870] block pt-0.5">
                          City of San Fernando, Pampanga
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>

            {/* Right Column - Light Sage Telemetry Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-[#C5DCD0] p-7 rounded-2xl shadow-xl space-y-6 text-left text-[#1E4D34]">
                
                {/* Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E4EFE7]">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2E6B4A] animate-ping" />
                    <span className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#1E4D34]">
                      LIVE PROVENANCE LEDGER
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#E8F3ED] text-[9px] font-bold uppercase tracking-wider text-[#2E6B4A] border border-[#C5DCD0]">
                    VERIFIED SHA-256
                  </span>
                </div>

                {/* 70 / 15 / 15 Financial Escrow Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#2B523E]">
                    <span>AUTOMATED DISBURSEMENT ENGINE</span>
                    <span className="text-[#2E6B4A]">100% TRANSPARENT</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2.5 w-full rounded-full bg-[#E4EFE7] overflow-hidden flex border border-[#C5DCD0]">
                    <div className="h-full bg-[#2E6B4A] w-[70%]" title="70% Artisan Direct Payout" />
                    <div className="h-full bg-[#3A7B59] w-[15%]" title="15% LGU Cleanup Trust" />
                    <div className="h-full bg-[#C49B48] w-[15%]" title="15% Protocol" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-[#E8F3ED]/80 p-2.5 rounded-lg border border-[#C5DCD0]">
                      <span className="block text-sm font-bold text-[#1E4D34] font-mono-data">70%</span>
                      <span className="text-[9px] uppercase font-semibold text-[#2B523E]">Artisans</span>
                    </div>
                    <div className="bg-[#E4F2E9]/80 p-2.5 rounded-lg border border-[#BDE0CB]">
                      <span className="block text-sm font-bold text-[#2E6B4A] font-mono-data">15%</span>
                      <span className="text-[9px] uppercase font-semibold text-[#2B523E]">Municipal NGO</span>
                    </div>
                    <div className="bg-[#FAF3E6]/80 p-2.5 rounded-lg border border-[#EADBBD]">
                      <span className="block text-sm font-bold text-[#A67E2E] font-mono-data">15%</span>
                      <span className="text-[9px] uppercase font-semibold text-[#664D18]">Protocol</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#F4F8F5] p-3.5 rounded-xl border border-[#D8E6DC]">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#5B8870] block">
                      BIOMASS DIVERTED
                    </span>
                    <span className="text-lg font-bold text-[#1E4D34] font-mono-data">
                      14.8 <span className="text-xs font-normal text-[#2E6B4A]">TONS</span>
                    </span>
                  </div>

                  <div className="bg-[#F4F8F5] p-3.5 rounded-xl border border-[#D8E6DC]">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#5B8870] block">
                      ACTIVE COOPERATIVES
                    </span>
                    <span className="text-lg font-bold text-[#1E4D34] font-mono-data">
                      48 <span className="text-xs font-normal text-[#2E6B4A]">UNITS</span>
                    </span>
                  </div>
                </div>

                {/* Subtext */}
                <div className="pt-2 border-t border-[#E4EFE7] flex items-center justify-between text-[9px] font-bold text-[#5B8870] uppercase tracking-widest">
                  <span>GOOGLE WALLET COMPATIBLE</span>
                  <span className="text-[#2E6B4A]">100% VERIFIED</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEED CONTENT SECTION - Warm Alabaster Container Matching Impact Ledger */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        
        {/* Search & Filter Component matching Impact Ledger Card styling */}
        <div className="bg-[rgba(255,255,255,0.94)] border border-[rgba(46,90,68,0.16)] p-6 rounded-[8px] shadow-[0_2px_12px_-2px_rgba(24,51,36,0.08),0_1px_4px_-1px_rgba(24,51,36,0.04)] space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#122B1E]">
                {translateSync("Curated Festival Material Batches")}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {translateSync("Discover authenticated post-festival raw materials and upcycled artisan crafts.")}
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#587563] pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.75" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translateSync("Search materials or crafts...")}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[rgba(46,90,68,0.2)] rounded-[4px] text-xs text-[#122B1E] placeholder-[#587563]/60 focus:outline-none focus:border-[#2E5A44] transition-colors shadow-xs"
              />
            </div>
          </div>

          {/* Filter Tags */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-[rgba(46,90,68,0.1)]">
            {filterTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3.5 py-1.5 rounded-[2px] text-xs uppercase tracking-wider font-bold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-[#2E5A44] text-[#F4F7F4] shadow-xs"
                      : "bg-white text-[#587563] hover:bg-slate-50 border border-[rgba(46,90,68,0.15)]"
                  }`}
                >
                  {translateSync(tag)}
                </button>
              );
            })}
          </div>

        </div>

        {/* Feed Cards Grid */}
        {filteredBatches.length === 0 ? (
          <div className="p-12 text-center border border-[rgba(46,90,68,0.16)] rounded-[8px] bg-[rgba(255,255,255,0.9)] space-y-3 max-w-lg mx-auto">
            <p className="font-display text-xl text-[#122B1E] font-bold">
              {translateSync("No matching items found")}
            </p>
            <p className="text-xs text-[#587563] max-w-sm mx-auto">
              {translateSync("Try clearing your search query or selecting a different tag above.")}
            </p>
            <button
              onClick={() => {
                setSelectedTag("All");
                setSearchQuery("");
              }}
              className="px-5 py-2.5 bg-[#2E5A44] text-[#F4F7F4] text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer"
            >
              {translateSync("Reset filters")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBatches.slice(0, visibleCount).map((batch) => (
              <FeedCard key={batch.id} batch={batch} role={role} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredBatches.length && (
          <div className="pt-4 text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 4)}
              className="px-8 py-3.5 bg-white border border-[rgba(46,90,68,0.25)] hover:border-[#2E5A44] text-[#122B1E] hover:text-[#2E5A44] text-xs uppercase tracking-wider font-bold rounded-[2px] transition-all shadow-xs cursor-pointer"
            >
              {translateSync("Load more material batches")}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}


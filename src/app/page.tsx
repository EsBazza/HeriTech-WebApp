"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const { translateSync, formatNumber } = useTranslation();
  const [batches, setBatches] = useState<FeedMaterialBatch[]>(CURATED_FEED_BATCHES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);

  // Live Countdown state inspired by reference card element
  const [timeLeft, setTimeLeft] = useState({ days: 22, hours: 23, mins: 5, secs: 36 });

  // Live kg upcycled from /api/stats
  const [totalKgUpcycled, setTotalKgUpcycled] = useState<number | null>(null);
  const [displayedKg, setDisplayedKg] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  // Animated count-up: smoothly counts from 0 → target over ~1.5 s
  const animateCounter = useCallback((target: number) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const duration = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedKg(Math.round(eased * target * 10) / 10);
      if (progress < 1) animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.totalKgCollected != null) {
          const kg = data.data.totalKgCollected;
          setTotalKgUpcycled(kg);
          animateCounter(kg);
        }
      })
      .catch(() => {
        // Fallback: sum weightKg from the curated feed
        const fallback = CURATED_FEED_BATCHES.reduce((s, b) => s + b.weightKg, 0);
        setTotalKgUpcycled(fallback);
        animateCounter(fallback);
      });
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch live products from /api/products to display in the global marketplace feed
  useEffect(() => {
    async function loadMarketplaceProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const liveBatches: FeedMaterialBatch[] = data.data.map((p: any) => {
            const firstImg = Array.isArray(p.images) && p.images[0] ? p.images[0] : (typeof p.images === "string" ? p.images : undefined);
            const tags = Array.isArray(p.materialTags) && p.materialTags.length > 0 ? p.materialTags.join(", ") : (p.sourceBatch?.materialType || "Upcycled Heritage Piece");
            return {
              id: p.id,
              title: p.title,
              description: p.description || "",
              price: Number(p.price) || 0,
              image: firstImg,
              cooperativeName: p.artisan?.workshopName || p.artisan?.fullName || "Certified Artisan Workshop",
              region: p.artisan?.country || p.sourceBatch?.agreement?.country || "Asia",
              country: p.sourceBatch?.agreement?.country || p.artisan?.country || "Asia",
              weightKg: Number(p.kgDiverted) || 1.5,
              materialType: tags,
              festival: p.sourceBatch?.agreement?.festival || "Pan-Asian Origin",
            };
          });

          // Combine live products with curated ones, avoiding duplicates
          const liveIds = new Set(liveBatches.map((b) => b.id));
          const remainingCurated = CURATED_FEED_BATCHES.filter((b) => !liveIds.has(b.id));
          setBatches([...liveBatches, ...remainingCurated]);
        }
      } catch (err) {
        console.warn("Failed to load live marketplace products, using curated default:", err);
      }
    }
    loadMarketplaceProducts();
  }, []);

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
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">

              {/* Light Sage Hero Title with HeriTech Logo Emblem and Partnered By Logos */}
              <div className="space-y-6 w-full flex flex-col items-center lg:items-start">
                
                {/* Hero HeriTech Logo Emblem (Positioned above 'IT' of HERITECH) */}
                <div className="space-y-2 flex flex-col items-center lg:items-start">
                  <div className="relative inline-block text-center">
                    {/* Logo centered directly above the symmetrical 'IT' of HERITECH */}
                    <div className="w-full flex justify-center mb-4 sm:mb-6">
                      <div className="w-36 h-36 sm:w-44 sm:h-44 lg:w-52 lg:h-52 flex items-center justify-center">
                        <Image
                          src="/logo_heritech-removebg-preview.png"
                          alt="HeriTech Emblem"
                          width={220}
                          height={220}
                          className="w-full h-full object-contain filter drop-shadow-xl"
                          priority
                        />
                      </div>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#143826] uppercase leading-[0.95] font-display text-center">
                      HERITECH
                    </h1>
                  </div>
                  <p className="text-xs sm:text-sm uppercase tracking-[0.18em] font-extrabold text-[#2E6B4A] pt-1 text-center lg:text-left">
                    Preserving Culture Through Circular Innovation
                  </p>
                </div>

                <div className="space-y-1.5 pt-1 max-w-xl text-center lg:text-left mx-auto lg:mx-0">
                  <p className="text-sm sm:text-base font-bold text-[#143826]">
                    Authentic Upcycled Goods Across Pan-Asia, Powered by Google
                  </p>
                  <p className="text-sm sm:text-base text-[#2B523E] leading-relaxed font-body font-medium">
                    We upcycle post-festival materials into certified heritage crafts throughout the Pan-Asian region. Every item features digital proof of origin and automated financial splits to ensure artisans and partners are paid fairly.
                  </p>
                </div>

                {/* Partnered With Section with Clean Background-Free Partner Logos */}
                <div className="pt-5 border-t border-[#D5E6DC] max-w-xl w-full text-center lg:text-left">
                  <span className="text-[10px] uppercase font-extrabold tracking-[0.2em] text-[#5B8870] block mb-3 text-center lg:text-left">
                    PARTNERED WITH
                  </span>
                  <div className="flex items-center justify-center lg:justify-start space-x-6 sm:space-x-8 flex-wrap gap-y-4">
                    
                    {/* Partner 1: EDUtech Asia (WebP Logo) */}
                    <div className="flex items-center justify-center">
                      <div className="h-14 sm:h-16 w-auto flex items-center justify-center">
                        <Image
                          src="/EDUtech_asia-REV1200.webp"
                          alt="EDUtech Asia"
                          width={240}
                          height={70}
                          className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Divider dot */}
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3A7B59]/40 hidden sm:inline-block" />

                    {/* Partner 2: University of the Assumption */}
                    <div className="flex items-center space-x-3.5 justify-center">
                      <div className="h-16 sm:h-20 w-auto flex items-center justify-center shrink-0">
                        <Image
                          src="/university-of-assumption.png"
                          alt="University of the Assumption"
                          width={76}
                          height={76}
                          className="h-16 sm:h-20 w-auto object-contain filter drop-shadow-xs"
                        />
                      </div>
                      <div className="text-left">
                        <span className="text-sm sm:text-base font-extrabold uppercase text-[#1E4D34] block leading-tight tracking-wide">
                          University of the Assumption
                        </span>
                        <span className="text-xs font-bold text-[#5B8870] block pt-1">
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
                  <span className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#1E4D34]">
                    LIVE PROVENANCE LEDGER
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
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

                  {/* Live Total KG Upcycled counter */}
                  <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[#E8F3ED] to-[#F4F8F5] p-3.5 rounded-xl border border-[#BDE0CB] relative overflow-hidden">
                    {/* live pulse dot */}
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4A] animate-ping flex-shrink-0" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-[#2E6B4A] block">
                        KG UPCYCLED
                      </span>
                    </div>
                    <span className="text-lg font-bold text-[#1E4D34] font-mono-data tabular-nums">
                      {totalKgUpcycled === null ? (
                        <span className="animate-pulse text-[#5B8870]">—</span>
                      ) : (
                        <>
                          {formatNumber(displayedKg)}
                          <span className="text-xs font-normal text-[#2E6B4A] ml-1">KG</span>
                        </>
                      )}
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
                {translateSync("Sourced from Festivals. Crafted by Artisans.")}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {translateSync("Discover unique artisan products crafted from post-festival materials.")}
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
              {translateSync("Load more artisan products")}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}


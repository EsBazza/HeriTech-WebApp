"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
];

const ACTIVE_REGIONS = [
  { name: "Cordillera (Philippines)", batches: 12, kg: "340 kg" },
  { name: "Chiang Mai (Thailand)", batches: 8, kg: "210 kg" },
  { name: "Varanasi (India)", batches: 15, kg: "480 kg" },
  { name: "New Taipei (Taiwan)", batches: 6, kg: "135 kg" },
  { name: "Cebu (Philippines)", batches: 9, kg: "195 kg" },
];

const RECENT_COOPERATIVES = [
  "Cordillera Botanical Cooperative",
  "Lanna Heritage Joinery",
  "Nirmalaya Bio-Craft Collective",
  "Pingxi Sustainable Papermaking",
  "Cebu Ancestral Weavers Cooperative",
];

export default function FeedHomePage() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const [batches, setBatches] = useState<FeedMaterialBatch[]>(CURATED_FEED_BATCHES);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);

  const role = userRole(user);

  const navLinks = [
    {
      name: "Home",
      href: "/",
      icon: (active: boolean) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"
            stroke={active ? "#7D5A3C" : "#5C4A38"}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      name: "Harvest Map",
      href: "/map",
      icon: (active: boolean) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21s-7-5.5-7-11.5a7 7 0 1 1 14 0C19 15.5 12 21 12 21z"
            stroke={active ? "#7D5A3C" : "#5C4A38"}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="9.5"
            r="2.5"
            stroke={active ? "#7D5A3C" : "#5C4A38"}
            strokeWidth="1.75"
          />
        </svg>
      ),
    },
    {
      name: "Impact Ledger",
      href: "/impact",
      icon: (active: boolean) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 20V10M12 20V4M6 20v-6"
            stroke={active ? "#7D5A3C" : "#5C4A38"}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      name: "Profile",
      href: "/profile",
      icon: (active: boolean) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke={active ? "#7D5A3C" : "#5C4A38"}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="7"
            r="4"
            stroke={active ? "#7D5A3C" : "#5C4A38"}
            strokeWidth="1.75"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex justify-center lg:justify-between gap-8 items-start">
          {/* ==================================================== */}
          {/* 1. LEFT SIDEBAR (Desktop Only: 240px Fixed)          */}
          {/* ==================================================== */}
          <aside className="hidden lg:flex flex-col justify-between w-[240px] sticky top-24 h-[calc(100vh-8rem)] shrink-0 pr-4 border-r border-[rgba(125,90,60,0.12)]">
            <div className="space-y-6">
              {/* Brand Header */}
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[rgba(125,90,60,0.2)] bg-[#3D2B1F] flex items-center justify-center">
                  <Image
                    src="/logo heritech.png"
                    alt="HeriTech Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <span className="font-display text-2xl font-semibold text-[#2E1E12] tracking-tight">
                  HeriTech
                </span>
              </Link>

              {/* Vertical Nav Links */}
              <nav className="space-y-1">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-[4px] text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[rgba(125,90,60,0.1)] text-[#7D5A3C] font-bold"
                          : "text-[var(--text-body)] hover:bg-[rgba(125,90,60,0.05)] hover:text-[#7D5A3C]"
                      }`}
                    >
                      {link.icon(isActive)}
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Identity Card at Bottom */}
            <div className="pt-4 border-t border-[rgba(125,90,60,0.12)]">
              {user ? (
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#7D5A3C] text-[#EDE0C4] flex items-center justify-center font-bold text-xs shrink-0">
                    {user.fullName?.slice(0, 2).toUpperCase() || "HT"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#2E1E12] truncate">
                      {user.fullName || "User"}
                    </p>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#7D5A3C] bg-[rgba(125,90,60,0.1)] px-1.5 py-0.2 rounded-[1px]">
                      {role}
                    </span>
                  </div>
                </div>
              ) : (
                <Link
                  href="/profile"
                  className="block text-center py-2 text-xs font-bold uppercase tracking-wider text-[#7D5A3C] border border-[#7D5A3C]/40 rounded-[2px] hover:bg-[#7D5A3C] hover:text-[#EDE0C4] transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </aside>

          {/* ==================================================== */}
          {/* 2. CENTER SOCIAL FEED (Max 640px, Centered)          */}
          {/* ==================================================== */}
          <main className="w-full max-w-[640px] space-y-6">
            {/* Feed Subtitle / Filter Row */}
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(125,90,60,0.12)]">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-medium text-[var(--text-heading)]">
                  Material Harvest Feed
                </h1>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Verified salvage batches ready for artisan craft transformation
                </p>
              </div>

              {role !== "guest" && (
                <span className="text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-[2px] bg-[rgba(46,90,68,0.1)] text-[#2E5A44]">
                  {role} view
                </span>
              )}
            </div>

            {/* Vertical Stack of Feed Cards */}
            <div className="space-y-5">
              {batches.slice(0, visibleCount).map((batch) => (
                <FeedCard key={batch.id} batch={batch} role={role} />
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < batches.length && (
              <div className="pt-4 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 2)}
                  className="px-6 py-3 bg-[rgba(255,255,255,0.85)] border border-[rgba(125,90,60,0.25)] hover:border-[#7D5A3C] text-[var(--text-heading)] hover:text-[#7D5A3C] text-xs uppercase tracking-wider font-bold rounded-[2px] transition-colors cursor-pointer min-h-[44px]"
                >
                  Load more batches
                </button>
              </div>
            )}
          </main>

          {/* ==================================================== */}
          {/* 3. RIGHT SIDEBAR (Desktop Only: 220px Optional)      */}
          {/* ==================================================== */}
          <aside className="hidden xl:block w-[220px] sticky top-24 space-y-6 shrink-0 pl-4 border-l border-[rgba(125,90,60,0.12)]">
            {/* Active Regions Widget */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-[0.1em] font-bold text-[var(--text-heading)]">
                Active Regions
              </h3>
              <div className="divide-y divide-[rgba(125,90,60,0.08)]">
                {ACTIVE_REGIONS.map((r) => (
                  <div key={r.name} className="py-2 flex items-center justify-between text-xs">
                    <span className="text-[var(--text-body)] truncate max-w-[130px]">
                      {r.name}
                    </span>
                    <span className="font-mono-data text-[var(--text-muted)] text-[11px]">
                      {r.kg}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recently Joined Cooperatives Widget */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs uppercase tracking-[0.1em] font-bold text-[var(--text-heading)]">
                Recent Cooperatives
              </h3>
              <ul className="space-y-2 text-xs text-[var(--text-body)]">
                {RECENT_COOPERATIVES.map((name) => (
                  <li key={name} className="truncate py-0.5 border-b border-[rgba(125,90,60,0.06)]">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

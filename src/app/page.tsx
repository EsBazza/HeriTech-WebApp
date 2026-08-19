"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { WeaveDivider } from "@/components/WeaveDivider";
import { HeroSection } from "@/components/HeroSection";
import { MaterialCard, MaterialProduct } from "@/components/MaterialCard";
import { FeaturesGrid } from "@/components/FeaturesGrid";
import { EscrowBar } from "@/components/EscrowBar";
import { ImpactBadges } from "@/components/ImpactBadges";
import { Search, Tag, Sparkles, Filter, Loader2, ArrowRight } from "lucide-react";

// Curated High-Fidelity Fallback Products for Demo Resilience
const CURATED_DEMO_PRODUCTS: MaterialProduct[] = [
  {
    id: "prod_demo_01",
    title: "Panagbenga Botanical Loom Wall Tapestry",
    description: "Handcrafted from structural highland Bolo bamboo culms and sun-dried Everlasting floral clusters salvaged from float sculptures in Baguio City.",
    price: 68.0,
    images: ["https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800"],
    materialTags: ["Bamboo", "Botanical Flora", "Highland Loom"],
    stock: 4,
    kgDiverted: 2.4,
    ngoFundName: "Cordillera Ancestral Watershed Trust",
    artisan: {
      fullName: "Danilo Cruz",
      workshopName: "Cordillera Botanical Guild",
      country: "Philippines",
    },
    sourceBatch: {
      id: "HT-2026-0101",
      materialType: "Highland Bolo Bamboo & Strawflower",
      condition: "Pristine & Dry",
      agreement: {
        festival: "Panagbenga Festival",
        country: "Philippines",
      },
    },
  },
  {
    id: "prod_demo_02",
    title: "Yi Peng Luminary Ambient Table Lamp",
    description: "Constructed with non-combusted split bamboo frames and raw mulberry rice paper recovered post-celebration along the Ping River in Chiang Mai.",
    price: 85.0,
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"],
    materialTags: ["Bamboo", "Rice Paper", "Mulberry Fiber"],
    stock: 3,
    kgDiverted: 1.8,
    ngoFundName: "Ping River Aquatic Ecology Trust",
    artisan: {
      fullName: "Somchai Prasert",
      workshopName: "Lanna Heritage Joinery",
      country: "Thailand",
    },
    sourceBatch: {
      id: "HT-2026-0102",
      materialType: "Split Bamboo & Mulberry Paper",
      condition: "Intact & Wire-Free",
      agreement: {
        festival: "Yi Peng Lantern Festival",
        country: "Thailand",
      },
    },
  },
  {
    id: "prod_demo_03",
    title: "Temple Nirmalaya Artisanal Watercolor Pigment Set",
    description: "Extracted from sacred post-ceremonial marigolds and rose garland biomass. Solar-dried and milled into rich, archival-grade natural watercolor pans.",
    price: 45.0,
    images: ["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800"],
    materialTags: ["Botanical Flora", "Natural Pigment", "Organic Marigold"],
    stock: 8,
    kgDiverted: 3.5,
    ngoFundName: "Ganges River Clean Water Foundation",
    artisan: {
      fullName: "Aarav Sharma",
      workshopName: "Nirmalaya Bio-Craft Collective",
      country: "India",
    },
    sourceBatch: {
      id: "HT-2026-0103",
      materialType: "Temple Nirmalaya Floral Biomass",
      condition: "Organic Rich Pigment",
      agreement: {
        festival: "Ganesh Chaturthi",
        country: "India",
      },
    },
  },
  {
    id: "prod_demo_04",
    title: "Pingxi Repulped Botanical Accordion Journal",
    description: "Recycled long-fiber lantern sheets reconstituted with indigenous fern inclusions. Bound with unbleached cotton cord and beeswaxed spine.",
    price: 38.0,
    images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800"],
    materialTags: ["Rice Paper", "Mulberry Paper", "Recycled Fiber"],
    stock: 6,
    kgDiverted: 1.2,
    ngoFundName: "Taiwan Mountain Forest Trust",
    artisan: {
      fullName: "Lin Wei-Ting",
      workshopName: "Pingxi Sustainable Papermaking",
      country: "Taiwan",
    },
    sourceBatch: {
      id: "HT-2026-0104",
      materialType: "Mulberry Lantern Paper",
      condition: "Clean & Sun-Dried",
      agreement: {
        festival: "Pingxi Lantern Festival",
        country: "Taiwan",
      },
    },
  },
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const [products, setProducts] = useState<MaterialProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(data.data);
        } else {
          setProducts(CURATED_DEMO_PRODUCTS);
        }
      } catch (err) {
        console.warn("Using curated fallback products:", err);
        setProducts(CURATED_DEMO_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const allTags = [
    "All",
    "Bamboo",
    "Botanical Flora",
    "Rice Paper",
    "Mulberry Paper",
    "Philippines",
    "Thailand",
    "India",
  ];

  const displayProducts = products.length > 0 ? products : CURATED_DEMO_PRODUCTS;

  const filteredProducts = displayProducts.filter((p) => {
    // Search query filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchArtisan = p.artisan?.fullName?.toLowerCase().includes(q);
      const matchFestival = p.sourceBatch?.agreement?.festival?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchArtisan && !matchFestival) return false;
    }

    // Tag filter
    if (selectedTag === "All") return true;
    if (selectedTag === "Philippines") return p.sourceBatch?.agreement?.country === "Philippines";
    if (selectedTag === "Thailand") return p.sourceBatch?.agreement?.country === "Thailand";
    if (selectedTag === "India") return p.sourceBatch?.agreement?.country === "India";
    return (
      p.materialTags?.some((tag) => tag.toLowerCase().includes(selectedTag.toLowerCase())) ||
      p.sourceBatch?.materialType?.toLowerCase().includes(selectedTag.toLowerCase())
    );
  });

  return (
    <div className="w-full bg-[var(--cream)] flex flex-col">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Signature Weave Divider */}
      <WeaveDivider height={24} bgColor="#2C1A0E" />

      {/* 3. Marketplace & Certified Goods Grid */}
      <section
        id="marketplace-grid"
        className="w-full py-14 sm:py-16 px-6 sm:px-12 max-w-7xl mx-auto space-y-10"
      >
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-[1.5px] bg-[#6B4226] inline-block" />
              <span className="text-[11px] uppercase tracking-[0.14em] text-[#6B4226] font-bold">
                {translateSync("AUTHENTICATED HERITAGE GOODS")}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-[var(--bark)] tracking-tight">
              Circulated Masterpiece Catalog
            </h2>
            <p className="font-body text-sm text-[#8C7B6B] leading-relaxed">
              {translateSync(
                "Every piece is handcrafted from verified ceremonial festival salvage, permanently linked to its harvest Batch ID, and sold with a 70% direct artisan payout."
              )}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center space-x-2 text-xs text-[#6B4226] font-mono-data bg-[#EDE8DF] px-3 py-1.5 rounded-[2px] border border-[rgba(107,66,38,0.15)] self-start md:self-auto font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>
              {filteredProducts.length} {translateSync("Authenticated Pieces")}
            </span>
          </div>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="space-y-4 pt-2">
          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#8C7B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translateSync("Search by festival, material fiber, or master artisan...")}
              className="w-full pl-10 pr-4 py-2.5 rounded-[2px] bg-[var(--cream)] border border-[rgba(107,66,38,0.2)] text-xs text-[var(--bark)] placeholder-[#8C7B6B] focus:outline-none focus:border-[#6B4226] transition-colors"
            />
          </div>

          {/* Filter Tags */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
            {allTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-[2px] text-[11px] uppercase tracking-wider font-bold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-[#6B4226] text-[#E8D8B0] border border-[#6B4226]"
                      : "bg-[#EDE8DF] text-[#8C7B6B] hover:text-[#6B4226] hover:bg-[#EDE8DF]/80 border border-[rgba(107,66,38,0.1)]"
                  }`}
                >
                  {translateSync(tag)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid: 3-Col Desktop, 2-Col Tablet, 1-Col Mobile */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#6B4226] animate-spin" />
            <p className="text-xs uppercase tracking-widest text-[#8C7B6B] font-mono-data">
              {translateSync("Loading circular material catalog...")}
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center border border-[rgba(107,66,38,0.15)] rounded-[4px] bg-[#EDE8DF]/50 space-y-3">
            <p className="font-display text-xl text-[var(--bark)] font-medium">
              {translateSync("No matching heritage goods found")}
            </p>
            <p className="text-xs text-[#8C7B6B] max-w-sm mx-auto">
              {translateSync("Try clearing your search query or selecting a different festival tag above.")}
            </p>
            <button
              onClick={() => {
                setSelectedTag("All");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-[2px] bg-[#6B4226] text-[#E8D8B0] text-xs font-bold uppercase tracking-wider"
            >
              {translateSync("Reset filters")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <MaterialCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Weave Divider */}
      <WeaveDivider height={24} bgColor="#2C1A0E" />

      {/* 5. Features Grid Section */}
      <FeaturesGrid />

      {/* 6. Weave Divider */}
      <WeaveDivider height={24} bgColor="#2C1A0E" />

      {/* 7. 70/20/10 Escrow Section */}
      <EscrowBar />

      {/* 8. Weave Divider */}
      <WeaveDivider height={24} bgColor="#2C1A0E" />

      {/* 9. Impact Badges Section */}
      <ImpactBadges />

      {/* 10. Weave Divider before Footer */}
      <WeaveDivider height={24} bgColor="#2C1A0E" />
    </div>
  );
}

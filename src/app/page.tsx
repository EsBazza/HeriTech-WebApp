"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { HeroSection } from "@/components/HeroSection";
import { MaterialCard, MaterialProduct } from "@/components/MaterialCard";
import { FeaturesGrid } from "@/components/FeaturesGrid";
import { EscrowBar } from "@/components/EscrowBar";
import { Search, Sparkles, Loader2 } from "lucide-react";

// Curated Fallback Products for Demo Resilience
const CURATED_DEMO_PRODUCTS: MaterialProduct[] = [
  {
    id: "prod_demo_01",
    title: "Panagbenga Botanical Loom Wall Tapestry",
    description: "Handcrafted from highland bamboo and sun-dried floral clusters salvaged from float sculptures in Baguio City.",
    price: 68.0,
    images: ["https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800"],
    materialTags: ["Bamboo", "Botanical Flora", "Highland Loom"],
    stock: 4,
    kgDiverted: 2.4,
    ngoFundName: "Cordillera Ancestral Watershed Trust",
    artisan: {
      fullName: "Danilo Cruz",
      workshopName: "Cordillera Botanical Cooperative",
      country: "Philippines",
    },
    sourceBatch: {
      id: "HT-BATCH-0101",
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
    description: "Constructed with split bamboo frames and mulberry rice paper recovered post-celebration in Chiang Mai.",
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
      id: "HT-BATCH-0102",
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
    description: "Extracted from ceremonial marigolds and rose garland biomass. Solar-dried and milled into archival watercolor pans.",
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
      id: "HT-BATCH-0103",
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
    description: "Recycled long-fiber lantern sheets reconstituted with indigenous fern inclusions and unbleached cotton cord.",
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
      id: "HT-BATCH-0104",
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
        console.warn("Using fallback products:", err);
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
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
      const matchArtisan = p.artisan?.fullName ? p.artisan.fullName.toLowerCase().includes(q) : false;
      const matchFestival = p.sourceBatch?.agreement?.festival?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchArtisan && !matchFestival) return false;
    }

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
    <div className="w-full flex flex-col">
      {/* 1. Hero Section (Solid dark anchor) */}
      <HeroSection />

      {/* 2. Marketplace & Certified Goods Grid (Transparent weave shows through) */}
      <section
        id="marketplace-grid"
        className="section-main w-full py-12 sm:py-[72px] px-5 sm:px-12"
      >
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-[1.5px] bg-[#7D5A3C] inline-block" />
                <span className="text-[11px] uppercase tracking-[0.14em] text-[#7D5A3C] font-bold">
                  {translateSync("AVAILABLE CRAFT PIECES")}
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium text-[var(--text-heading)] tracking-tight">
                Handmade from festival salvage
              </h2>
              <p className="font-body text-[13px] sm:text-sm text-[var(--text-body)] leading-relaxed">
                {translateSync(
                  "Each piece is made by local artisan cooperatives using salvaged ceremonial materials."
                )}
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center space-x-2 text-xs text-[#7D5A3C] font-mono-data bg-[rgba(255,255,255,0.85)] px-3.5 py-2 rounded-[2px] border border-[var(--border-light)] self-start md:self-auto font-bold min-h-[44px] shadow-xs">
              <Sparkles className="w-4 h-4 text-[#C8A96A]" />
              <span>
                {filteredProducts.length} {translateSync("Pieces available")}
              </span>
            </div>
          </div>

          {/* Search & Tag Filter Bar */}
          <div className="space-y-4 pt-2">
            {/* Search Input */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translateSync("Search by festival, material, or artisan...")}
                className="w-full pl-10 pr-4 py-3 rounded-[2px] bg-[rgba(255,255,255,0.88)] border border-[var(--border-mid)] text-sm text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#7D5A3C] transition-colors min-h-[44px]"
              />
            </div>

            {/* Filter Tags */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {allTags.map((tag) => {
                const active = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3.5 py-2 rounded-[2px] text-xs uppercase tracking-wider font-bold transition-all whitespace-nowrap cursor-pointer min-h-[44px] ${
                      active
                        ? "bg-[#7D5A3C] text-[#EDE0C4] border border-[#7D5A3C]"
                        : "bg-[rgba(255,255,255,0.85)] text-[var(--text-body)] hover:text-[#7D5A3C] hover:bg-white border border-[var(--border-light)] shadow-xs"
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
              <Loader2 className="w-8 h-8 text-[#7D5A3C] animate-spin" />
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-mono-data">
                {translateSync("Loading material catalog...")}
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center border border-[var(--border-light)] rounded-[4px] bg-[rgba(255,255,255,0.8)] space-y-3">
              <p className="font-display text-xl text-[var(--text-heading)] font-medium">
                {translateSync("No matching items found")}
              </p>
              <p className="text-[13px] text-[var(--text-body)] max-w-sm mx-auto">
                {translateSync("Try clearing your search query or selecting a different tag above.")}
              </p>
              <button
                onClick={() => {
                  setSelectedTag("All");
                  setSearchQuery("");
                }}
                className="px-4 py-2.5 rounded-[2px] bg-[#7D5A3C] text-[#EDE0C4] text-xs font-bold uppercase tracking-wider min-h-[44px]"
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
        </div>
      </section>

      {/* 3. Features Grid Section (Alternating cream overlay) */}
      <FeaturesGrid />

      {/* 4. How payments work Section (Transparent weave background) */}
      <EscrowBar />
    </div>
  );
}

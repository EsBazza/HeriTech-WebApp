"use client";

import React, { useState } from "react";
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
    <div className="w-full min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Clean Search & Filter Bar */}
        <div className="space-y-4">
          {/* Search Input Box */}
          <div className="relative w-full max-w-xl mx-auto">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(92,74,56,0.6)] pointer-events-none"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translateSync("Search festival materials, crafts, or cooperatives...")}
              className="w-full pl-10 pr-4 py-3 bg-[rgba(255,255,255,0.88)] border border-[rgba(125,90,60,0.18)] rounded-[4px] text-sm text-[#2E1E12] placeholder-[rgba(92,74,56,0.55)] focus:outline-none focus:border-[#7D5A3C] transition-colors min-h-[44px] shadow-xs"
            />
          </div>

          {/* Filter Tags Carousel */}
          <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {filterTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3.5 py-1.5 rounded-[2px] text-xs uppercase tracking-wider font-bold transition-all whitespace-nowrap cursor-pointer min-h-[36px] ${
                    active
                      ? "bg-[#3D2B1F] text-[#EDE0C4] border border-[#3D2B1F]"
                      : "bg-[rgba(255,255,255,0.85)] text-[#5C4A38] hover:text-[#2E1E12] hover:bg-white border border-[rgba(125,90,60,0.15)]"
                  }`}
                >
                  {translateSync(tag)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Grid of Feed Cards */}
        {filteredBatches.length === 0 ? (
          <div className="p-12 text-center border border-[rgba(125,90,60,0.15)] rounded-[6px] bg-[rgba(255,255,255,0.8)] space-y-3 max-w-lg mx-auto">
            <p className="font-display text-xl text-[#2E1E12] font-medium">
              {translateSync("No matching items found")}
            </p>
            <p className="text-xs text-[#5C4A38] max-w-sm mx-auto">
              {translateSync("Try clearing your search query or selecting a different tag above.")}
            </p>
            <button
              onClick={() => {
                setSelectedTag("All");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-[#3D2B1F] text-[#EDE0C4] text-xs font-bold uppercase tracking-wider rounded-[2px] min-h-[44px] cursor-pointer"
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

        {/* Load More Action Button */}
        {visibleCount < filteredBatches.length && (
          <div className="pt-4 text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 4)}
              className="px-6 py-3 bg-[rgba(255,255,255,0.85)] border border-[rgba(125,90,60,0.25)] hover:border-[#7D5A3C] text-[#2E1E12] hover:text-[#7D5A3C] text-xs uppercase tracking-wider font-bold rounded-[2px] transition-colors cursor-pointer min-h-[44px]"
            >
              {translateSync("Load more batches")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

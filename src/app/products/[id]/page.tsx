"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  Sparkles,
  ShieldCheck,
  Heart,
  Scale,
  Leaf,
  ArrowLeft,
  Lock,
  ShoppingBag,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/context/CartContext";
import { calculateEscrowSplit } from "@/lib/escrow";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";

const FALLBACK_PRODUCTS: Record<string, any> = {
  batch_01: {
    id: "batch_01",
    title: "Panagbenga Botanical Loom Wall Tapestry",
    description:
      "Salvaged highland bolo bamboo and sun-dried strawflowers from Baguio City float sculptures. Hand-woven into archival wall decor with natural beeswax finish.",
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
  prod_demo_01: {
    id: "prod_demo_01",
    title: "Panagbenga Botanical Loom Wall Tapestry",
    description:
      "Salvaged highland bolo bamboo and sun-dried strawflowers from Baguio City float sculptures. Hand-woven into archival wall decor with natural beeswax finish.",
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
  batch_02: {
    id: "batch_02",
    title: "Yi Peng Luminary Ambient Table Lamp",
    description:
      "Constructed with split bamboo frames and mulberry rice paper recovered post-celebration along the Ping River in Chiang Mai. Emits warm ambient light.",
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
  prod_demo_02: {
    id: "prod_demo_02",
    title: "Yi Peng Luminary Ambient Table Lamp",
    description:
      "Constructed with split bamboo frames and mulberry rice paper recovered post-celebration along the Ping River in Chiang Mai. Emits warm ambient light.",
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
  batch_03: {
    id: "batch_03",
    title: "Temple Nirmalaya Artisanal Watercolor Pigment Set",
    description:
      "Extracted from ceremonial marigolds and rose garland biomass. Solar-dried and milled into archival watercolor half-pans with gum arabic binder.",
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
  prod_demo_03: {
    id: "prod_demo_03",
    title: "Temple Nirmalaya Artisanal Watercolor Pigment Set",
    description:
      "Extracted from ceremonial marigolds and rose garland biomass. Solar-dried and milled into archival watercolor half-pans with gum arabic binder.",
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
  batch_04: {
    id: "batch_04",
    title: "Pingxi Repulped Botanical Accordion Journal",
    description:
      "Recycled long-fiber lantern sheets reconstituted with indigenous fern inclusions and unbleached cotton cord.",
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
  prod_demo_04: {
    id: "prod_demo_04",
    title: "Pingxi Repulped Botanical Accordion Journal",
    description:
      "Recycled long-fiber lantern sheets reconstituted with indigenous fern inclusions and unbleached cotton cord.",
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
  batch_05: {
    id: "batch_05",
    title: "Sinulog Festival Upcycled Abaca Bunting Tote",
    description:
      "Heavy-duty abaca fiber strips and ceremonial banner textiles repurposed into reinforced market bags.",
    price: 52.0,
    images: ["https://images.unsplash.com/photo-1544816155-12df9643f363?w=800"],
    materialTags: ["Abaca", "Banner Textile", "Woven"],
    stock: 5,
    kgDiverted: 2.1,
    ngoFundName: "Visayas Coastal Ecology Trust",
    artisan: {
      fullName: "Maria Santos",
      workshopName: "Cebu Ancestral Weavers Cooperative",
      country: "Philippines",
    },
    sourceBatch: {
      id: "HT-BATCH-0105",
      materialType: "Abaca Fiber & Banner Textile",
      condition: "Pristine",
      agreement: {
        festival: "Sinulog Festival",
        country: "Philippines",
      },
    },
  },
  batch_06: {
    id: "batch_06",
    title: "Loi Krathong Biodegradable Banana Leaf Wall Plate",
    description:
      "Compressed organic banana trunk fibers and natural gum arabic binder forming resilient wall art tiles.",
    price: 42.0,
    images: ["https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800"],
    materialTags: ["Banana Fiber", "Botanical Art", "Eco Tile"],
    stock: 7,
    kgDiverted: 1.6,
    ngoFundName: "Sukhothai Cultural Heritage Fund",
    artisan: {
      fullName: "Kamonwan Boonmee",
      workshopName: "Lanna Eco-Craft Community",
      country: "Thailand",
    },
    sourceBatch: {
      id: "HT-BATCH-0106",
      materialType: "Organic Banana Fiber",
      condition: "Dry & Sun-Bleached",
      agreement: {
        festival: "Loi Krathong",
        country: "Thailand",
      },
    },
  },
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { formatCurrency, formatNumber, translateSync, currentCurrency } = useTranslation();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const productId = params?.id as string;

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        let found: any = null;

        if (data.success && Array.isArray(data.data)) {
          found = data.data.find((p: any) => p.id === productId);
        }

        // Fallback to dictionary
        if (!found) {
          found = FALLBACK_PRODUCTS[productId] || FALLBACK_PRODUCTS["batch_01"];
        }

        setProduct(found);
      } catch (err) {
        console.warn("Using fallback product for id:", productId, err);
        setProduct(FALLBACK_PRODUCTS[productId] || FALLBACK_PRODUCTS["batch_01"]);
      } finally {
        setLoading(false);
      }
    }
    if (productId) loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#3E7B5C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[var(--text-muted)] mt-4 font-mono-data">
          {translateSync("Loading origin passport...")}
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-3">
        <h2 className="text-lg font-bold text-[#2E1E12]">
          {translateSync("Product not found")}
        </h2>
        <p className="text-xs text-[#5C4A38]">
          {translateSync("This piece may have already been claimed.")}
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-[#3E7B5C] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{translateSync("Return to Feed")}</span>
        </Link>
      </div>
    );
  }

  const escrow = calculateEscrowSplit(product.price);

  const cartProduct = {
    id: product.id,
    title: product.title,
    description: product.description || "",
    price: product.price,
    image:
      product.images?.[0] ||
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    artisanId: product.artisanId || "usr_art_05",
    artisanName: product.artisan?.fullName || "Danilo Cruz",
    artisanWorkshop:
      product.artisan?.workshopName || "Cordillera Botanical Cooperative",
    artisanCountry: product.sourceBatch?.agreement?.country || "Philippines",
    kgDiverted: product.kgDiverted || 2.0,
    ngoFundName: product.ngoFundName || "Regional Watershed Trust",
    sourceBatchId: product.sourceBatchId || "HT-BATCH-0101",
    festivalName: product.sourceBatch?.agreement?.festival || "Pan-Asian Harvest",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#5C4A38] hover:text-[#2E1E12] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{translateSync("Back to Feed")}</span>
      </Link>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Col: Imagery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-[8px] bg-white border border-[rgba(46,90,68,0.16)] overflow-hidden shadow-[0_2px_12px_-2px_rgba(24,51,36,0.08),0_1px_4px_-1px_rgba(24,51,36,0.04)]">
            <img
              src={
                product.images?.[0] ||
                "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"
              }
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Provenance Micro-Card */}
          <div className="p-4 rounded-[6px] bg-[rgba(46,90,68,0.08)] border border-[rgba(46,90,68,0.2)] flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center space-x-2 text-[#183324] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#3E7B5C]" />
              <span>
                {translateSync("Origin")}:{" "}
                <strong>
                  {product.sourceBatch?.agreement?.festival || "Pan-Asian Festival"}
                </strong>{" "}
                ({product.sourceBatch?.agreement?.country || "Asia"})
              </span>
            </div>
            <span className="font-mono-data text-[10px] text-[#183324] bg-[#A3D9B5]/40 px-2 py-0.5 rounded-[2px] font-bold">
              {formatNumber(product.kgDiverted || 2.0)} {translateSync("kg diverted")}
            </span>
          </div>
        </div>

        {/* Right Col: Details & Escrow Breakdown */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#3E7B5C]">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">
                {translateSync("AUTHENTICATED HERITAGE UPCYCLE")}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#2E1E12] tracking-tight mt-1">
              {product.title}
            </h1>
            <p className="text-2xl font-bold font-display text-[#7D5A3C] mt-3">
              {formatCurrency(product.price)}{" "}
              <span className="text-xs font-sans font-normal text-[#5C4A38]">
                {currentCurrency}
              </span>
            </p>
          </div>

          <p className="text-sm text-[#5C4A38] leading-relaxed">
            {product.description}
          </p>

          {/* Maker Info */}
          <div className="p-4 rounded-[6px] bg-white border border-[rgba(46,90,68,0.16)] flex items-center justify-between shadow-[0_2px_10px_-2px_rgba(24,51,36,0.08),0_1px_4px_-1px_rgba(24,51,36,0.04)]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[rgba(125,90,60,0.12)] text-[#7D5A3C] font-bold flex items-center justify-center text-sm">
                {product.artisan?.fullName?.charAt(0) || "M"}
              </div>
              <div>
                <span className="text-[10px] text-[rgba(92,74,56,0.6)] font-bold uppercase tracking-wider block">
                  {translateSync("Certified Maker")}
                </span>
                <span className="text-sm font-bold text-[#2E1E12]">
                  {product.artisan?.fullName || "Master Artisan"}
                </span>
                <p className="text-xs text-[#5C4A38]">
                  {product.artisan?.workshopName || "Heritage Cooperative"}
                </p>
              </div>
            </div>

            <Link
              href="/messages"
              className="p-2.5 rounded-[2px] border border-[rgba(125,90,60,0.2)] hover:border-[#7D5A3C] text-[#2E1E12] flex items-center space-x-1.5 text-xs font-semibold"
            >
              <MessageSquare className="w-4 h-4 text-[#3E7B5C]" />
              <span className="hidden sm:inline">
                {translateSync("Ask Question")}
              </span>
            </Link>
          </div>

          {/* 70/20/10 Escrow Split Visualizer */}
          <div className="p-5 rounded-[6px] bg-white border border-[rgba(46,90,68,0.16)] space-y-4 shadow-[0_2px_10px_-2px_rgba(24,51,36,0.08),0_1px_4px_-1px_rgba(24,51,36,0.04)]">
            <div className="flex items-center justify-between border-b border-[rgba(125,90,60,0.08)] pb-3">
              <span className="text-xs font-bold text-[#2E1E12] uppercase tracking-wide">
                {translateSync("Transparent 70/20/10 Escrow Split")}
              </span>
              <span className="text-[10px] font-mono-data text-[#3E7B5C] bg-[#A3D9B5]/30 px-2 py-0.5 rounded-[1px] font-bold">
                100% {translateSync("AUDITABLE")}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2 text-[#5C4A38]">
                  <Heart className="w-3.5 h-3.5 text-[#3E7B5C]" />
                  <span>
                    {translateSync("70% Direct Artisan Fair-Trade Payout")}
                  </span>
                </span>
                <span className="font-mono-data font-bold text-[#3E7B5C]">
                  {formatCurrency(escrow.artisanPayout)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2 text-[#5C4A38]">
                  <Scale className="w-3.5 h-3.5 text-[#7D5A3C]" />
                  <span>
                    {translateSync("20% Municipal Salvage Logistics & Platform")}
                  </span>
                </span>
                <span className="font-mono-data font-bold text-[#7D5A3C]">
                  {formatCurrency(escrow.platformFee)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2 text-[#5C4A38]">
                  <Leaf className="w-3.5 h-3.5 text-[#183324]" />
                  <span>
                    10% NGO: {product.ngoFundName || "Regional Watershed Trust"}
                  </span>
                </span>
                <span className="font-mono-data font-bold text-[#183324]">
                  {formatCurrency(escrow.ngoContribution)}
                </span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-2.5 rounded-[2px] overflow-hidden flex bg-[rgba(125,90,60,0.1)]">
              <div
                style={{ width: "70%" }}
                className="bg-[#3E7B5C] h-full"
                title="70% Artisan"
              />
              <div
                style={{ width: "20%" }}
                className="bg-[#7D5A3C] h-full"
                title="20% Logistics & Platform"
              />
              <div
                style={{ width: "10%" }}
                className="bg-[#183324] h-full"
                title="10% NGO Trust Fund"
              />
            </div>
          </div>

          {/* Action Buttons: Add to Cart & Buy with Escrow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => addToCart(cartProduct)}
              className="py-3.5 rounded-[2px] border border-[#3E7B5C] text-[#3E7B5C] hover:bg-[#3E7B5C] hover:text-[#F4F7F4] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 min-h-[44px] cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{translateSync("Add to Cart")}</span>
            </button>

            <button
              onClick={() => setCheckoutModalOpen(true)}
              className="py-3.5 rounded-[2px] bg-[#3D2B1F] hover:bg-[#5A3F2A] text-[#EDE0C4] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 min-h-[44px] cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{translateSync("Buy with 70/20/10 Escrow")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Step Checkout Modal with Shipping Location Map */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        directProduct={cartProduct}
      />
    </div>
  );
}

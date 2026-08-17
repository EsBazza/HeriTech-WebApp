"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Scale, Heart, Leaf, MapPin, Tag } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

interface ProductItem {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  materialTags: string[];
  stock: number;
  kgDiverted: number;
  ngoFundName: string;
  artisan: {
    fullName: string;
    workshopName: string;
    country: string;
    avatarUrl?: string;
  };
  sourceBatch: {
    id: string;
    materialType: string;
    condition: string;
    agreement?: {
      festival: string;
      country: string;
    };
  };
}

export default function MarketplacePage() {
  const { user, signInWithGoogle, authError } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [urlAuthError, setUrlAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error_description") || params.get("error");
      if (err) {
        setUrlAuthError(decodeURIComponent(err));
      }
    }
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const allTags = ["All", "Bamboo", "Botanical Flora", "Rice Paper", "Mulberry Paper", "Philippines", "Thailand", "India"];

  const filteredProducts = products.filter((p) => {
    if (selectedTag === "All") return true;
    if (selectedTag === "Philippines") return p.sourceBatch.agreement?.country === "Philippines";
    if (selectedTag === "Thailand") return p.sourceBatch.agreement?.country === "Thailand";
    if (selectedTag === "India") return p.sourceBatch.agreement?.country === "India";
    return p.materialTags.some((tag) => tag.toLowerCase().includes(selectedTag.toLowerCase()));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* OAuth Callback Notice (if any) */}
      {(urlAuthError || authError) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1 shadow-sm">
          <div className="flex items-center space-x-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Google Authentication Notice:</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            {urlAuthError || authError}
          </p>
          <p className="text-[11px] text-amber-700 pt-1">
            💡 <strong>Quick Fix in Supabase Dashboard:</strong> Go to <strong>Authentication → URL Configuration</strong> and add <code>http://localhost:3000/**</code> to your <strong>Redirect URLs</strong>.
          </p>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A6B3A] via-[#14532D] to-[#0F391E] text-white p-8 md:p-14 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Pan-Asian Circular Craft Economy</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Every Piece Reclaims a Sacred Asian Festival.
          </h1>

          <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed">
            Direct from Panagbenga, Yi Peng, and Ganesh Chaturthi. Crafted by master artisans, backed by a fixed <strong>70% Artisan / 20% LGU / 10% NGO</strong> escrow standard, and authenticated with a verifiable <strong>Google Wallet Impact Pass</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/impact"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-[#1A6B3A] font-semibold text-sm hover:bg-emerald-50 transition-all shadow-md"
            >
              <span>Explore Public Impact Ledger</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {!user && (
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-sm transition-all"
              >
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative Watermark Grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <Leaf className="w-96 h-96 text-white" />
        </div>
      </section>

      {/* Escrow Guarantee Banner */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] shadow-sm flex items-start space-x-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">70% Direct Artisan Payout</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Guaranteed fair-trade floor price sent directly to certified regional craft guilds.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] shadow-sm flex items-start space-x-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">20% LGU Logistics & Platform</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Funds on-site municipal collection bins and AI multimodal inspection infrastructure.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] shadow-sm flex items-start space-x-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">10% Verified NGO Trust Fund</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Transparent continent-wide post-festival clean water and forest conservation funds.
            </p>
          </div>
        </div>
      </section>

      {/* Marketplace Catalog Header & Filter */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#141312]">Authenticated Heritage Upcycles</h2>
            <p className="text-xs text-gray-500 mt-1">
              Select a piece to inspect its immutable harvest coordinates, maker journey, and Google Wallet Pass.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedTag === tag
                    ? "bg-[#1A6B3A] text-white shadow-sm"
                    : "bg-white border border-[#E6E2D8] text-gray-600 hover:border-gray-400"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E6E2D8] p-8">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No goods match this filter</h3>
            <p className="text-xs text-gray-500 mt-1">Try selecting a different material tag or festival.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex flex-col bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden hover:border-[#1A6B3A] hover:shadow-lg transition-all"
              >
                {/* Product Image */}
                <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
                  <img
                    src={product.images[0] || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{product.sourceBatch.agreement?.country || "Asia"}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#1A6B3A]/90 backdrop-blur-md text-[10px] font-bold text-white">
                      {product.kgDiverted} kg diverted
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                      <span>{product.sourceBatch.agreement?.festival || "Cultural Festival"}</span>
                      <span className="font-mono-data text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                        {product.sourceBatch.materialType}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#1A6B3A] transition-colors mt-1 line-clamp-2">
                      {product.title}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Crafted by</span>
                      <span className="text-xs font-semibold text-gray-800 truncate max-w-[130px] block">
                        {product.artisan.fullName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-[#141312]">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-400 block">USD</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

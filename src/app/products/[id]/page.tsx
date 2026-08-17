"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  Heart,
  Scale,
  Leaf,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ExternalLink,
  ShoppingBag,
  Truck,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartContext";
import { calculateEscrowSplit } from "@/lib/escrow";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const productId = params?.id as string;

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success) {
          const found = data.data.find((p: any) => p.id === productId);
          setProduct(found || null);
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setLoading(false);
      }
    }
    if (productId) loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#1A6B3A] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-gray-500 mt-4">Loading provenance passport...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-lg font-bold text-gray-900">Product not found</h2>
        <p className="text-xs text-gray-500 mt-1">This piece may have already been claimed.</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1A6B3A]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Marketplace</span>
        </Link>
      </div>
    );
  }

  const escrow = calculateEscrowSplit(product.price);

  const cartProduct = {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    image: product.images[0] || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    artisanId: product.artisanId || "usr_art_05",
    artisanName: product.artisan?.fullName || "Danilo Cruz",
    artisanWorkshop: product.artisan?.workshopName || "Cordillera Botanical Guild",
    artisanCountry: product.sourceBatch?.agreement?.country || "Philippines",
    kgDiverted: product.kgDiverted,
    ngoFundName: product.ngoFundName,
    sourceBatchId: product.sourceBatchId,
    festivalName: product.sourceBatch?.agreement?.festival,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Goods</span>
      </Link>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Col: Imagery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl bg-white border border-[#E6E2D8] overflow-hidden shadow-sm">
            <img
              src={product.images[0] || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Provenance Micro-Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-emerald-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#1A6B3A]" />
              <span>
                Origin: <strong>{product.sourceBatch.agreement?.festival || "Cultural Festival"}</strong> (
                {product.sourceBatch.agreement?.country})
              </span>
            </div>
            <span className="font-mono-data text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
              {product.kgDiverted} kg diverted
            </span>
          </div>
        </div>

        {/* Right Col: Details & Escrow Breakdown */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AUTHENTICATED HERITAGE UPCYCLE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
              {product.title}
            </h1>
            <p className="text-2xl font-black text-[#141312] mt-3">
              ${product.price.toFixed(2)}{" "}
              <span className="text-xs font-normal text-gray-500">USD</span>
            </p>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

          {/* Maker Info with Direct Message Link */}
          <div className="p-4 rounded-2xl bg-white border border-[#E6E2D8] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                {product.artisan.fullName.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">
                  Certified Master Maker
                </span>
                <span className="text-sm font-bold text-gray-900">{product.artisan.fullName}</span>
                <p className="text-xs text-gray-500">{product.artisan.workshopName || "Heritage Guild"}</p>
              </div>
            </div>

            <Link
              href="/messages"
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center space-x-1.5 text-xs font-semibold"
              title="Message Maker"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Ask Question</span>
            </Link>
          </div>

          {/* 70/20/10 Escrow Split Visualizer */}
          <div className="p-5 rounded-2xl bg-white border border-[#E6E2D8] space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Transparent 70/20/10 Escrow Split
              </span>
              <span className="text-[10px] font-mono-data text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                100% AUDITABLE
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2 text-gray-700">
                  <Heart className="w-3.5 h-3.5 text-blue-600" />
                  <span>70% Direct Artisan Fair-Trade Payout</span>
                </span>
                <span className="font-mono-data font-bold text-blue-700">
                  ${escrow.artisanPayout.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2 text-gray-700">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  <span>20% Municipal Salvage Logistics & Platform</span>
                </span>
                <span className="font-mono-data font-bold text-emerald-700">
                  ${escrow.platformFee.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2 text-gray-700">
                  <Leaf className="w-3.5 h-3.5 text-amber-600" />
                  <span>10% NGO: {product.ngoFundName}</span>
                </span>
                <span className="font-mono-data font-bold text-amber-700">
                  ${escrow.ngoContribution.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-gray-100">
              <div style={{ width: "70%" }} className="bg-blue-600 h-full" title="70% Artisan" />
              <div style={{ width: "20%" }} className="bg-emerald-600 h-full" title="20% LGU & Platform" />
              <div style={{ width: "10%" }} className="bg-amber-500 h-full" title="10% NGO Fund" />
            </div>
          </div>

          {/* Action Buttons: Add to Cart & Buy Now */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => addToCart(cartProduct)}
              className="py-4 rounded-xl border-2 border-[#1A6B3A] text-[#1A6B3A] hover:bg-emerald-50 font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={() => setCheckoutModalOpen(true)}
              className="py-4 rounded-xl bg-[#D9532F] hover:bg-[#B84223] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Buy with 70/20/10 Escrow</span>
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

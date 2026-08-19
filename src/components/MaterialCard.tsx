"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { ShoppingBag, ArrowRight, MapPin } from "lucide-react";

export interface MaterialProduct {
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

interface MaterialCardProps {
  product: MaterialProduct;
  onOpenCheckout?: (product: MaterialProduct) => void;
}

export function MaterialCard({ product, onOpenCheckout }: MaterialCardProps) {
  const { addToCart } = useCart();
  const { formatCurrency, formatNumber, translateSync } = useTranslation();

  const primaryImage = product.images?.[0];
  const festival = product.sourceBatch?.agreement?.festival || "Pan-Asian Festival";
  const country = product.sourceBatch?.agreement?.country || "Asia";
  const primaryTag = product.materialTags?.[0] || product.sourceBatch?.materialType || "Upcycled Fiber";

  const cartItem = {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    image: primaryImage || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    artisanId: product.artisan?.fullName || "Artisan Cooperative",
    artisanName: product.artisan?.fullName || "Master Artisan",
    artisanWorkshop: product.artisan?.workshopName || "Heritage Workshop",
    artisanCountry: country,
    kgDiverted: product.kgDiverted,
    ngoFundName: product.ngoFundName,
    sourceBatchId: product.sourceBatch?.id || "HT-BATCH",
    festivalName: festival,
  };

  return (
    <div className="bg-[var(--cream)] bg-linen border border-[var(--border-light)] rounded-[4px] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[var(--border-mid)] group">
      <div>
        {/* Card Image Area (140px tall with 15% woven texture overlay) */}
        <div className="relative h-[140px] w-full overflow-hidden bg-gradient-to-br from-[#7D5A3C]/20 via-[#4F7244]/15 to-[#3D2B1F]/30">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-400 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center p-4">
              <span className="font-display text-lg text-[#7D5A3C] font-semibold">{festival}</span>
            </div>
          )}

          {/* 15% Woven Texture Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.15] select-none mix-blend-overlay"
            aria-hidden="true"
          >
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id={`card-weave-${product.id}`}
                  width="16"
                  height="12"
                  patternUnits="userSpaceOnUse"
                >
                  <rect x="0" y="0" width="8" height="6" fill="#C8A96A" />
                  <rect x="8" y="6" width="8" height="6" fill="#7D5A3C" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#card-weave-${product.id})`} />
            </svg>
          </div>

          {/* Origin Pill Floating Top-Left */}
          <div className="absolute top-2.5 left-2.5">
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-[#EDE0C4] bg-[#3D2B1F]/90 px-2 py-0.5 rounded-[1px] border border-[#C8A96A]/30 shadow-xs flex items-center space-x-1">
              <MapPin className="w-2.5 h-2.5 text-[#C8A96A]" />
              <span>{festival}</span>
            </span>
          </div>

          {/* Diverted Kilograms Badge Top-Right */}
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[10px] font-mono-data font-bold text-[#EDE0C4] bg-[#4F7244]/95 px-1.5 py-0.5 rounded-[1px] border border-[#72956A]/40">
              +{formatNumber(product.kgDiverted)} kg
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-2.5">
          {/* Tag Pill */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[1px] text-[#7D5A3C] bg-[#7D5A3C]/[0.08] border border-[#7D5A3C]/15">
              {primaryTag}
            </span>
            <span className="text-[11px] uppercase font-medium tracking-wider px-2 py-0.5 rounded-[1px] text-[var(--warm-gray)] bg-[#F2EDE3]">
              {country}
            </span>
          </div>

          {/* Title */}
          <Link href={`/products/${product.id}`} className="block">
            <h3 className="font-display text-[19px] leading-snug font-medium text-[var(--bark)] hover:text-[#7D5A3C] transition-colors line-clamp-1">
              {product.title}
            </h3>
          </Link>

          {/* Origin Story Snippet */}
          <p className="font-body text-[13px] text-[var(--warm-gray)] line-clamp-2 leading-relaxed">
            {product.description || "Authentic ceremonial material handcrafted into enduring heritage decor."}
          </p>

          {/* Maker Line */}
          <div className="text-xs text-[var(--warm-gray)] flex items-center justify-between pt-1 border-t border-[var(--border-light)]">
            <span className="truncate max-w-[150px]">
              {translateSync("Maker:")}{" "}
              <strong className="text-[var(--bark)] font-semibold">{product.artisan?.fullName}</strong>
            </span>
            <span className="text-xs text-[#4F7244] font-bold">70% {translateSync("Fair Payout")}</span>
          </div>
        </div>
      </div>

      {/* Meta Row & Action Footer */}
      <div className="p-4 pt-0 space-y-3">
        {/* Meta Row: Quantity Diverted + Price */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-light)]">
          <span className="text-xs font-mono-data text-[var(--warm-gray)]">
            {formatNumber(product.kgDiverted)} kg {translateSync("diverted")}
          </span>
          <span className="font-display text-xl font-semibold text-[#7D5A3C]">
            {formatCurrency(product.price)}{" "}
            <span className="text-xs font-sans font-normal text-[var(--warm-gray)]">USD</span>
          </span>
        </div>

        {/* Action Buttons (Min 44px tap targets) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => addToCart(cartItem)}
            className="py-2.5 px-2.5 rounded-[2px] border border-[#7D5A3C] text-[#7D5A3C] hover:bg-[#7D5A3C] hover:text-[#EDE0C4] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5 cursor-pointer min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{translateSync("Add to cart")}</span>
          </button>

          <Link
            href={`/products/${product.id}`}
            className="py-2.5 px-2.5 rounded-[2px] bg-[#7D5A3C] hover:bg-[#5A3F2A] text-[#EDE0C4] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5 text-center min-h-[44px]"
          >
            <span>{translateSync("Inspect")}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C8A96A]" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MaterialCard;

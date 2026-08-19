"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  TranslatableText,
  TranslatableHeading,
  TranslatableParagraph,
} from "@/components/translation/TranslatableText";
import { ShoppingBag, ArrowRight, ShieldCheck, MapPin } from "lucide-react";

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
    artisanId: product.artisan?.fullName || "Master Guild",
    artisanName: product.artisan?.fullName || "Master Artisan",
    artisanWorkshop: product.artisan?.workshopName || "Heritage Guild",
    artisanCountry: country,
    kgDiverted: product.kgDiverted,
    ngoFundName: product.ngoFundName,
    sourceBatchId: product.sourceBatch?.id || "HT-2026",
    festivalName: festival,
  };

  return (
    <div className="bg-[var(--cream)] border border-[rgba(107,66,38,0.15)] rounded-[4px] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#6B4226]/50 group">
      <div>
        {/* Card Image Area (140px tall with 15% woven texture overlay) */}
        <div className="relative h-[140px] w-full overflow-hidden bg-gradient-to-br from-[#6B4226]/20 via-[#4A6741]/15 to-[#2C1A0E]/30">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-400 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center p-4">
              <span className="font-display text-lg text-[#6B4226] font-semibold">{festival}</span>
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
                  <rect x="0" y="0" width="8" height="6" fill="#C9A96E" />
                  <rect x="8" y="6" width="8" height="6" fill="#6B4226" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#card-weave-${product.id})`} />
            </svg>
          </div>

          {/* Origin Pill Floating Top-Left */}
          <div className="absolute top-2.5 left-2.5">
            <span className="text-[9px] uppercase tracking-[0.14em] font-bold text-[#E8D8B0] bg-[#2C1A0E]/90 px-2 py-0.5 rounded-[1px] border border-[#C9A96E]/30 shadow-xs flex items-center space-x-1">
              <MapPin className="w-2.5 h-2.5 text-[#C9A96E]" />
              <span>{festival}</span>
            </span>
          </div>

          {/* Diverted Kilograms Badge Top-Right */}
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[9px] font-mono-data font-bold text-[#E8D8B0] bg-[#4A6741]/90 px-1.5 py-0.5 rounded-[1px] border border-[#6B8F62]/40">
              +{formatNumber(product.kgDiverted)} kg
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-2.5">
          {/* Tag Pill */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-[1px] text-[#6B4226] bg-[#6B4226]/[0.08] border border-[#6B4226]/15">
              {primaryTag}
            </span>
            <span className="text-[10px] uppercase font-medium tracking-wider px-1.5 py-0.5 rounded-[1px] text-[#8C7B6B] bg-[#8C7B6B]/[0.08]">
              {country}
            </span>
          </div>

          {/* Title */}
          <Link href={`/products/${product.id}`} className="block">
            <h3 className="font-display text-[19px] leading-snug font-medium text-[var(--bark)] hover:text-[#6B4226] transition-colors line-clamp-1">
              {product.title}
            </h3>
          </Link>

          {/* Origin Story Snippet */}
          <p className="font-body text-xs text-[#8C7B6B] line-clamp-2 leading-relaxed">
            {product.description || "Authentic ceremonial material handcrafted into enduring heritage decor."}
          </p>

          {/* Maker Line */}
          <div className="text-[11px] text-[#8C7B6B] flex items-center justify-between pt-1 border-t border-[rgba(107,66,38,0.1)]">
            <span className="truncate max-w-[150px]">
              {translateSync("Maker:")}{" "}
              <strong className="text-[var(--bark)] font-semibold">{product.artisan?.fullName}</strong>
            </span>
            <span className="text-[10px] text-[#4A6741] font-bold">70% {translateSync("Fair Payout")}</span>
          </div>
        </div>
      </div>

      {/* Meta Row & Action Footer */}
      <div className="p-4 pt-0 space-y-3">
        {/* Meta Row: Quantity Diverted + Price */}
        <div className="flex items-center justify-between pt-2 border-t border-[rgba(107,66,38,0.1)]">
          <span className="text-xs font-mono-data text-[#8C7B6B]">
            {formatNumber(product.kgDiverted)} kg {translateSync("diverted")}
          </span>
          <span className="font-display text-xl font-semibold text-[#6B4226]">
            {formatCurrency(product.price)}{" "}
            <span className="text-[10px] font-sans font-normal text-[#8C7B6B]">USD</span>
          </span>
        </div>

        {/* Buttons: Add to Cart + Inspect */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => addToCart(cartItem)}
            className="py-2 px-2.5 rounded-[2px] border border-[#6B4226] text-[#6B4226] hover:bg-[#6B4226] hover:text-[#E8D8B0] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{translateSync("Add to cart")}</span>
          </button>

          <Link
            href={`/products/${product.id}`}
            className="py-2 px-2.5 rounded-[2px] bg-[#6B4226] hover:bg-[#54331C] text-[#E8D8B0] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5 text-center"
          >
            <span>{translateSync("Inspect")}</span>
            <ArrowRight className="w-3 h-3 text-[#C9A96E]" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MaterialCard;

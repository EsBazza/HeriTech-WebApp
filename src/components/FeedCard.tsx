"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { UserRole } from "@/lib/roleGuard";

export interface FeedMaterialBatch {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  cooperativeName: string;
  region: string;
  country: string;
  weightKg: number;
  materialType: string;
  festival: string;
  status?: string;
}

interface FeedCardProps {
  batch: FeedMaterialBatch;
  role?: UserRole;
}

export function FeedCard({ batch, role = "guest" }: FeedCardProps) {
  const { addToCart } = useCart();
  const { formatCurrency, formatNumber, translateSync } = useTranslation();

  const handleReserve = () => {
    addToCart({
      id: batch.id,
      title: batch.title,
      description: batch.description,
      price: batch.price,
      image:
        batch.image ||
        "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800",
      cooperativeName: batch.cooperativeName,
      artisanName: batch.cooperativeName,
      region: batch.region,
      kgDiverted: batch.weightKg,
      festivalName: batch.festival,
    });
  };

  return (
    <article className="w-full bg-[rgba(255,255,255,0.85)] border border-[rgba(125,90,60,0.12)] rounded-[6px] p-4 sm:p-5 space-y-3.5 transition-colors">
      {/* 1. Header Row: Cooperative Name + Region Pill */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-[rgba(125,90,60,0.12)] text-[#7D5A3C] font-bold text-[11px] flex items-center justify-center">
            {batch.cooperativeName.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-[var(--text-heading)] truncate max-w-[200px] sm:max-w-[280px]">
            {batch.cooperativeName}
          </span>
        </div>

        <span className="text-[11px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-[2px] bg-[rgba(125,90,60,0.1)] text-[#7D5A3C]">
          {batch.region || batch.country}
        </span>
      </div>

      {/* 2. Material Image Area (16:9 Aspect Ratio) */}
      <div className="relative aspect-video w-full rounded-[4px] overflow-hidden bg-gradient-to-br from-[#2E5A44]/20 via-[#7D5A3C]/15 to-[#183324]/30">
        {batch.image ? (
          <Image
            src={batch.image}
            alt={batch.title}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <span className="text-xs uppercase tracking-widest text-[#7D5A3C] font-mono-data font-bold">
              {batch.materialType}
            </span>
            <span className="text-sm font-display text-[var(--text-heading)] mt-1">
              {batch.festival}
            </span>
          </div>
        )}
      </div>

      {/* 3. Material Title */}
      <div>
        <Link href={`/products/${batch.id}`} className="block group">
          <h3 className="font-display text-[22px] leading-snug font-medium text-[var(--text-heading)] group-hover:text-[#7D5A3C] transition-colors">
            {batch.title}
          </h3>
        </Link>
      </div>

      {/* 4. Description (Max 3 lines clamped) */}
      <p className="font-body text-sm text-[var(--text-body)] line-clamp-3 leading-relaxed">
        {batch.description}
      </p>

      {/* 5. Meta Row: Weight Diverted (left) + Price (right) */}
      <div className="flex items-center justify-between pt-2 border-t border-[rgba(125,90,60,0.08)]">
        <span className="text-xs font-mono-data text-[var(--text-muted)]">
          {formatNumber(batch.weightKg)} kg verified salvage
        </span>
        <span className="font-display text-xl font-medium text-[#7D5A3C]">
          {formatCurrency(batch.price)}{" "}
          <span className="text-xs font-sans font-normal text-[var(--text-muted)]">
            USD
          </span>
        </span>
      </div>

      {/* 6. Action Row */}
      <div className="pt-1 flex items-center justify-between gap-3">
        {role === "lgu" ? (
          <Link
            href="/scanner"
            className="flex-1 py-2.5 px-4 bg-[#183324] hover:bg-[#2E5A44] text-[#EDE0C4] text-xs font-bold uppercase tracking-wider rounded-[2px] text-center transition-colors min-h-[44px] flex items-center justify-center"
          >
            {translateSync("Verify Municipal Handover")}
          </Link>
        ) : (
          <button
            onClick={handleReserve}
            className="flex-1 py-2.5 px-4 bg-[#3D2B1F] hover:bg-[#5A3F2A] text-[#EDE0C4] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer min-h-[44px]"
          >
            {translateSync("Reserve batch")}
          </button>
        )}

        <Link
          href={`/products/${batch.id}`}
          className="py-2.5 px-4 border border-[rgba(125,90,60,0.3)] hover:border-[#7D5A3C] text-[var(--text-heading)] hover:text-[#7D5A3C] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors text-center min-h-[44px] flex items-center justify-center"
        >
          {translateSync("View details")}
        </Link>
      </div>
    </article>
  );
}

export default FeedCard;

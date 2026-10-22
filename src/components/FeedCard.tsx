"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Leaf, MapPin, Plus, QrCode } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { UserRole } from "@/lib/roleGuard";
import type { ProductView } from "@/lib/server/views";
import { buttonClass, cn } from "@/components/ui";
import { spotlight } from "@/components/motion/spotlight";

/** Maps an API product to the shop card shape. */
export function toFeedItem(p: ProductView): FeedMaterialBatch {
  const country = p.sourceBatch?.agreement?.country || p.artisan?.country || "";
  return {
    id: p.id,
    artisanId: p.artisanId,
    artisanName: p.artisan?.fullName ?? undefined,
    title: p.title,
    description: p.description ?? "",
    price: Number(p.price) || 0,
    image: p.images?.[0],
    cooperativeName: p.artisan?.workshopName || p.artisan?.fullName || "Artisan workshop",
    region: country,
    country,
    weightKg: Number(p.kgDiverted) || 0,
    materialType: p.materialTags?.length ? p.materialTags.join(", ") : p.sourceBatch?.materialType || "",
    festival: p.sourceBatch?.agreement?.festival || "",
  };
}

export interface FeedMaterialBatch {
  id: string;
  artisanId?: string;
  artisanName?: string;
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

export function FeedCard({ batch }: FeedCardProps) {
  const { addToCart, items } = useCart();
  const { formatCurrency, formatNumber, translateSync } = useTranslation();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = items.some((i) => i.id === batch.id);

  const handleReserve = () => {
    addToCart({
      id: batch.id,
      title: batch.title,
      description: batch.description,
      price: batch.price,
      image: batch.image ?? "",
      cooperativeName: batch.cooperativeName,
      artisanId: batch.artisanId,
      artisanName: batch.artisanName ?? batch.cooperativeName,
      artisanWorkshop: batch.cooperativeName,
      artisanCountry: batch.country || undefined,
      region: batch.region,
      kgDiverted: batch.weightKg,
      festivalName: batch.festival,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const href = `/products/${batch.id}`;
  const location = batch.region && batch.region !== batch.country ? `${batch.region}, ${batch.country}` : batch.country;

  return (
    <article onPointerMove={spotlight} className="spotlight lift group flex flex-col bg-surface border border-line rounded-lg overflow-hidden shadow-card">
      <Link href={href} className="relative block aspect-[4/3] bg-paper-2 overflow-hidden" tabIndex={-1} aria-hidden>
        {batch.image ? (
          <Image
            src={batch.image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center text-sm text-ink-3">{translateSync(batch.materialType)}</div>
        )}
        <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-pine-900/60 to-transparent pointer-events-none" aria-hidden />
        {batch.festival && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-surface/95 px-2.5 py-1 text-xs font-medium text-ink shadow-card">
            {translateSync(batch.festival)}
          </span>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-pine-900/75 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white">
          <QrCode className="w-3 h-3" aria-hidden />
          {translateSync("Traced")}
        </span>
        <span className="absolute left-3 bottom-3 inline-flex items-center gap-1 text-xs font-medium text-white">
          <Leaf className="w-3.5 h-3.5 text-pine-200" aria-hidden />
          {formatNumber(batch.weightKg)} {translateSync("kg diverted")}
        </span>
      </Link>

      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {location && (
          <div className="flex items-center gap-1.5 text-xs text-ink-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{translateSync(location)}</span>
          </div>
        )}

        <h3 className="mt-1.5 font-display text-[22px] leading-snug font-semibold text-ink">
          <Link href={href} className="hover:text-pine-600 transition-colors focus-visible:underline">
            {translateSync(batch.title)}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-ink-3 truncate">{translateSync(batch.cooperativeName)}</p>

        {batch.materialType && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full bg-pine-50 border border-pine-100 px-2.5 py-0.5 text-xs text-pine-700 truncate max-w-full">
              {translateSync(batch.materialType)}
            </span>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-line/70 flex items-center justify-between gap-3">
          <span className="tabular font-display text-2xl font-semibold text-ink">{formatCurrency(batch.price)}</span>

          <button
            onClick={handleReserve}
            className={cn(buttonClass(inCart || justAdded ? "secondary" : "primary", "sm"), (inCart || justAdded) && "text-pine-700 border-pine-300")}
            aria-label={`${translateSync("Add to cart")}: ${batch.title}`}
          >
            {inCart || justAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {justAdded ? translateSync("Added") : inCart ? translateSync("In cart") : translateSync("Add to cart")}
          </button>
        </div>
      </div>
    </article>
  );
}

export default FeedCard;

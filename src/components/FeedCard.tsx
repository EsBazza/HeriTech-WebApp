"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Leaf, MapPin, Plus, ScanLine } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { UserRole } from "@/lib/roleGuard";
import type { ProductView } from "@/lib/server/views";
import { buttonClass, cn } from "@/components/ui";

/** Maps an API product to the shop card shape. */
export function toFeedItem(p: ProductView): FeedMaterialBatch {
  const country = p.sourceBatch?.agreement?.country || p.artisan?.country || "";
  return {
    id: p.id,
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
      artisanName: batch.cooperativeName,
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
    <article className="group flex flex-col bg-surface border border-line rounded-md overflow-hidden shadow-card hover:border-line-strong transition-colors">
      <Link href={href} className="relative block aspect-[4/3] bg-paper-2 overflow-hidden" tabIndex={-1} aria-hidden>
        {batch.image ? (
          <Image
            src={batch.image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center text-sm text-ink-3">{translateSync(batch.materialType)}</div>
        )}
        {batch.festival && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-sm bg-surface/95 px-2 py-1 text-xs font-medium text-ink shadow-card">
            {translateSync(batch.festival)}
          </span>
        )}
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

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-sm bg-pine-50 border border-pine-100 px-2 py-0.5 text-xs text-pine-700">
            <Leaf className="w-3 h-3" />
            {formatNumber(batch.weightKg)} {translateSync("kg diverted")}
          </span>
          {batch.materialType && (
            <span className="inline-flex items-center rounded-sm bg-paper-2 px-2 py-0.5 text-xs text-ink-2 truncate max-w-full">
              {translateSync(batch.materialType)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <span className="tabular font-display text-2xl font-semibold text-ink">{formatCurrency(batch.price)}</span>

          {role === "lgu" ? (
            <Link href="/scanner" className={buttonClass("secondary", "sm")}>
              <ScanLine className="w-4 h-4" />
              {translateSync("Verify handover")}
            </Link>
          ) : (
            <button
              onClick={handleReserve}
              className={cn(buttonClass(inCart || justAdded ? "secondary" : "primary", "sm"), (inCart || justAdded) && "text-pine-700 border-pine-300")}
              aria-label={`${translateSync("Add to cart")}: ${batch.title}`}
            >
              {inCart || justAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {justAdded ? translateSync("Added") : inCart ? translateSync("In cart") : translateSync("Add to cart")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default FeedCard;

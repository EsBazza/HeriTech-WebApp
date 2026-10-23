"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Gift, Leaf, MapPin, Plus, QrCode } from "lucide-react";
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
    freeClaim: Boolean(p.freeClaim),
    stock: typeof p.stock === "number" ? p.stock : undefined,
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
  /** Given away at the showcase booth: claimed on the product page, not added to the cart. */
  freeClaim?: boolean;
  /** Pieces left; 0 shows the card as sold out. Unknown (undefined) is treated as available. */
  stock?: number;
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
  const soldOut = batch.stock === 0;

  const handleReserve = () => {
    if (soldOut || inCart) return;
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
    <article className="product-tile group flex flex-col">
      {/* Square photo. With a mouse, a panel slides in from the side the cursor came in
          and leaves by the side it went out; on touch the caption below carries everything. */}
      <Link
        href={href}
        className="dir-tile relative block aspect-square rounded-lg overflow-hidden bg-paper-2 shadow-card"
        tabIndex={-1}
        aria-hidden
        onPointerEnter={(e) => slidePanel(e, true)}
        onPointerLeave={(e) => slidePanel(e, false)}
      >
        {batch.image ? (
          <Image
            src={batch.image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            className="dir-photo object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center text-sm text-ink-3">{translateSync(batch.materialType)}</div>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 z-[2] inline-flex items-center rounded-full bg-surface/95 px-2.5 py-1 text-[13px] font-semibold text-ink shadow-card">
            {translateSync("Sold out")}
          </span>
        )}
        <span className="traced-badge absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-pine-900/75 px-2.5 py-1 text-[13px] font-medium text-white">
          <QrCode className="w-3 h-3" aria-hidden />
          {translateSync("Traced")}
        </span>

        <span className="dir-panel absolute inset-0 z-[1] flex items-center justify-center p-6 text-center text-white">
          <span className="dir-panel-inner flex flex-col items-center">
            {(batch.festival || location) && (
              <span className="flex items-center gap-1.5 text-[13px] text-white/75">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {[batch.festival, location].filter(Boolean).map((t) => translateSync(t)).join(" · ")}
              </span>
            )}
            <span className="mt-2 font-display text-[28px] leading-[1.1] font-semibold text-balance">{translateSync(batch.title)}</span>
            <span className="dir-rule mt-4 h-px w-12 bg-white/70" />
            <span className="mt-4 text-[15px] text-white/85">{translateSync(batch.cooperativeName)}</span>
            <span className="mt-1.5 inline-flex flex-wrap items-center justify-center gap-1.5 text-[13px] text-white/75">
              <Leaf className="w-3.5 h-3.5 text-pine-200" />
              {formatNumber(batch.weightKg)} {translateSync("kg diverted")}
              {batch.materialType && <> · {translateSync(batch.materialType)}</>}
            </span>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold">
              {translateSync("View the piece")}
              <ArrowRight className="w-4 h-4" />
            </span>
          </span>
        </span>
      </Link>

      <div className="flex flex-col flex-1 pt-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="min-w-0 font-display text-[22px] leading-snug font-semibold text-ink">
            <Link href={href} className="hover:text-brand-2 transition-colors focus-visible:underline">
              {translateSync(batch.title)}
            </Link>
          </h3>
          <span className="shrink-0 tabular font-display text-[22px] leading-snug font-semibold text-ink">
            {batch.freeClaim ? translateSync("Free") : formatCurrency(batch.price)}
          </span>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm text-ink-3 truncate">
            {translateSync(batch.cooperativeName)}
            {batch.weightKg > 0 && <> · {formatNumber(batch.weightKg)} {translateSync("kg diverted")}</>}
          </p>

          {batch.freeClaim ? (
            <Link href={href} className={cn(buttonClass("primary", "sm"), "shrink-0")}>
              <Gift className="w-4 h-4" />
              {translateSync("Claim")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : soldOut ? (
            <span className={cn(buttonClass("secondary", "sm"), "shrink-0 opacity-60 cursor-not-allowed")} aria-disabled="true">
              {translateSync("Sold out")}
            </span>
          ) : (
            <button
              onClick={handleReserve}
              aria-disabled={inCart || undefined}
              className={cn(buttonClass(inCart || justAdded ? "secondary" : "primary", "sm"), "shrink-0", (inCart || justAdded) && "text-brand border-pine-300 cursor-default")}
              aria-label={inCart ? `${translateSync("In cart")}: ${batch.title}` : `${translateSync("Add to cart")}: ${batch.title}`}
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

/** Which edge of the tile the pointer crossed: the panel enters and leaves through it. */
function edgeOf(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  const d = { left: x, right: r.width - x, top: y, bottom: r.height - y };
  return (Object.keys(d) as (keyof typeof d)[]).reduce((a, b) => (d[b] < d[a] ? b : a));
}

function slidePanel(e: React.PointerEvent<HTMLElement>, open: boolean) {
  if (e.pointerType !== "mouse") return;
  const tile = e.currentTarget;
  const side = edgeOf(e);
  if (open) {
    // Park the panel on the entry side without animating, then slide it in
    tile.dataset.snap = "";
    tile.dataset.side = side;
    tile.dataset.open = "false";
    void tile.offsetWidth;
    delete tile.dataset.snap;
    tile.dataset.open = "true";
  } else {
    tile.dataset.side = side;
    tile.dataset.open = "false";
  }
}

export default FeedCard;

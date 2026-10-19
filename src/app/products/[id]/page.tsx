"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Lock,
  ShoppingBag,
  MessageSquare,
  FileSignature,
  ScanLine,
  Hammer,
  QrCode,
  Check,
  HandCoins,
  Truck,
  Leaf,
  Layers,
  MoveHorizontal,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { useCart } from "@/context/CartContext";
import { SPLIT, calculateEscrowSplit } from "@/lib/escrow";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { EscrowBar } from "@/components/EscrowBar";
import { FeedCard, toFeedItem, type FeedMaterialBatch } from "@/components/FeedCard";
import { ProvenanceTimeline } from "@/components/ProvenanceTimeline";
import { ImpactPassPreview } from "@/components/ImpactPassPreview";
import { BeforeAfter } from "@/components/motion/BeforeAfter";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { Button, Card, Spinner, EmptyState, LinkButton, SectionHeader } from "@/components/ui";
import { apiJson } from "@/lib/api";
import type { ProductView } from "@/lib/server/views";

// The 3D map only loads in the browser, and only on product pages.
const Journey3D = dynamic(() => import("@/components/map/Journey3D").then((m) => m.Journey3D), { ssr: false });

export default function ProductDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { addToCart, items } = useCart();
  const { formatCurrency, formatNumber, translateSync } = useTranslation();

  const [product, setProduct] = useState<ProductView | null>(null);
  const [related, setRelated] = useState<FeedMaterialBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const productId = params?.id as string;

  useEffect(() => {
    async function loadProduct() {
      const [productRes, catalogueRes] = await Promise.all([
        apiJson<ProductView>(`/api/products/${encodeURIComponent(productId)}`),
        apiJson<ProductView[]>("/api/products"),
      ]);
      const found = (productRes.success && productRes.data) || null;
      const catalogue = catalogueRes.data ?? [];

      // Related: same festival first, then anything else; unique titles, max 3
      const festival = found?.sourceBatch?.agreement?.festival;
      const seen = new Set<string>(found ? [found.title] : []);
      const others = catalogue
        .filter((p) => p.id !== found?.id)
        .sort((a, b) => Number(b.sourceBatch?.agreement?.festival === festival) - Number(a.sourceBatch?.agreement?.festival === festival))
        .filter((p) => (seen.has(p.title) ? false : (seen.add(p.title), true)))
        .slice(0, 3)
        .map(toFeedItem);

      setProduct(found);
      setRelated(others);
      setLoading(false);
    }
    if (productId) loadProduct();
  }, [productId]);

  if (loading) {
    return <Spinner label={translateSync("Loading piece…")} className="py-32" />;
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <EmptyState
          title={translateSync("Piece not found")}
          description={translateSync("It may already have been sold.")}
          action={
            <LinkButton href="/" variant="secondary">
              <ArrowLeft className="w-4 h-4" />
              {translateSync("Back to shop")}
            </LinkButton>
          }
        />
      </div>
    );
  }

  const cartProduct = {
    id: product.id,
    title: product.title,
    description: product.description || "",
    price: product.price,
    image: product.images?.[0] ?? "",
    artisanId: product.artisanId,
    artisanName: product.artisan?.fullName,
    artisanWorkshop: product.artisan?.workshopName ?? undefined,
    artisanCountry: product.sourceBatch?.agreement?.country ?? product.artisan?.country ?? undefined,
    kgDiverted: product.kgDiverted,
    ngoFundName: product.ngoFundName,
    sourceBatchId: product.sourceBatchId,
    festivalName: product.sourceBatch?.agreement?.festival ?? undefined,
  };

  const festival: string = product.sourceBatch?.agreement?.festival || "";
  const country: string = product.sourceBatch?.agreement?.country || product.artisan?.country || "";
  const makerName: string = product.artisan?.fullName || "Artisan";
  const workshop: string = product.artisan?.workshopName || "";
  const joinKnown = (...parts: string[]) => parts.filter(Boolean).map((p) => translateSync(p)).join(", ");
  const origin = joinKnown(festival, country) || "—";
  const material = product.sourceBatch?.materialType || (product.materialTags || []).join(", ") || "—";
  const inCart = items.some((i) => i.id === product.id);
  const stock: number = product.stock ?? 0;
  const artisanShare = calculateEscrowSplit(product.price).artisanPayout;

  const openArtisanThread = () => {
    const artisanId: string = product.artisanId;
    window.dispatchEvent(
      new CustomEvent("open-messages", {
        detail: {
          threadId: artisanId,
          name: makerName,
          subtitle: workshop,
          avatarText: makerName.slice(0, 2).toUpperCase(),
          productTitle: product.title,
        },
      })
    );
  };

  const handleAdd = () => {
    addToCart(cartProduct);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const materialImage: string | undefined = product.sourceBatch?.imageUrl || undefined;
  const batchId: string | undefined = product.sourceBatch?.id;

  const specs = [
    { label: translateSync("Origin"), value: origin },
    { label: translateSync("Material"), value: translateSync(material) },
    { label: translateSync("Condition at collection"), value: product.sourceBatch?.condition ? translateSync(product.sourceBatch.condition) : "—" },
    { label: translateSync("Source batch"), value: batchId || "—", mono: true },
  ];

  const impact = [
    { icon: Leaf, value: <CountUp value={Number(product.kgDiverted) || 0} decimals={1} format={formatNumber} />, unit: "kg", label: translateSync("kept out of landfill") },
    { icon: HandCoins, value: <CountUp value={artisanShare} decimals={2} format={formatCurrency} />, label: translateSync("paid straight to the maker") },
    { icon: Layers, value: <CountUp value={4} />, label: translateSync("steps on its public record") },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-14">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-ink-3">
        <ol className="flex items-center gap-1.5 min-w-0">
          <li>
            <Link href="/#shop" className="hover:text-ink transition-colors">
              {translateSync("Shop")}
            </Link>
          </li>
          {festival && (
            <>
              <li aria-hidden>
                <ChevronRight className="w-3.5 h-3.5" />
              </li>
              <li className="hidden sm:block truncate">{translateSync(festival)}</li>
            </>
          )}
          <li aria-hidden>
            <ChevronRight className="w-3.5 h-3.5" />
          </li>
          <li className="text-ink truncate" aria-current="page">
            {translateSync(product.title)}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-6 lg:items-start">
        {/* Media: drag between the collected material and the finished piece */}
        <div className="lg:col-span-7 rise">
          {materialImage ? (
            <BeforeAfter
              className="aspect-[4/3] lg:aspect-[5/6] rounded-lg border border-line bg-paper-2"
              label={translateSync("Compare the collected material with the finished piece")}
              before={{ src: materialImage, label: batchId ? `${translateSync("Collected material")} · ${batchId}` : translateSync("Collected material") }}
              after={{ src: cartProduct.image, label: translateSync("Finished piece") }}
            />
          ) : (
            <div className="relative aspect-[4/3] lg:aspect-[5/6] rounded-lg bg-paper-2 overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cartProduct.image} alt={translateSync(product.title)} className="w-full h-full object-cover" />
            </div>
          )}
          {materialImage && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-3">
              <MoveHorizontal className="w-3.5 h-3.5" />
              {translateSync("Drag to see what it was made from")}
            </p>
          )}
        </div>

        {/* Buy box */}
        <div className="lg:col-span-5 lg:row-span-2 space-y-6">
          <div className="space-y-3 rise" style={{ ["--rise-delay" as string]: "80ms" }}>
            {festival && (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-pine-50 border border-pine-100 px-2.5 py-1 text-xs font-medium text-pine-700">
                <Sparkles className="w-3.5 h-3.5" />
                {translateSync("Recovered from")} {translateSync(festival)}
              </p>
            )}
            <h1 className="font-display text-[38px] sm:text-[46px] leading-[1.02] font-semibold text-ink">{translateSync(product.title)}</h1>
            <div className="flex items-baseline gap-3">
              <p className="tabular font-display text-[34px] font-semibold text-ink">{formatCurrency(product.price)}</p>
              <span className={stock <= 3 ? "text-sm text-lantern-600" : "text-sm text-ink-3"}>
                {stock === 0
                  ? translateSync("Sold out")
                  : stock <= 3
                  ? `${translateSync("Only")} ${stock} ${translateSync("left")}`
                  : `${stock} ${translateSync("in stock")}`}
              </span>
            </div>
          </div>

          <p className="text-[15px] text-ink-2 leading-relaxed rise" style={{ ["--rise-delay" as string]: "140ms" }}>
            {translateSync(product.description || "")}
          </p>

          <div className="space-y-3 rise" style={{ ["--rise-delay" as string]: "200ms" }}>
            <Button size="lg" className="w-full" onClick={() => setCheckoutModalOpen(true)} disabled={stock === 0}>
              <Lock className="w-4 h-4" />
              {translateSync("Buy now")}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleAdd}
              disabled={stock === 0 || inCart}
              className={inCart || justAdded ? "w-full text-pine-700 border-pine-300" : "w-full"}
            >
              {inCart || justAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              {justAdded ? translateSync("Added to cart") : inCart ? translateSync("In your cart") : translateSync("Add to cart")}
            </Button>
            {!user && <p className="text-xs text-ink-3 text-center">{translateSync("You'll sign in with Google at checkout.")}</p>}
          </div>

          {/* What you receive */}
          <div className="space-y-2.5 rise" style={{ ["--rise-delay" as string]: "280ms" }}>
            <p className="text-sm font-medium text-ink">{translateSync("Comes with its Verified Impact Pass")}</p>
            <ImpactPassPreview title={product.title} origin={origin} maker={makerName} material={material} kgDiverted={Number(product.kgDiverted) || 0} />
          </div>

          <ul className="divide-y divide-line border-y border-line text-sm">
            <li className="flex items-start gap-3 py-3">
              <HandCoins className="w-[18px] h-[18px] text-pine-500 shrink-0 mt-0.5" />
              <span>
                <span className="text-ink font-medium">
                  {formatCurrency(artisanShare)} {translateSync("goes to the maker")}
                </span>
                <span className="block text-ink-3">
                  {SPLIT.artisan}% {translateSync("of the price, paid with a fair-trade floor.")}
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3 py-3">
              <Truck className="w-[18px] h-[18px] text-pine-500 shrink-0 mt-0.5" />
              <span>
                <span className="text-ink font-medium">
                  {country ? `${translateSync("Ships from")} ${translateSync(country)}` : translateSync("Ships from the maker")}
                </span>
                <span className="block text-ink-3">{translateSync("The maker is notified the moment you order.")}</span>
              </span>
            </li>
          </ul>

          <dl className="text-sm divide-y divide-line">
            {specs.map((s) => (
              <div key={s.label} className="flex justify-between gap-6 py-2.5">
                <dt className="text-ink-3 shrink-0">{s.label}</dt>
                <dd className={s.mono ? "font-mono-data text-xs text-ink-2 text-right self-center" : "text-ink text-right"}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Maker: under the photo on desktop, after the buy box on phones */}
        <div className="lg:col-span-7">
          <Card className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <span className="w-12 h-12 rounded-full bg-pine-100 text-pine-700 font-semibold flex items-center justify-center shrink-0">
                {makerName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-3">{translateSync("Handmade by")}</p>
                <p className="font-medium text-ink truncate">{translateSync(makerName)}</p>
                <p className="text-sm text-ink-3 truncate">{joinKnown(workshop, country)}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={openArtisanThread}>
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{translateSync("Message the maker")}</span>
              <span className="sm:hidden">{translateSync("Message")}</span>
            </Button>
          </Card>
        </div>
      </div>

      {/* Impact at a glance */}
      <section className="rounded-lg bg-pine-900 text-white overflow-hidden">
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {impact.map((m, i) => {
            const Icon = m.icon;
            return (
              <Reveal key={m.label} delay={i * 120} className="p-6 sm:p-7 flex items-center gap-4">
                <span className="w-11 h-11 rounded-full bg-white/10 text-pine-200 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-display text-[32px] leading-none font-semibold">
                    {m.value}
                    {m.unit && <span className="ml-1 font-sans text-sm font-medium text-white/70">{m.unit}</span>}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{m.label}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Where the material travelled, in Google's photorealistic 3D map */}
      {product.sourceBatch && (
        <section id="journey" className="scroll-mt-24 rounded-lg bg-pine-900 text-white p-5 sm:p-8 space-y-5">
          <div>
            <h2 className="font-display text-[30px] font-semibold">{translateSync("Follow the material")}</h2>
            <p className="text-sm text-white/70 mt-1">
              {product.sourceBatch.pickupAddress
                ? `${translateSync("Collected at")} ${product.sourceBatch.pickupAddress}`
                : translateSync("Collected and pinned on the map by a local government officer.")}
            </p>
          </div>
          <Journey3D
            collection={{ lat: product.sourceBatch.gpsLat, lng: product.sourceBatch.gpsLng, label: translateSync("Collected here") }}
            workshop={
              product.artisan?.workshopLat != null && product.artisan?.workshopLng != null
                ? { lat: product.artisan.workshopLat, lng: product.artisan.workshopLng, label: workshop || makerName }
                : null
            }
          />
        </section>
      )}

      {/* Provenance + split */}
      <div className="grid lg:grid-cols-12 gap-6">
        <Reveal className="lg:col-span-7">
          <Card className="h-full p-6 sm:p-8">
            <h2 className="font-display text-[30px] font-semibold text-ink">{translateSync("From leftover to this piece")}</h2>
            <p className="text-sm text-ink-3 mt-1 mb-7">{translateSync("Each step was recorded when it happened.")}</p>
            <ProvenanceTimeline
              animate
              events={[
                {
                  icon: <FileSignature className="w-4 h-4" />,
                  title: translateSync("Collection agreed"),
                  detail: `${translateSync("Release agreement with")} ${origin}`,
                },
                {
                  icon: <ScanLine className="w-4 h-4" />,
                  title: translateSync("Logged & classified by Gemini"),
                  meta: batchId,
                  detail: [product.sourceBatch?.materialType, product.sourceBatch?.condition]
                    .filter((t): t is string => Boolean(t))
                    .map((t) => translateSync(t))
                    .join(" · "),
                },
                {
                  icon: <Hammer className="w-4 h-4" />,
                  title: translateSync("Crafted"),
                  detail: joinKnown(makerName, workshop),
                },
                {
                  icon: <QrCode className="w-4 h-4" />,
                  title: translateSync("Your pass is issued at purchase"),
                  detail: translateSync("The next entry on this record will be yours."),
                  pending: true,
                },
              ]}
            />
          </Card>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-5">
          <Card className="h-full p-6 sm:p-8">
            <h2 className="font-display text-[30px] font-semibold text-ink">{translateSync("Where your money goes")}</h2>
            <p className="text-sm text-ink-3 mt-1 mb-7">{translateSync("Split automatically at checkout and shown on the public impact record.")}</p>
            <EscrowBar amount={product.price} ngoName={product.ngoFundName} animate />
          </Card>
        </Reveal>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="space-y-6">
          <Reveal>
            <SectionHeader
              title={translateSync("More recovered pieces")}
              actions={
                <Link href="/#shop" className="inline-flex items-center gap-1 text-sm font-medium text-pine-600 hover:text-pine-700">
                  {translateSync("View all")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              }
            />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((b, i) => (
              <Reveal key={b.id} delay={i * 100}>
                <FeedCard batch={b} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <CheckoutModal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} directProduct={cartProduct} />
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  RefreshCw,
  Box,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { useCart } from "@/context/CartContext";
import { SPLIT, calculateEscrowSplit } from "@/lib/escrow";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { ClaimBox } from "@/components/checkout/ClaimBox";
import { EscrowBar } from "@/components/EscrowBar";
import { FeedCard, toFeedItem, type FeedMaterialBatch } from "@/components/FeedCard";
import { ProvenanceTimeline } from "@/components/ProvenanceTimeline";
import { ImpactPassPreview } from "@/components/ImpactPassPreview";
import { BeforeAfter } from "@/components/motion/BeforeAfter";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { Button, Card, Spinner, EmptyState, LinkButton, SectionHeader, useMediaQuery } from "@/components/ui";
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
  // Set when the request failed for a reason other than "not listed", so it can be retried.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Phones get a buy bar once the main Buy button scrolls away, and load the 3D map only on request.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [show3D, setShow3D] = useState(false);
  const [buyVisible, setBuyVisible] = useState(true);
  const buyObserver = useRef<IntersectionObserver | null>(null);
  const buyRef = useCallback((el: HTMLDivElement | null) => {
    buyObserver.current?.disconnect();
    if (!el) return;
    buyObserver.current = new IntersectionObserver(([entry]) => setBuyVisible(entry.isIntersecting));
    buyObserver.current.observe(el);
  }, []);

  const productId = params?.id as string;

  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setLoadError(null);
      const [productRes, catalogueRes] = await Promise.all([
        apiJson<ProductView>(`/api/products/${encodeURIComponent(productId)}`),
        apiJson<ProductView[]>("/api/products"),
      ]);
      const found = (productRes.success && productRes.data) || null;
      if (!found && productRes.status !== 404) setLoadError(productRes.error ?? "Couldn't load this piece.");
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
  }, [productId, attempt]);

  // After a purchase the stock has changed; refresh it without the full-page spinner.
  const refreshProduct = async () => {
    const result = await apiJson<ProductView>(`/api/products/${encodeURIComponent(productId)}`);
    if (result.success && result.data) setProduct(result.data);
    else if (result.status === 404) setProduct(null);
  };

  if (loading) {
    return <Spinner label={translateSync("Loading piece…")} className="py-32" />;
  }

  if (!product && loadError) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <EmptyState
          title={translateSync("We couldn't load this piece")}
          description={translateSync(loadError)}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setAttempt((n) => n + 1)}>
                <RefreshCw className="w-4 h-4" />
                {translateSync("Try again")}
              </Button>
              <LinkButton href="/" variant="secondary">
                {translateSync("Back to shop")}
              </LinkButton>
            </div>
          }
        />
      </div>
    );
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
  // An artisan looking at their own listing can't buy it or message themselves.
  const isOwn = Boolean(user && user.id === product.artisanId);
  const stock: number = product.stock ?? 0;
  // Given away at the showcase booth instead of sold: no cart, no checkout, no split.
  const freeClaim = Boolean(product.freeClaim);
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
    ...(freeClaim
      ? []
      : [{ icon: HandCoins, value: <CountUp value={artisanShare} decimals={2} format={formatCurrency} />, label: translateSync("paid straight to the maker") }]),
    ...(product.sourceBatch
      ? [{ icon: Layers, value: <CountUp value={product.sourceBatch.weightKg} decimals={1} format={formatNumber} />, unit: "kg", label: translateSync("collected in its source batch") }]
      : []),
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
              <li aria-hidden className="hidden sm:block">
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
              className="arch aspect-[4/3] lg:aspect-[5/6] border border-line bg-paper-2"
              label={translateSync("Compare the collected material with the finished piece")}
              before={{ src: materialImage, label: batchId ? `${translateSync("Collected material")} · ${batchId}` : translateSync("Collected material") }}
              after={{ src: cartProduct.image, label: translateSync("Finished piece") }}
            />
          ) : (
            <div className="arch relative aspect-[4/3] lg:aspect-[5/6] bg-paper-2 overflow-hidden border border-line">
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
              <p className="inline-flex items-center gap-1.5 rounded-full bg-pine-50 border border-brand-line px-2.5 py-1 text-xs font-medium text-brand">
                <Sparkles className="w-3.5 h-3.5" />
                {translateSync("Recovered from")} {translateSync(festival)}
              </p>
            )}
            <h1 className="font-display text-[38px] sm:text-[46px] leading-[1.02] font-semibold text-ink">{translateSync(product.title)}</h1>
            <div className="flex items-baseline gap-3">
              <p className="tabular font-display text-[34px] font-semibold text-ink">{freeClaim ? translateSync("Free") : formatCurrency(product.price)}</p>
              <span className={stock <= 3 ? "text-sm text-lantern-600" : "text-sm text-ink-3"}>
                {stock === 0
                  ? translateSync(freeClaim ? "All claimed" : "Sold out")
                  : stock <= 3
                  ? `${translateSync("Only")} ${stock} ${translateSync("left")}`
                  : `${stock} ${translateSync(freeClaim ? "left to claim" : "in stock")}`}
              </span>
            </div>
          </div>

          <p className="text-[15px] text-ink-2 leading-relaxed rise" style={{ ["--rise-delay" as string]: "140ms" }}>
            {translateSync(product.description || "")}
          </p>

          {isOwn ? (
            <div className="rounded-md border border-line bg-paper p-4 text-sm text-ink-2 flex flex-wrap items-center justify-between gap-3">
              {translateSync("This is your listing.")}
              <LinkButton href="/studio" variant="secondary" size="sm">
                {translateSync("Edit in the studio")}
              </LinkButton>
            </div>
          ) : freeClaim ? (
            <ClaimBox productId={product.id} stock={stock} onClaimed={refreshProduct} />
          ) : (
          <div ref={buyRef} className="space-y-3 rise" style={{ ["--rise-delay" as string]: "200ms" }}>
            <Button variant="accent" size="lg" className="w-full" onClick={() => setCheckoutModalOpen(true)} disabled={stock === 0}>
              <Lock className="w-4 h-4" />
              {translateSync("Buy now")}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleAdd}
              disabled={stock === 0 || inCart}
              className={inCart || justAdded ? "w-full text-brand border-pine-300" : "w-full"}
            >
              {inCart || justAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              {justAdded ? translateSync("Added to cart") : inCart ? translateSync("In your cart") : translateSync("Add to cart")}
            </Button>
            {!user && <p className="text-sm text-ink-3 text-center">{translateSync("You'll sign in at checkout.")}</p>}
          </div>
          )}

          {/* What you receive */}
          <div className="space-y-2.5 rise" style={{ ["--rise-delay" as string]: "280ms" }}>
            <p className="text-sm font-medium text-ink">{translateSync("Comes with its Verified Impact Pass")}</p>
            <ImpactPassPreview title={product.title} origin={origin} maker={makerName} material={material} kgDiverted={Number(product.kgDiverted) || 0} image={product.images?.[0]} />
          </div>

          <ul className="divide-y divide-line border-y border-line text-sm">
            {!freeClaim && (
            <li className="flex items-start gap-3 py-3">
              <HandCoins className="w-[18px] h-[18px] text-impact shrink-0 mt-0.5" />
              <span>
                <span className="text-ink font-medium">
                  {formatCurrency(artisanShare)} {translateSync("goes to the maker")}
                </span>
                <span className="block text-ink-3">
                  {SPLIT.artisan}% {translateSync("of the price, paid with a fair-trade floor.")}
                </span>
              </span>
            </li>
            )}
            <li className="flex items-start gap-3 py-3">
              <Truck className="w-[18px] h-[18px] text-brand-2 shrink-0 mt-0.5" />
              <span>
                <span className="text-ink font-medium">
                  {freeClaim
                    ? translateSync("Collect it at the HeriTech booth")
                    : country
                    ? `${translateSync("Ships from")} ${translateSync(country)}`
                    : translateSync("Ships from the maker")}
                </span>
                <span className="block text-ink-3">
                  {translateSync(freeClaim ? "Show your Impact Pass to the booth staff." : "The maker is notified the moment you order.")}
                </span>
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
              <span className="w-12 h-12 rounded-full bg-pine-100 text-brand font-semibold flex items-center justify-center shrink-0">
                {makerName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-3">{translateSync("Handmade by")}</p>
                <p className="font-medium text-ink truncate">{translateSync(makerName)}</p>
                <p className="text-sm text-ink-3 truncate">{joinKnown(workshop, country)}</p>
              </div>
            </div>
            {!isOwn && (
            <Button variant="secondary" size="sm" onClick={openArtisanThread}>
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{translateSync("Message the maker")}</span>
              <span className="sm:hidden">{translateSync("Message")}</span>
            </Button>
            )}
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
          {isDesktop || show3D ? (
            <Journey3D
              collection={{ lat: product.sourceBatch.gpsLat, lng: product.sourceBatch.gpsLng, label: translateSync("Collected here") }}
              workshop={
                product.artisan?.workshopLat != null && product.artisan?.workshopLng != null
                  ? { lat: product.artisan.workshopLat, lng: product.artisan.workshopLng, label: workshop || makerName }
                  : null
              }
            />
          ) : (
            // The photorealistic 3D map is heavy on phone data and battery, so it waits for a tap.
            <button
              type="button"
              onClick={() => setShow3D(true)}
              className="w-full h-[220px] rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors"
            >
              <span className="w-12 h-12 rounded-full bg-white/10 text-pine-200 flex items-center justify-center">
                <Box className="w-6 h-6" strokeWidth={1.75} />
              </span>
              <span className="text-[15px] font-medium">{translateSync("Show the 3D journey")}</span>
              <span className="text-sm text-white/70">{translateSync("Google Maps 3D · from collection point to workshop")}</span>
            </button>
          )}
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
                  title: translateSync(freeClaim ? "Your pass is issued when you claim" : "Your pass is issued at purchase"),
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
            {freeClaim ? (
              <p className="text-sm text-ink-2 mt-3">
                {translateSync("This piece is given away free at the HeriTech showcase booth, so no money changes hands. Pieces bought in the shop are split automatically at checkout.")}
              </p>
            ) : (
              <>
                <p className="text-sm text-ink-3 mt-1 mb-7">{translateSync("Split automatically at checkout and shown on the public impact record.")}</p>
                <EscrowBar amount={product.price} ngoName={product.ngoFundName} animate />
              </>
            )}
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
                <Link href="/#shop" className="inline-flex items-center gap-1 text-sm font-medium text-brand-2 hover:text-brand">
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

      {/* Room for the phone buy bar, so it never covers the end of the page */}
      {!isDesktop && !isOwn && !freeClaim && stock > 0 && <div aria-hidden className="h-20" />}

      {/* Phone buy bar, above the tab bar, once the main Buy button has scrolled away */}
      {!isDesktop && !buyVisible && !isOwn && !freeClaim && stock > 0 && !checkoutModalOpen && (
        <div className="fixed inset-x-0 z-30 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] bg-surface/95 backdrop-blur-md border-t border-line px-4 py-3 animate-[sheet-in_0.2s_ease-out]">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-3 truncate">{translateSync(product.title)}</p>
              <p className="tabular font-display text-2xl font-semibold text-ink leading-tight">{formatCurrency(product.price)}</p>
            </div>
            <Button variant="accent" onClick={() => setCheckoutModalOpen(true)} className="shrink-0">
              <Lock className="w-4 h-4" />
              {translateSync("Buy now")}
            </Button>
          </div>
        </div>
      )}

      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => {
          setCheckoutModalOpen(false);
          refreshProduct();
        }}
        directProduct={cartProduct}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
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
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { useCart } from "@/context/CartContext";
import { calculateEscrowSplit } from "@/lib/escrow";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { EscrowBar } from "@/components/EscrowBar";
import { FeedCard, type FeedMaterialBatch } from "@/components/FeedCard";
import { ProvenanceTimeline } from "@/components/ProvenanceTimeline";
import { Button, Card, Spinner, EmptyState, LinkButton, SectionHeader } from "@/components/ui";
import { apiJson } from "@/lib/api";

/** Maps an API product to the shop card shape. */
function toFeedBatch(p: any): FeedMaterialBatch {
  const tags = Array.isArray(p.materialTags) && p.materialTags.length > 0 ? p.materialTags.join(", ") : p.sourceBatch?.materialType || "Upcycled piece";
  const country = p.sourceBatch?.agreement?.country || p.artisan?.country || "Asia";
  return {
    id: p.id,
    title: p.title,
    description: p.description || "",
    price: Number(p.price) || 0,
    image: Array.isArray(p.images) ? p.images[0] : p.images,
    cooperativeName: p.artisan?.workshopName || p.artisan?.fullName || "Artisan workshop",
    region: country,
    country,
    weightKg: Number(p.kgDiverted) || 1.5,
    materialType: tags,
    festival: p.sourceBatch?.agreement?.festival || "Pan-Asian Origin",
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { addToCart, items } = useCart();
  const { formatCurrency, formatNumber, translateSync } = useTranslation();

  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<FeedMaterialBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const productId = params?.id as string;

  useEffect(() => {
    async function loadProduct() {
      const [productRes, catalogueRes] = await Promise.all([
        apiJson<any>(`/api/products/${encodeURIComponent(productId)}`),
        apiJson<any[]>("/api/products"),
      ]);
      const found = productRes.success ? productRes.data : null;
      const catalogue = catalogueRes.data ?? [];

      // Related: same festival first, then anything else; unique titles, max 3
      const festival = found?.sourceBatch?.agreement?.festival;
      const seen = new Set<string>([found?.title]);
      const others = catalogue
        .filter((p: any) => p.id !== found?.id)
        .sort((a: any, b: any) => Number(b.sourceBatch?.agreement?.festival === festival) - Number(a.sourceBatch?.agreement?.festival === festival))
        .filter((p: any) => (seen.has(p.title) ? false : (seen.add(p.title), true)))
        .slice(0, 3)
        .map(toFeedBatch);

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

  const festival = product.sourceBatch?.agreement?.festival || "Pan-Asian Festival";
  const country = product.sourceBatch?.agreement?.country || product.artisan?.country || "Asia";
  const makerName = product.artisan?.fullName || "Master Artisan";
  const workshop = product.artisan?.workshopName || "Heritage Cooperative";
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

  const specs = [
    { label: translateSync("Origin"), value: `${translateSync(festival)}, ${translateSync(country)}` },
    { label: translateSync("Material"), value: translateSync(material) },
    { label: translateSync("Condition at collection"), value: product.sourceBatch?.condition ? translateSync(product.sourceBatch.condition) : "—" },
    { label: translateSync("Waste diverted"), value: `${formatNumber(product.kgDiverted)} kg` },
    { label: translateSync("Source batch"), value: product.sourceBatch?.id || "—", mono: true },
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
          <li aria-hidden>
            <ChevronRight className="w-3.5 h-3.5" />
          </li>
          <li className="hidden sm:block truncate">{translateSync(festival)}</li>
          <li aria-hidden className="hidden sm:block">
            <ChevronRight className="w-3.5 h-3.5" />
          </li>
          <li className="text-ink truncate" aria-current="page">
            {translateSync(product.title)}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-6 lg:items-start">
        {/* Media */}
        <div className="lg:col-span-7">
          <div className="relative aspect-[4/3] lg:aspect-[5/6] rounded-lg bg-paper-2 overflow-hidden border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cartProduct.image} alt={translateSync(product.title)} className="w-full h-full object-cover" />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-sm bg-surface/95 px-2.5 py-1 text-xs font-medium text-ink shadow-card">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              {translateSync("Traceable origin")}
            </span>
          </div>

        </div>

        {/* Buy box */}
        <div className="lg:col-span-5 lg:row-span-2 space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-pine-500 font-medium">{translateSync(festival)}</p>
            <h1 className="font-display text-[36px] sm:text-[42px] leading-[1.05] font-semibold text-ink">{translateSync(product.title)}</h1>
            <div className="flex items-baseline gap-3">
              <p className="tabular font-display text-[32px] font-semibold text-ink">{formatCurrency(product.price)}</p>
              <span className={stock <= 3 ? "text-sm text-lantern-600" : "text-sm text-ink-3"}>
                {stock === 0
                  ? translateSync("Sold out")
                  : stock <= 3
                  ? `${translateSync("Only")} ${stock} ${translateSync("left")}`
                  : `${stock} ${translateSync("in stock")}`}
              </span>
            </div>
          </div>

          <p className="text-[15px] text-ink-2 leading-relaxed">{translateSync(product.description || "")}</p>

          <div className="space-y-3">
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

          {/* Trust row */}
          <ul className="divide-y divide-line border-y border-line text-sm">
            <li className="flex items-start gap-3 py-3">
              <QrCode className="w-[18px] h-[18px] text-pine-500 shrink-0 mt-0.5" />
              <span>
                <span className="text-ink font-medium">{translateSync("Verified Impact Pass included")}</span>
                <span className="block text-ink-3">{translateSync("Saved to Google Wallet, with a QR code anyone can check.")}</span>
              </span>
            </li>
            <li className="flex items-start gap-3 py-3">
              <HandCoins className="w-[18px] h-[18px] text-pine-500 shrink-0 mt-0.5" />
              <span>
                <span className="text-ink font-medium">
                  {formatCurrency(artisanShare)} {translateSync("goes to the maker")}
                </span>
                <span className="block text-ink-3">{translateSync("70% of the price, paid with a fair-trade floor.")}</span>
              </span>
            </li>
            <li className="flex items-start gap-3 py-3">
              <Truck className="w-[18px] h-[18px] text-pine-500 shrink-0 mt-0.5" />
              <span>
                <span className="text-ink font-medium">
                  {translateSync("Ships from")} {translateSync(country)}
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
                <p className="text-sm text-ink-3 truncate">
                  {translateSync(workshop)} · {translateSync(country)}
                </p>
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

      {/* Provenance + split */}
      <div className="grid lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 p-6 sm:p-8">
          <h2 className="font-display text-[28px] font-semibold text-ink">{translateSync("Where it came from")}</h2>
          <p className="text-sm text-ink-3 mt-1 mb-7">{translateSync("The journey recorded for this piece's source batch.")}</p>
          <ProvenanceTimeline
            events={[
              {
                icon: <FileSignature className="w-4 h-4" />,
                title: translateSync("Collection agreed"),
                detail: `${translateSync("Release agreement with")} ${translateSync(festival)}, ${translateSync(country)}`,
              },
              {
                icon: <ScanLine className="w-4 h-4" />,
                title: translateSync("Logged & classified by Gemini"),
                meta: product.sourceBatch?.id,
                detail: [product.sourceBatch?.materialType, product.sourceBatch?.condition]
                  .filter(Boolean)
                  .map((t: string) => translateSync(t))
                  .join(" · "),
              },
              {
                icon: <Hammer className="w-4 h-4" />,
                title: translateSync("Crafted"),
                detail: `${translateSync(makerName)}, ${translateSync(workshop)}`,
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

        <Card className="lg:col-span-5 p-6 sm:p-8">
          <h2 className="font-display text-[28px] font-semibold text-ink">{translateSync("Where your money goes")}</h2>
          <p className="text-sm text-ink-3 mt-1 mb-7">{translateSync("Split automatically at checkout and published to the impact ledger.")}</p>
          <EscrowBar amount={product.price} ngoName={product.ngoFundName} />
        </Card>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="space-y-6">
          <SectionHeader
            title={translateSync("More recovered pieces")}
            actions={
              <Link href="/#shop" className="inline-flex items-center gap-1 text-sm font-medium text-pine-600 hover:text-pine-700">
                {translateSync("View all")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((b) => (
              <FeedCard key={b.id} batch={b} />
            ))}
          </div>
        </section>
      )}

      <CheckoutModal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} directProduct={cartProduct} />
    </div>
  );
}

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

const FALLBACK_PRODUCTS: Record<string, any> = {
  batch_01: {
    id: "batch_01",
    title: "Panagbenga Botanical Loom Wall Tapestry",
    description:
      "Salvaged highland bolo bamboo and sun-dried strawflowers from Baguio City float sculptures. Hand-woven into archival wall decor with natural beeswax finish.",
    price: 68.0,
    images: ["https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800"],
    materialTags: ["Bamboo", "Botanical Flora", "Highland Loom"],
    stock: 4,
    kgDiverted: 2.4,
    ngoFundName: "Cordillera Ancestral Watershed Trust",
    artisan: {
      fullName: "Danilo Cruz",
      workshopName: "Cordillera Botanical Cooperative",
      country: "Philippines",
    },
    sourceBatch: {
      id: "HT-BATCH-0101",
      materialType: "Highland Bolo Bamboo & Strawflower",
      condition: "Pristine & Dry",
      agreement: {
        festival: "Panagbenga Festival",
        country: "Philippines",
      },
    },
  },
  prod_demo_01: {
    id: "prod_demo_01",
    title: "Panagbenga Botanical Loom Wall Tapestry",
    description:
      "Salvaged highland bolo bamboo and sun-dried strawflowers from Baguio City float sculptures. Hand-woven into archival wall decor with natural beeswax finish.",
    price: 68.0,
    images: ["https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800"],
    materialTags: ["Bamboo", "Botanical Flora", "Highland Loom"],
    stock: 4,
    kgDiverted: 2.4,
    ngoFundName: "Cordillera Ancestral Watershed Trust",
    artisan: {
      fullName: "Danilo Cruz",
      workshopName: "Cordillera Botanical Cooperative",
      country: "Philippines",
    },
    sourceBatch: {
      id: "HT-BATCH-0101",
      materialType: "Highland Bolo Bamboo & Strawflower",
      condition: "Pristine & Dry",
      agreement: {
        festival: "Panagbenga Festival",
        country: "Philippines",
      },
    },
  },
  batch_02: {
    id: "batch_02",
    title: "Yi Peng Luminary Ambient Table Lamp",
    description:
      "Constructed with split bamboo frames and mulberry rice paper recovered post-celebration along the Ping River in Chiang Mai. Emits warm ambient light.",
    price: 85.0,
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"],
    materialTags: ["Bamboo", "Rice Paper", "Mulberry Fiber"],
    stock: 3,
    kgDiverted: 1.8,
    ngoFundName: "Ping River Aquatic Ecology Trust",
    artisan: {
      fullName: "Somchai Prasert",
      workshopName: "Lanna Heritage Joinery",
      country: "Thailand",
    },
    sourceBatch: {
      id: "HT-BATCH-0102",
      materialType: "Split Bamboo & Mulberry Paper",
      condition: "Intact & Wire-Free",
      agreement: {
        festival: "Yi Peng Lantern Festival",
        country: "Thailand",
      },
    },
  },
  prod_demo_02: {
    id: "prod_demo_02",
    title: "Yi Peng Luminary Ambient Table Lamp",
    description:
      "Constructed with split bamboo frames and mulberry rice paper recovered post-celebration along the Ping River in Chiang Mai. Emits warm ambient light.",
    price: 85.0,
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"],
    materialTags: ["Bamboo", "Rice Paper", "Mulberry Fiber"],
    stock: 3,
    kgDiverted: 1.8,
    ngoFundName: "Ping River Aquatic Ecology Trust",
    artisan: {
      fullName: "Somchai Prasert",
      workshopName: "Lanna Heritage Joinery",
      country: "Thailand",
    },
    sourceBatch: {
      id: "HT-BATCH-0102",
      materialType: "Split Bamboo & Mulberry Paper",
      condition: "Intact & Wire-Free",
      agreement: {
        festival: "Yi Peng Lantern Festival",
        country: "Thailand",
      },
    },
  },
  batch_03: {
    id: "batch_03",
    title: "Temple Nirmalaya Artisanal Watercolor Pigment Set",
    description:
      "Extracted from ceremonial marigolds and rose garland biomass. Solar-dried and milled into archival watercolor half-pans with gum arabic binder.",
    price: 45.0,
    images: ["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800"],
    materialTags: ["Botanical Flora", "Natural Pigment", "Organic Marigold"],
    stock: 8,
    kgDiverted: 3.5,
    ngoFundName: "Ganges River Clean Water Foundation",
    artisan: {
      fullName: "Aarav Sharma",
      workshopName: "Nirmalaya Bio-Craft Collective",
      country: "India",
    },
    sourceBatch: {
      id: "HT-BATCH-0103",
      materialType: "Temple Nirmalaya Floral Biomass",
      condition: "Organic Rich Pigment",
      agreement: {
        festival: "Ganesh Chaturthi",
        country: "India",
      },
    },
  },
  prod_demo_03: {
    id: "prod_demo_03",
    title: "Temple Nirmalaya Artisanal Watercolor Pigment Set",
    description:
      "Extracted from ceremonial marigolds and rose garland biomass. Solar-dried and milled into archival watercolor half-pans with gum arabic binder.",
    price: 45.0,
    images: ["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800"],
    materialTags: ["Botanical Flora", "Natural Pigment", "Organic Marigold"],
    stock: 8,
    kgDiverted: 3.5,
    ngoFundName: "Ganges River Clean Water Foundation",
    artisan: {
      fullName: "Aarav Sharma",
      workshopName: "Nirmalaya Bio-Craft Collective",
      country: "India",
    },
    sourceBatch: {
      id: "HT-BATCH-0103",
      materialType: "Temple Nirmalaya Floral Biomass",
      condition: "Organic Rich Pigment",
      agreement: {
        festival: "Ganesh Chaturthi",
        country: "India",
      },
    },
  },
  batch_04: {
    id: "batch_04",
    title: "Pingxi Repulped Botanical Accordion Journal",
    description:
      "Recycled long-fiber lantern sheets reconstituted with indigenous fern inclusions and unbleached cotton cord.",
    price: 38.0,
    images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800"],
    materialTags: ["Rice Paper", "Mulberry Paper", "Recycled Fiber"],
    stock: 6,
    kgDiverted: 1.2,
    ngoFundName: "Taiwan Mountain Forest Trust",
    artisan: {
      fullName: "Lin Wei-Ting",
      workshopName: "Pingxi Sustainable Papermaking",
      country: "Taiwan",
    },
    sourceBatch: {
      id: "HT-BATCH-0104",
      materialType: "Mulberry Lantern Paper",
      condition: "Clean & Sun-Dried",
      agreement: {
        festival: "Pingxi Lantern Festival",
        country: "Taiwan",
      },
    },
  },
  prod_demo_04: {
    id: "prod_demo_04",
    title: "Pingxi Repulped Botanical Accordion Journal",
    description:
      "Recycled long-fiber lantern sheets reconstituted with indigenous fern inclusions and unbleached cotton cord.",
    price: 38.0,
    images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800"],
    materialTags: ["Rice Paper", "Mulberry Paper", "Recycled Fiber"],
    stock: 6,
    kgDiverted: 1.2,
    ngoFundName: "Taiwan Mountain Forest Trust",
    artisan: {
      fullName: "Lin Wei-Ting",
      workshopName: "Pingxi Sustainable Papermaking",
      country: "Taiwan",
    },
    sourceBatch: {
      id: "HT-BATCH-0104",
      materialType: "Mulberry Lantern Paper",
      condition: "Clean & Sun-Dried",
      agreement: {
        festival: "Pingxi Lantern Festival",
        country: "Taiwan",
      },
    },
  },
  batch_05: {
    id: "batch_05",
    title: "Sinulog Festival Upcycled Abaca Bunting Tote",
    description:
      "Heavy-duty abaca fiber strips and ceremonial banner textiles repurposed into reinforced market bags.",
    price: 52.0,
    images: ["https://images.unsplash.com/photo-1544816155-12df9643f363?w=800"],
    materialTags: ["Abaca", "Banner Textile", "Woven"],
    stock: 5,
    kgDiverted: 2.1,
    ngoFundName: "Visayas Coastal Ecology Trust",
    artisan: {
      fullName: "Maria Santos",
      workshopName: "Cebu Ancestral Weavers Cooperative",
      country: "Philippines",
    },
    sourceBatch: {
      id: "HT-BATCH-0105",
      materialType: "Abaca Fiber & Banner Textile",
      condition: "Pristine",
      agreement: {
        festival: "Sinulog Festival",
        country: "Philippines",
      },
    },
  },
  batch_06: {
    id: "batch_06",
    title: "Loi Krathong Biodegradable Banana Leaf Wall Plate",
    description:
      "Compressed organic banana trunk fibers and natural gum arabic binder forming resilient wall art tiles.",
    price: 42.0,
    images: ["https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800"],
    materialTags: ["Banana Fiber", "Botanical Art", "Eco Tile"],
    stock: 7,
    kgDiverted: 1.6,
    ngoFundName: "Sukhothai Cultural Heritage Fund",
    artisan: {
      fullName: "Kamonwan Boonmee",
      workshopName: "Lanna Eco-Craft Community",
      country: "Thailand",
    },
    sourceBatch: {
      id: "HT-BATCH-0106",
      materialType: "Organic Banana Fiber",
      condition: "Dry & Sun-Bleached",
      agreement: {
        festival: "Loi Krathong",
        country: "Thailand",
      },
    },
  },
};

/** Maps an API or fallback product to the shop card shape. */
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
      let catalogue: any[] = [];
      let found: any = null;
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          catalogue = data.data;
          found = data.data.find((p: any) => p.id === productId);
        }
      } catch (err) {
        console.warn("Using fallback product for id:", productId, err);
      }

      // Fallback to dictionary
      if (!found) {
        found = FALLBACK_PRODUCTS[productId] || FALLBACK_PRODUCTS["batch_01"];
      }
      if (catalogue.length < 4) {
        catalogue = [...catalogue, ...Object.values(FALLBACK_PRODUCTS).filter((p: any) => !p.id.startsWith("prod_demo"))];
      }

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
    image: product.images?.[0] || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    artisanId: product.artisanId || "usr_art_05",
    artisanName: product.artisan?.fullName || "Danilo Cruz",
    artisanWorkshop: product.artisan?.workshopName || "Cordillera Botanical Cooperative",
    artisanCountry: product.sourceBatch?.agreement?.country || "Philippines",
    kgDiverted: product.kgDiverted || 2.0,
    ngoFundName: product.ngoFundName || "Regional Watershed Trust",
    sourceBatchId: product.sourceBatchId || "HT-BATCH-0101",
    festivalName: product.sourceBatch?.agreement?.festival || "Pan-Asian Harvest",
  };

  const festival = product.sourceBatch?.agreement?.festival || "Pan-Asian Festival";
  const country = product.sourceBatch?.agreement?.country || product.artisan?.country || "Asia";
  const makerName = product.artisan?.fullName || "Master Artisan";
  const workshop = product.artisan?.workshopName || "Heritage Cooperative";
  const material = product.sourceBatch?.materialType || (product.materialTags || []).join(", ") || "—";
  const inCart = items.some((i) => i.id === product.id);
  const stock = product.stock ?? 1;
  const artisanShare = calculateEscrowSplit(product.price).artisanPayout;

  const openArtisanThread = () => {
    const artisanId = product.artisanId || `artisan_${makerName.toLowerCase().replace(/\s+/g, "_")}`;
    window.dispatchEvent(
      new CustomEvent("open-messages", {
        detail: {
          threadId: artisanId,
          name: makerName,
          subtitle: workshop,
          avatarText: makerName.slice(0, 2).toUpperCase(),
          productTitle: product.title,
          initialGreeting: `Hello! I am ${makerName} from ${workshop}. How can I assist you with "${product.title}"?`,
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
    { label: translateSync("Waste diverted"), value: `${formatNumber(product.kgDiverted || 2.0)} kg` },
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
                {stock <= 3 ? `${translateSync("Only")} ${stock} ${translateSync("left")}` : `${stock} ${translateSync("in stock")}`}
              </span>
            </div>
          </div>

          <p className="text-[15px] text-ink-2 leading-relaxed">{translateSync(product.description || "")}</p>

          <div className="space-y-3">
            <Button size="lg" className="w-full" onClick={() => setCheckoutModalOpen(true)}>
              <Lock className="w-4 h-4" />
              {translateSync("Buy now")}
            </Button>
            <Button size="lg" variant="secondary" onClick={handleAdd} className={inCart || justAdded ? "w-full text-pine-700 border-pine-300" : "w-full"}>
              {inCart || justAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              {justAdded ? translateSync("Added to cart") : inCart ? translateSync("In cart · add another") : translateSync("Add to cart")}
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

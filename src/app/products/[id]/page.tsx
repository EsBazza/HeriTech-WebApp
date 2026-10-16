"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, ShoppingBag, MessageSquare, FileSignature, ScanLine, Hammer, QrCode, Check, Leaf } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useCart } from "@/context/CartContext";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { EscrowBar } from "@/components/EscrowBar";
import { ProvenanceTimeline } from "@/components/ProvenanceTimeline";
import { Badge, Button, Card, Spinner, EmptyState, LinkButton } from "@/components/ui";

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

export default function ProductDetailPage() {
  const params = useParams();
  const { addToCart, items } = useCart();
  const { formatCurrency, formatNumber, translateSync } = useTranslation();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const productId = params?.id as string;

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        let found: any = null;

        if (data.success && Array.isArray(data.data)) {
          found = data.data.find((p: any) => p.id === productId);
        }

        // Fallback to dictionary
        if (!found) {
          found = FALLBACK_PRODUCTS[productId] || FALLBACK_PRODUCTS["batch_01"];
        }

        setProduct(found);
      } catch (err) {
        console.warn("Using fallback product for id:", productId, err);
        setProduct(FALLBACK_PRODUCTS[productId] || FALLBACK_PRODUCTS["batch_01"]);
      } finally {
        setLoading(false);
      }
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
  const inCart = items.some((i) => i.id === product.id);

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <Link href="/#shop" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {translateSync("Back to shop")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="aspect-square rounded-lg bg-paper-2 overflow-hidden border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cartProduct.image} alt={translateSync(product.title)} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Buy box */}
        <div className="space-y-7">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="pine">
                <ShieldCheck className="w-3.5 h-3.5" />
                {translateSync("Traceable origin")}
              </Badge>
              <Badge>
                {translateSync(festival)} · {translateSync(country)}
              </Badge>
            </div>
            <h1 className="font-display text-[36px] sm:text-[44px] leading-[1.05] font-semibold text-ink">{translateSync(product.title)}</h1>
            <p className="tabular font-display text-3xl font-semibold text-ink">{formatCurrency(product.price)}</p>
          </div>

          <p className="text-base text-ink-2 leading-relaxed">{translateSync(product.description || "")}</p>

          <dl className="grid grid-cols-3 gap-px bg-line border border-line rounded-md overflow-hidden text-sm">
            <div className="bg-surface p-3.5">
              <dt className="text-xs text-ink-3">{translateSync("Diverted")}</dt>
              <dd className="tabular mt-0.5 font-medium text-ink flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-pine-500" />
                {formatNumber(product.kgDiverted || 2.0)} kg
              </dd>
            </div>
            <div className="bg-surface p-3.5">
              <dt className="text-xs text-ink-3">{translateSync("Material")}</dt>
              <dd className="mt-0.5 font-medium text-ink line-clamp-2">
                {translateSync(product.sourceBatch?.materialType || (product.materialTags || []).join(", ") || "—")}
              </dd>
            </div>
            <div className="bg-surface p-3.5">
              <dt className="text-xs text-ink-3">{translateSync("In stock")}</dt>
              <dd className="tabular mt-0.5 font-medium text-ink">{product.stock ?? 1}</dd>
            </div>
          </dl>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button size="lg" onClick={() => setCheckoutModalOpen(true)}>
              <Lock className="w-4 h-4" />
              {translateSync("Buy now")}
            </Button>
            <Button size="lg" variant="secondary" onClick={handleAdd} className={inCart || justAdded ? "text-pine-700 border-pine-300" : ""}>
              {inCart || justAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              {justAdded ? translateSync("Added to cart") : inCart ? translateSync("In cart · add another") : translateSync("Add to cart")}
            </Button>
          </div>

          <div className="flex items-start gap-3 rounded-md bg-pine-50 border border-pine-100 p-4">
            <QrCode className="w-5 h-5 text-pine-700 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-ink">{translateSync("Includes a Verified Impact Pass")}</p>
              <p className="text-ink-2 mt-0.5">{translateSync("Saved to Google Wallet. Its QR code opens the public record of this piece.")}</p>
            </div>
          </div>

          {/* Maker */}
          <Card className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-11 h-11 rounded-full bg-paper-2 text-ink-2 font-semibold text-sm flex items-center justify-center shrink-0">
                {makerName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-3">{translateSync("Made by")}</p>
                <p className="font-medium text-ink truncate">{translateSync(makerName)}</p>
                <p className="text-sm text-ink-3 truncate">{translateSync(workshop)}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={openArtisanThread}>
              <MessageSquare className="w-4 h-4" />
              {translateSync("Message")}
            </Button>
          </Card>
        </div>
      </div>

      {/* Provenance + split */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 sm:p-7">
          <h2 className="font-display text-[28px] font-semibold text-ink mb-1">{translateSync("Where it came from")}</h2>
          <p className="text-sm text-ink-3 mb-6">{translateSync("The journey recorded for this piece's source batch.")}</p>
          <ProvenanceTimeline
            events={[
              {
                icon: <FileSignature className="w-4 h-4" />,
                title: translateSync("Collection agreed"),
                detail: `${translateSync(festival)}, ${translateSync(country)}`,
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
                pending: true,
              },
            ]}
          />
        </Card>

        <Card className="p-5 sm:p-7">
          <h2 className="font-display text-[28px] font-semibold text-ink mb-1">{translateSync("Where your money goes")}</h2>
          <p className="text-sm text-ink-3 mb-6">{translateSync("Split automatically at checkout and published to the impact ledger.")}</p>
          <EscrowBar amount={product.price} ngoName={product.ngoFundName} />
        </Card>
      </div>

      <CheckoutModal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} directProduct={cartProduct} />
    </div>
  );
}

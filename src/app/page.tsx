"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, Check, Handshake, Hammer, QrCode, Search, X, ShieldCheck, PackageOpen } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { FeedCard, FeedMaterialBatch } from "@/components/FeedCard";
import { EscrowBar } from "@/components/EscrowBar";
import { userRole } from "@/lib/roleGuard";
import { Button, EmptyState, Eyebrow, SectionHeader, Stat, cn, controlClass } from "@/components/ui";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";

const CURATED_FEED_BATCHES: FeedMaterialBatch[] = [
  {
    id: "batch_01",
    title: "Panagbenga Botanical Loom Wall Tapestry",
    description:
      "Salvaged highland bolo bamboo and sun-dried strawflowers from Baguio City float sculptures. Hand-woven into archival wall decor.",
    price: 68.0,
    weightKg: 2.4,
    image: "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800",
    cooperativeName: "Cordillera Botanical Cooperative",
    region: "Baguio City",
    country: "Philippines",
    materialType: "Highland Bolo Bamboo",
    festival: "Panagbenga Festival",
  },
  {
    id: "batch_02",
    title: "Yi Peng Luminary Ambient Table Lamp",
    description:
      "Constructed with split bamboo frames and mulberry rice paper recovered post-celebration along the Ping River in Chiang Mai.",
    price: 85.0,
    weightKg: 1.8,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    cooperativeName: "Lanna Heritage Joinery",
    region: "Chiang Mai",
    country: "Thailand",
    materialType: "Mulberry Rice Paper & Bamboo",
    festival: "Yi Peng Lantern Festival",
  },
  {
    id: "batch_03",
    title: "Temple Nirmalaya Artisanal Watercolor Pigment Set",
    description:
      "Extracted from ceremonial marigolds and rose garland biomass. Solar-dried and milled into archival watercolor half-pans.",
    price: 45.0,
    weightKg: 3.5,
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",
    cooperativeName: "Nirmalaya Bio-Craft Collective",
    region: "Varanasi",
    country: "India",
    materialType: "Ceremonial Floral Biomass",
    festival: "Ganesh Chaturthi",
  },
  {
    id: "batch_04",
    title: "Pingxi Repulped Botanical Accordion Journal",
    description:
      "Recycled long-fiber lantern sheets reconstituted with indigenous fern inclusions and unbleached cotton binding cord.",
    price: 38.0,
    weightKg: 1.2,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800",
    cooperativeName: "Pingxi Sustainable Papermaking",
    region: "New Taipei",
    country: "Taiwan",
    materialType: "Mulberry Lantern Paper",
    festival: "Pingxi Lantern Festival",
  },
  {
    id: "batch_05",
    title: "Sinulog Festival Upcycled Abaca Bunting Tote",
    description:
      "Heavy-duty abaca fiber strips and ceremonial banner textiles repurposed into reinforced market bags.",
    price: 52.0,
    weightKg: 2.1,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
    cooperativeName: "Cebu Ancestral Weavers Cooperative",
    region: "Cebu City",
    country: "Philippines",
    materialType: "Abaca Fiber & Banner Textile",
    festival: "Sinulog Festival",
  },
  {
    id: "batch_06",
    title: "Loi Krathong Biodegradable Banana Leaf Wall Plate",
    description:
      "Compressed organic banana trunk fibers and natural gum arabic binder forming resilient wall art tiles.",
    price: 42.0,
    weightKg: 1.6,
    image: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800",
    cooperativeName: "Lanna Eco-Craft Community",
    region: "Sukhothai",
    country: "Thailand",
    materialType: "Organic Banana Fiber",
    festival: "Loi Krathong",
  },
];

const MATERIAL_TAGS = ["Bamboo", "Rice Paper", "Botanical Flora", "Abaca"];
const COUNTRY_TAGS = ["Philippines", "Thailand", "India"];

interface HomeStats {
  kg: number;
  artisans: number;
  passes: number;
  ngo: number;
  live: boolean;
}

export default function FeedHomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { translateSync, formatNumber, formatCurrency } = useTranslation();
  const [batches, setBatches] = useState<FeedMaterialBatch[]>(CURATED_FEED_BATCHES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);
  const [serial, setSerial] = useState("");

  const [stats, setStats] = useState<HomeStats | null>(null);
  useEffect(() => {
    const applyFallback = () => {
      // Sample totals from the curated feed when the ledger is unreachable
      const kg = CURATED_FEED_BATCHES.reduce((s, b) => s + b.weightKg, 0);
      setStats({ kg, artisans: CURATED_FEED_BATCHES.length, passes: 3, ngo: 16.2, live: false });
    };
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.totalKgCollected != null) {
          const d = data.data;
          setStats({
            kg: d.totalKgCollected,
            artisans: d.verifiedArtisansCount ?? 0,
            passes: d.totalPassesIssued ?? 0,
            ngo: d.escrowSplitSummary?.ngoTrustFund10 ?? 0,
            live: true,
          });
        } else {
          applyFallback();
        }
      })
      .catch(applyFallback);
  }, []);

  // Fetch live products from /api/products to display in the global marketplace feed
  useEffect(() => {
    async function loadMarketplaceProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const liveBatches: FeedMaterialBatch[] = data.data.map((p: any) => {
            const firstImg = Array.isArray(p.images) && p.images[0] ? p.images[0] : typeof p.images === "string" ? p.images : undefined;
            const tags =
              Array.isArray(p.materialTags) && p.materialTags.length > 0
                ? p.materialTags.join(", ")
                : p.sourceBatch?.materialType || "Upcycled Heritage Piece";
            return {
              id: p.id,
              title: p.title,
              description: p.description || "",
              price: Number(p.price) || 0,
              image: firstImg,
              cooperativeName: p.artisan?.workshopName || p.artisan?.fullName || "Certified Artisan Workshop",
              region: p.artisan?.country || p.sourceBatch?.agreement?.country || "Asia",
              country: p.sourceBatch?.agreement?.country || p.artisan?.country || "Asia",
              weightKg: Number(p.kgDiverted) || 1.5,
              materialType: tags,
              festival: p.sourceBatch?.agreement?.festival || "Pan-Asian Origin",
            };
          });

          // Combine live products with curated ones, avoiding duplicates
          const liveIds = new Set(liveBatches.map((b) => b.id));
          const remainingCurated = CURATED_FEED_BATCHES.filter((b) => !liveIds.has(b.id));
          setBatches([...liveBatches, ...remainingCurated]);
        }
      } catch (err) {
        console.warn("Failed to load live marketplace products, using curated default:", err);
      }
    }
    loadMarketplaceProducts();
  }, []);

  const role = userRole(user);

  const filteredBatches = batches.filter((b) => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const hit = [b.title, b.description, b.cooperativeName, b.festival, b.materialType, b.region].some((f) => f.toLowerCase().includes(q));
      if (!hit) return false;
    }

    if (selectedTag === "All") return true;
    if (COUNTRY_TAGS.includes(selectedTag)) return b.country === selectedTag;
    return b.materialType.toLowerCase().includes(selectedTag.toLowerCase()) || b.title.toLowerCase().includes(selectedTag.toLowerCase());
  });

  const hasFilters = selectedTag !== "All" || searchQuery.trim().length > 0;
  const resetFilters = () => {
    setSelectedTag("All");
    setSearchQuery("");
  };

  const submitSerial = (e: React.FormEvent) => {
    e.preventDefault();
    const s = serial.trim();
    if (s) router.push(`/verify/${encodeURIComponent(s)}`);
  };

  const steps = [
    {
      icon: Camera,
      title: translateSync("Collect & classify"),
      body: translateSync("Collectors photograph festival waste on refurbished Chromebooks. Gemini identifies the material and flags contamination."),
      tech: "Gemini · ChromeOS",
    },
    {
      icon: Handshake,
      title: translateSync("Match to artisans"),
      body: translateSync("Safe material is logged with GPS and offered to verified cooperatives nearby, under a signed release agreement."),
      tech: "Maps Platform · Firebase",
    },
    {
      icon: Hammer,
      title: translateSync("Craft & tag provenance"),
      body: translateSync("Artisans link each finished piece to its material ID. Gemini drafts the material story for the artisan to review."),
      tech: "Gemini · Cloud Translation",
    },
    {
      icon: QrCode,
      title: translateSync("Buy & verify"),
      body: translateSync("Buyers see the 70/20/10 split at checkout and receive a Verified Impact Pass that anyone can check."),
      tech: "Google Wallet",
    },
  ];

  const chip = (tag: string) => {
    const active = selectedTag === tag;
    return (
      <button
        key={tag}
        onClick={() => setSelectedTag(active ? "All" : tag)}
        aria-pressed={active}
        className={cn(
          "h-9 px-3.5 rounded-full text-sm whitespace-nowrap transition-colors cursor-pointer border",
          active ? "bg-pine-700 border-pine-700 text-white" : "bg-surface border-line text-ink-2 hover:border-pine-300"
        )}
      >
        {translateSync(tag)}
      </button>
    );
  };

  const problems = [
    {
      figure: translateSync("1 night"),
      label: translateSync("is all it takes for tens of thousands of paper-and-bamboo lanterns to be released at Yi Peng and Loy Krathong, Chiang Mai."),
      note: translateSync("Many carry wire and wax that never break down."),
    },
    {
      figure: "150+ t",
      label: translateSync("of floral offering waste (nirmalaya) collected by Thane Municipal Corporation in one Ganesh Chaturthi season."),
      note: translateSync("Only about 40 t of it was composted."),
    },
    {
      figure: translateSync("18 months"),
      label: translateSync("for Phool.co to earn a temple's trust before it would hand over its flower waste."),
      note: translateSync("Consent, not craft, is the bottleneck."),
    },
  ];

  const passRows = [
    { label: translateSync("Collected"), value: "Yi Peng · Chiang Mai" },
    { label: translateSync("Classified by Gemini"), value: translateSync("Mulberry paper, wire-free") },
    { label: translateSync("Crafted by"), value: "Lanna Heritage Joinery" },
  ];

  return (
    <div className="w-full">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line">
        {/* Lantern-light glow on paper — slow, decorative */}
        <div aria-hidden className="absolute inset-0 -z-0">
          <div className="glow w-[520px] h-[520px] -top-40 -left-40 bg-pine-100/70" />
          <div className="glow w-[420px] h-[420px] top-1/3 right-[-120px] bg-lantern-100/80" style={{ animationDelay: "-8s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-16 lg:pb-24 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-7">
            <div className="rise" style={{ ["--rise-delay" as string]: "0ms" }}>
              <Eyebrow>{translateSync("EDUtech Asia 2026 · Planet Protectors Challenge")}</Eyebrow>
            </div>
            <h1
              className="rise font-display text-[44px] sm:text-[56px] lg:text-[64px] leading-[1.02] font-semibold text-ink tracking-[-0.01em]"
              style={{ ["--rise-delay" as string]: "80ms" }}
            >
              {translateSync("Festival waste,")} <span className="italic text-pine-600">{translateSync("traced")}</span> {translateSync("into heritage craft.")}
            </h1>
            <p className="rise text-lg text-ink-2 max-w-xl leading-relaxed" style={{ ["--rise-delay" as string]: "160ms" }}>
              {translateSync(
                "HeriTech is a circular digital system that logs festival materials at collection, routes them to local artisans, and gives every finished piece a public record of where it came from and who got paid."
              )}
            </p>

            <div className="rise flex flex-col sm:flex-row gap-3" style={{ ["--rise-delay" as string]: "240ms" }}>
              <a href="#shop" className="group inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-pine-700 text-white font-medium hover:bg-pine-600 transition-colors">
                {translateSync("Browse crafts")}
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <form onSubmit={submitSerial} className="flex flex-1 max-w-sm">
                <label htmlFor="hero-serial" className="sr-only">
                  {translateSync("Pass serial number")}
                </label>
                <input
                  id="hero-serial"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder={translateSync("Pass serial, e.g. HT-519-PH")}
                  className={cn(controlClass, "h-12 rounded-r-none border-r-0 font-mono-data text-sm")}
                />
                <button type="submit" className="h-12 px-4 rounded-r-md border border-line-strong bg-surface text-ink font-medium hover:border-pine-500 hover:text-pine-700 transition-colors cursor-pointer whitespace-nowrap">
                  {translateSync("Verify")}
                </button>
              </form>
            </div>

            <ul className="rise flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-3" style={{ ["--rise-delay" as string]: "320ms" }}>
              {[translateSync("Gemini classification"), translateSync("Google Wallet passes"), translateSync("Public impact ledger")].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-pine-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6 relative rise" style={{ ["--rise-delay" as string]: "120ms" }}>
            <div className="relative aspect-[5/4] rounded-lg overflow-hidden bg-paper-2 shadow-pop">
              <Image
                src="/fresh-botanical-hero-bg.png"
                alt={translateSync("Artisan workshop with recovered bamboo and paper")}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover kenburns"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-pine-900/25 via-transparent to-transparent" />
            </div>

            {/* Sample pass: verifies itself line by line */}
            <div className="float absolute -bottom-8 left-4 right-4 sm:left-auto sm:right-6 sm:w-[21rem]">
              <div className="bg-surface rounded-md border border-line shadow-pop p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                    <ShieldCheck className="w-4 h-4" />
                    {translateSync("Verified Impact Pass")}
                  </span>
                  <span className="font-mono-data text-xs text-ink-3">HT-519-PH</span>
                </div>
                <p className="mt-2 text-sm text-ink-2">{translateSync("This lamp was once a Yi Peng sky lantern released in Chiang Mai.")}</p>
                <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                  {passRows.map((r, i) => (
                    <li key={r.label} className="confirm flex items-center gap-2 text-xs" style={{ ["--confirm-delay" as string]: `${900 + i * 350}ms` }}>
                      <span className="w-4 h-4 rounded-full bg-success-100 text-success flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      </span>
                      <span className="text-ink-3">{r.label}</span>
                      <span className="ml-auto font-medium text-ink truncate">{r.value}</span>
                    </li>
                  ))}
                </ul>
                <dl className="confirm mt-3 grid grid-cols-3 gap-2 text-xs" style={{ ["--confirm-delay" as string]: "1950ms" }}>
                  <div>
                    <dt className="text-ink-3">{translateSync("Diverted")}</dt>
                    <dd className="tabular font-medium text-ink">1.8 kg</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">{translateSync("To artisan")}</dt>
                    <dd className="tabular font-medium text-ink">{formatCurrency(59.5)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">{translateSync("To NGO")}</dt>
                    <dd className="tabular font-medium text-lantern-600">{formatCurrency(8.5)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="bg-pine-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <Stat tone="dark" label={translateSync("Material diverted")} value={stats ? <CountUp value={stats.kg} decimals={1} format={formatNumber} /> : "—"} unit="kg" />
          <Stat tone="dark" label={translateSync("Verified artisans")} value={stats ? <CountUp value={stats.artisans} format={formatNumber} /> : "—"} />
          <Stat tone="dark" label={translateSync("Impact passes issued")} value={stats ? <CountUp value={stats.passes} format={formatNumber} /> : "—"} />
          <Stat tone="dark" label={translateSync("Donated to NGO partners")} value={stats ? <CountUp value={stats.ngo} decimals={2} format={formatCurrency} /> : "—"} />
          <p className="col-span-2 lg:col-span-4 text-xs text-white/60 -mt-2 flex items-center gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full", stats?.live === false ? "bg-warn" : "bg-pine-300")} aria-hidden />
            {stats?.live === false ? translateSync("Showing sample figures — the ledger is offline.") : translateSync("Figures read live from the HeriTech ledger.")}
          </p>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 grid lg:grid-cols-12 gap-10">
        <Reveal className="lg:col-span-4">
          <SectionHeader
            eyebrow={translateSync("The problem")}
            title={translateSync("Asia's festivals leave a trail no one is tracking")}
            description={translateSync(
              "The material is beautiful and reusable. What's missing is a trusted record of who may collect it, where it went and who was paid."
            )}
          />
        </Reveal>
        <div className="lg:col-span-8 grid sm:grid-cols-3 gap-px bg-line border border-line rounded-md overflow-hidden self-start">
          {problems.map((p, i) => (
            <Reveal key={p.figure} delay={i * 90} className="bg-surface p-6">
              <p className="font-display text-[40px] leading-none font-semibold text-lantern-600">{p.figure}</p>
              <p className="mt-3 text-sm text-ink-2 leading-relaxed">{p.label}</p>
              <p className="mt-3 text-xs text-ink-3">{p.note}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-10">
        <Reveal>
          <SectionHeader
            eyebrow={translateSync("How HeriTech works")}
            title={translateSync("One record, from riverbank to your shelf")}
            description={translateSync("Every step writes to the same ledger, so the claim on the tag can be checked by anyone.")}
          />
        </Reveal>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-md overflow-hidden">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="bg-surface">
                <Reveal delay={i * 90} className="group h-full p-6 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-full bg-pine-100 text-pine-700 flex items-center justify-center transition-colors duration-200 group-hover:bg-pine-700 group-hover:text-white">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-display text-3xl text-line-strong tabular">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-ink font-sans">{s.title}</h3>
                  <p className="mt-2 text-sm text-ink-2 leading-relaxed flex-1">{s.body}</p>
                  <p className="mt-4 text-xs text-pine-500 font-medium">{s.tech}</p>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </section>

      {/* SHOP */}
      <section id="shop" className="scroll-mt-20 border-t border-line bg-paper-2/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <Reveal>
          <SectionHeader
            eyebrow={translateSync("Shop")}
            title={translateSync("Sourced from festivals, crafted by artisans")}
            description={translateSync("Each piece links back to the batch of material it was made from.")}
          />
          </Reveal>

          {/* Filter bar */}
          <div className="sticky top-16 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 py-3 bg-paper/95 backdrop-blur-md sm:bg-transparent sm:backdrop-blur-none sm:static space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={translateSync("Search crafts, festivals, materials")}
                  aria-label={translateSync("Search crafts")}
                  className={cn(controlClass, "h-10 pl-9 pr-9")}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-sm text-ink-3 hover:text-ink cursor-pointer" aria-label={translateSync("Clear search")}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none md:flex-1">
                {MATERIAL_TAGS.map(chip)}
                <span className="w-px h-5 bg-line-strong shrink-0 mx-1" aria-hidden />
                {COUNTRY_TAGS.map(chip)}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-ink-3">
              <span aria-live="polite">
                {filteredBatches.length} {filteredBatches.length === 1 ? translateSync("piece") : translateSync("pieces")}
              </span>
              {hasFilters && (
                <button onClick={resetFilters} className="text-pine-600 hover:text-pine-700 font-medium cursor-pointer">
                  {translateSync("Clear filters")}
                </button>
              )}
            </div>
          </div>

          {filteredBatches.length === 0 ? (
            <EmptyState
              icon={<PackageOpen className="w-5 h-5" />}
              title={translateSync("No pieces match")}
              description={translateSync("Try a different search or clear the filters.")}
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  {translateSync("Clear filters")}
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBatches.slice(0, visibleCount).map((batch) => (
                <FeedCard key={batch.id} batch={batch} role={role} />
              ))}
            </div>
          )}

          {visibleCount < filteredBatches.length && (
            <div className="text-center">
              <Button variant="secondary" size="lg" onClick={() => setVisibleCount((prev) => prev + 6)}>
                {translateSync("Show more pieces")}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* WHERE THE MONEY GOES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
        <Reveal>
        <SectionHeader
          eyebrow={translateSync("Transparent checkout")}
          title={translateSync("Not “a portion goes to charity.” The exact split, every sale.")}
          description={translateSync("The breakdown is shown before you pay and written to the public ledger after. Your pass links to the entry.")}
        />
        </Reveal>
        <Reveal delay={120} className="bg-surface border border-line rounded-md p-6 shadow-card">
          <div className="flex items-baseline justify-between mb-5">
            <span className="text-sm text-ink-3">{translateSync("Example: a lamp sold for")}</span>
            <span className="tabular font-display text-3xl font-semibold text-ink">{formatCurrency(85)}</span>
          </div>
          <EscrowBar amount={85} />
        </Reveal>
      </section>

      {/* PARTNERS */}
      <section className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-ink-3">{translateSync("Developed at University of the Assumption, Pampanga, for EDUtech Asia 2026")}</p>
          <div className="flex items-center gap-8">
            <Image src="/university-of-assumption.png" alt="University of the Assumption" width={56} height={56} className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
            <Image src="/EDUtech_asia-REV1200.webp" alt="EDUtech Asia" width={160} height={48} className="h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </section>
    </div>
  );
}

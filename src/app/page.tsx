"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Camera, Check, Flower2, Handshake, Hammer, Lamp, Layers, MousePointer2, QrCode, Recycle, Search, ShieldCheck, Smartphone, Sparkles, X, PackageOpen } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { FeedCard, toFeedItem, type FeedMaterialBatch } from "@/components/FeedCard";
import { EscrowBar } from "@/components/EscrowBar";
import { userRole } from "@/lib/roleGuard";
import { Button, EmptyState, Skeleton, cn, controlClass } from "@/components/ui";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { useInView } from "@/components/motion/Reveal";
import { CircularLoop } from "@/components/home/CircularLoop";
import { TraceReveal, type TraceTag } from "@/components/motion/TraceReveal";
import { LanternAssembly } from "@/components/motion/LanternAssembly";
import { apiJson } from "@/lib/api";
import type { PublicStats } from "@/app/api/stats/route";
import type { ProductView } from "@/lib/server/views";
import { SPLIT_LABEL } from "@/lib/escrow";

/** The most common values across listed pieces, so filters only offer what is actually for sale. */
function topValues(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([v]) => v);
}

interface HomeStats {
  kg: number;
  artisans: number;
  passes: number;
  charity: number;
}

export default function FeedHomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { translateSync, formatNumber, formatCurrency } = useTranslation();
  const [batches, setBatches] = useState<FeedMaterialBatch[]>([]);
  const [productsState, setProductsState] = useState<"loading" | "ready" | "error">("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);
  const [serial, setSerial] = useState("");
  const { ref: stepsRef, inView: stepsIn } = useInView<HTMLOListElement>();

  const [stats, setStats] = useState<HomeStats | null>(null);
  const [statsOffline, setStatsOffline] = useState(false);
  useEffect(() => {
    apiJson<PublicStats>("/api/stats").then((result) => {
      const d = result.data;
      if (!result.success || !d) {
        setStatsOffline(true);
        return;
      }
      setStats({
        kg: d.totalKgCollected,
        artisans: d.verifiedArtisansCount,
        passes: d.totalPassesIssued,
        charity: d.escrowSplitSummary.charityMaintenance,
      });
    });
  }, []);

  useEffect(() => {
    apiJson<ProductView[]>("/api/products").then((result) => {
      if (result.success) {
        setBatches((result.data ?? []).map(toFeedItem));
        setProductsState("ready");
      } else {
        setProductsState("error");
      }
    });
  }, []);

  const role = userRole(user);
  const materialTags = topValues(batches.flatMap((b) => b.materialType.split(", ")), 5);
  const countryTags = topValues(batches.map((b) => b.country), 4);

  const filteredBatches = batches.filter((b) => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const hit = [b.title, b.description, b.cooperativeName, b.festival, b.materialType, b.region].some((f) => f.toLowerCase().includes(q));
      if (!hit) return false;
    }

    if (selectedTag === "All") return true;
    if (countryTags.includes(selectedTag)) return b.country === selectedTag;
    // Material chips match the piece's material tags only, not words in its title.
    return b.materialType.split(", ").some((m) => m.toLowerCase() === selectedTag.toLowerCase());
  });

  const hasFilters = selectedTag !== "All" || searchQuery.trim().length > 0;
  const resetFilters = () => {
    setSelectedTag("All");
    setSearchQuery("");
  };

  // "More from this maker" links (e.g. from a Wallet pass) arrive as /?q=<maker>#shop.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearchQuery(q);
  }, []);

  const submitSerial = (e: React.FormEvent) => {
    e.preventDefault();
    const s = serial.trim().toUpperCase();
    if (s) router.push(`/verify/${encodeURIComponent(s)}`);
  };

  const steps = [
    {
      icon: Camera,
      title: translateSync("Collect & classify"),
      body: translateSync("Local government officers photograph leftover festival material where it is collected. Gemini names the material and flags anything to remove."),
      tech: "Gemini",
    },
    {
      icon: Handshake,
      title: translateSync("Match to artisans"),
      body: translateSync("Safe material is logged with GPS and offered to verified cooperatives nearby, under a signed release agreement."),
      tech: "Maps Platform · Firebase",
    },
    {
      icon: Hammer,
      title: translateSync("Make and tag the piece"),
      body: translateSync("Artisans link each finished piece to its material ID. Gemini drafts the material story for the artisan to review."),
      tech: "Gemini · Cloud Translation",
    },
    {
      icon: QrCode,
      title: translateSync("Buy & verify"),
      body: `${translateSync("Buyers see the")} ${SPLIT_LABEL} ${translateSync("split at checkout and receive a Verified Impact Pass that anyone can check.")}`,
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
          "relative h-10 px-4 rounded-full text-sm whitespace-nowrap transition-colors cursor-pointer shrink-0 after:absolute after:-inset-y-0.5 after:inset-x-0 after:content-['']",
          active ? "bg-pine-700 text-white" : "bg-surface text-ink-2 hover:bg-pine-50"
        )}
      >
        {translateSync(tag)}
      </button>
    );
  };

  // Published figures only, each with its source.
  const problems = [
    {
      figure: "50,000+",
      photo: "/photos/yi-peng.jpg",
      alt: translateSync("Thousands of paper sky lanterns rising at Yi Peng in Chiang Mai"),
      value: 50000,
      suffix: "+",
      icon: Lamp,
      label: translateSync("sky lanterns released in a single night at Yi Peng, Chiang Mai (2017)."),
      note: translateSync("In 2025 the festival disrupted 161 flights at Chiang Mai airport."),
      source: "Khaosod English",
      href: "https://www.khaosodenglish.com/news/2017/11/03/yi-peng-lanterns-soar-sky-tonight-photo/",
    },
    {
      figure: "508 t",
      photo: "/photos/marigold-garland.jpg",
      alt: translateSync("Marigold garlands, the offerings collected after Ganesh Chaturthi"),
      value: 508,
      suffix: " t",
      icon: Flower2,
      label: translateSync("of floral offerings collected in Mumbai after Ganesh Chaturthi 2025."),
      note: translateSync("Collected in a single post-immersion drive."),
      source: "Greater Kashmir",
      href: "https://m.greaterkashmir.com/article/ganesh-festival-508-tonnes-of-floral-offerings-collected-in-post-immersion-drive/431563",
    },
    {
      figure: "30+ t",
      photo: "/photos/temple-flowers.jpg",
      alt: translateSync("A pile of spent offering flowers"),
      value: 30,
      suffix: "+ t",
      icon: Recycle,
      label: translateSync("of temple flower waste processed every day by Phool.co in India (2025)."),
      note: translateSync("Proof that festival leftovers can become products people buy."),
      source: "YourStory",
      href: "https://yourstory.com/2025/07/phool-flowercycling-sustainable-innovation",
    },
  ];

  const systemPoints = [
    {
      icon: Smartphone,
      title: translateSync("Works on any phone"),
      body: translateSync("Runs in the phone browser officers and artisans already use. Nothing to install."),
    },
    {
      icon: Layers,
      title: translateSync("Any festival, any leftover"),
      body: translateSync("Whatever a festival leaves behind, the same steps apply: agreement, scan, pickup, craft and pass."),
    },
    {
      icon: ShieldCheck,
      title: translateSync("Proof anyone can check"),
      body: translateSync("Every pass opens a public record with the origin, maker and money split. No account needed."),
    },
  ];

  // What "traced" means, pinned onto the hero photo (generic, no invented records)
  const heroTags: TraceTag[] = [
    { label: translateSync("Material logged"), detail: translateSync("At the collection point"), x: 52, y: 18 },
    { label: translateSync("Classified by Gemini"), detail: translateSync("Type and condition"), x: 81, y: 27 },
    { label: translateSync("Linked to its maker"), detail: translateSync("Verified artisan"), x: 50, y: 47 },
  ];


  return (
    <div className="w-full">
      {/* HERO — photo first. Muted until traced: hover (or tap) brings it into colour. */}
      <TraceReveal
        src="/fresh-botanical-hero-bg.png"
        alt={translateSync("Artisan workshop with recovered festival materials")}
        className="hero-trace bg-pine-900 text-white"
        tags={heroTags}
        followCursor={false}
        renderToggle={({ full, toggle }) => (
          <div className="absolute z-[2] top-4 right-4 sm:top-6 sm:right-6 lg:hidden">
            <button
              type="button"
              onClick={toggle}
              aria-pressed={full}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white/15 border border-white/25 text-sm text-white hover:bg-white/25 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {full ? translateSync("Show leftovers") : translateSync("Craft it")}
            </button>
          </div>
        )}
      >
        {/* Scrim keeps the copy readable over any part of the photo */}
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(0deg,rgb(20_40_30/0.97)_0%,rgb(20_40_30/0.85)_55%,rgb(20_40_30/0.15)_85%,rgb(20_40_30/0)_100%)] lg:bg-[linear-gradient(90deg,rgb(20_40_30/0.95)_0%,rgb(20_40_30/0.8)_34%,rgb(20_40_30/0.2)_62%,rgb(20_40_30/0)_100%)] pointer-events-none" />
        {/* Fade the photo into the ledger band so the two read as one scene */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-pine-900 to-transparent pointer-events-none" />

        {/* Leftovers → lantern. Hover (or "Craft it") assembles it. */}
        <div
          aria-hidden
          className="absolute z-[1] left-1/2 top-2 -translate-x-1/2 origin-top scale-[0.4] sm:scale-[0.6] lg:scale-100 lg:translate-x-0 lg:left-[calc(72%-220px)] lg:top-[calc(44%-260px)] w-[440px] h-[560px] pointer-events-none"
        >
          <LanternAssembly className="left-0 top-0" />
          <div className="absolute left-1/2 top-[436px] -translate-x-1/2 whitespace-nowrap hidden lg:block">
            <span className="trace-when-idle absolute left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-pine-900/70 border border-white/15 px-3.5 py-1.5 text-sm text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              {translateSync("Leftovers after the festival")}
            </span>
            <span className="trace-when-crafted absolute left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm font-medium text-ink shadow-pop">
              <Check className="w-4 h-4 text-success" strokeWidth={2.5} />
              {translateSync("Crafted · traced · verified")}
            </span>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:min-h-[620px] lg:min-h-[min(84vh,760px)] flex items-end lg:items-center pt-52 sm:pt-80 pb-10 sm:pb-14 lg:py-20">
          <div className="max-w-xl space-y-5 sm:space-y-7">
            <h1
              className="rise font-display text-[40px] sm:text-[60px] lg:text-[68px] leading-[1.0] font-semibold text-white tracking-[-0.01em]"
              style={{ ["--rise-delay" as string]: "80ms" }}
            >
              {translateSync("Festival waste,")} {translateSync("traced")} {translateSync("into heritage craft.")}
            </h1>
            <p className="rise text-base sm:text-lg text-white/80 leading-relaxed" style={{ ["--rise-delay" as string]: "160ms" }}>
              {translateSync(
                "HeriTech is a circular digital system that logs festival materials at collection, routes them to local artisans, and gives every finished piece a public record of where it came from and who got paid."
              )}
            </p>

            <div className="rise flex flex-col sm:flex-row gap-3" style={{ ["--rise-delay" as string]: "240ms" }}>
              <a href="#shop" className="group inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-white text-pine-900 font-medium hover:bg-pine-50 transition-colors">
                {translateSync("Browse crafts")}
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <form id="verify" onSubmit={submitSerial} className="flex flex-1 max-w-sm scroll-mt-24">
                <label htmlFor="hero-serial" className="sr-only">
                  {translateSync("Pass serial number")}
                </label>
                <input
                  id="hero-serial"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value.toUpperCase())}
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="HT-XXXX-XXXX"
                  className={cn(
                    controlClass,
                    "h-12 rounded-l-full rounded-r-none border-r-0 pl-5 font-mono-data text-base sm:text-sm bg-white/10 border-white/30 text-white placeholder:text-white/55 focus:border-white focus:ring-white/20"
                  )}
                />
                <button
                  type="submit"
                  className="h-12 px-5 rounded-r-full border border-white/30 bg-white/10 text-white font-medium hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {translateSync("Verify")}
                </button>
              </form>
            </div>

            <ul className="rise flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75" style={{ ["--rise-delay" as string]: "320ms" }}>
              {[translateSync("Gemini classification"), translateSync("Google Wallet passes"), translateSync("Public impact record")].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-pine-200" />
                  {t}
                </li>
              ))}
            </ul>

            <p className="rise hidden lg:flex items-center gap-2 text-sm text-white/65" style={{ ["--rise-delay" as string]: "400ms" }}>
              <MousePointer2 className="w-4 h-4" />
              {translateSync("Hover the photo to turn the leftovers into a lantern")}
            </p>
          </div>
        </div>

      </TraceReveal>

      {/* PROOF STRIP: the live ledger, its figures set large */}
      <section className="ledger-band text-white" aria-labelledby="ledger-title">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {[
              { label: translateSync("of festival material traced"), hint: translateSync("Weighed and logged at collection points"), value: stats ? <CountUp value={stats.kg} decimals={1} format={formatNumber} /> : "—", unit: "kg" },
              { label: translateSync("verified artisans"), hint: translateSync("Approved before they can claim material"), value: stats ? <CountUp value={stats.artisans} format={formatNumber} /> : "—" },
              { label: translateSync("impact passes issued"), hint: translateSync("Each one publicly scannable"), value: stats ? <CountUp value={stats.passes} format={formatNumber} /> : "—" },
              { label: translateSync("raised for charity and upkeep"), hint: translateSync("5% of every sale, on the record"), value: stats ? <CountUp value={stats.charity} decimals={2} format={formatCurrency} /> : "—" },
            ].map((m, i) => (
              <Reveal key={i} delay={i * 80} className="flex flex-col">
                <dd className="order-1 tabular font-display text-[clamp(2.75rem,5.5vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.02em]">
                  {m.value}
                  {m.unit && <span className="ml-1.5 font-sans text-xl font-medium text-white/70">{m.unit}</span>}
                </dd>
                <dt className="order-2 mt-2 text-base text-white/90">{m.label}</dt>
                <p className="order-3 mt-1 hidden sm:block text-sm text-white/65">{m.hint}</p>
              </Reveal>
            ))}
          </dl>
          <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 id="ledger-title" className="flex items-center gap-2.5 text-base font-medium text-white/85">
              <span className={cn("w-2 h-2 rounded-full shrink-0", statsOffline ? "bg-warn" : "bg-pine-300 ledger-pulse")} aria-hidden />
              {statsOffline ? translateSync("The ledger can't be reached right now.") : translateSync("Live from the HeriTech ledger")}
            </h2>
            <a href="/impact" className="inline-flex items-center gap-1.5 text-base text-white/80 hover:text-white transition-colors">
              {translateSync("See the full impact record")}
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* THE PROBLEM: what festivals leave behind, in photographs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-32" aria-labelledby="problem-title">
        <div className="grid lg:grid-cols-12 gap-x-10 gap-y-5 items-end">
          <Reveal className="lg:col-span-6">
            <h2 id="problem-title" className="font-display text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-ink">
              {translateSync("What a festival leaves behind")}
            </h2>
          </Reveal>
          <Reveal delay={80} className="lg:col-span-6">
            <p className="text-lg text-ink-2 leading-relaxed max-w-xl">
              {translateSync("The material is beautiful and reusable. What's missing is a trusted record of who may collect it, where it went and who was paid.")}
            </p>
          </Reveal>
        </div>

        <div className="mt-12 lg:mt-16 grid sm:grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-12">
          {problems.map((p, i) => (
            <Reveal key={p.figure} delay={i * 90} className={cn("flex flex-col", i === 0 ? "sm:col-span-2 lg:col-span-6" : "lg:col-span-3")}>
              <figure className="relative overflow-hidden bg-pine-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photo}
                  alt={p.alt}
                  loading="lazy"
                  decoding="async"
                  className={cn("w-full object-cover problem-photo", i === 0 ? "aspect-[4/3] lg:aspect-[8/5]" : "aspect-[4/5]")}
                />
              </figure>
              <p className={cn("mt-5 font-display leading-none font-semibold tracking-[-0.02em] text-lantern-600 tabular", i === 0 ? "text-[clamp(3rem,6vw,5rem)]" : "text-[clamp(2.5rem,4vw,3.25rem)]")}>
                <span className="sr-only">{p.figure}</span>
                <span aria-hidden>
                  <CountUp value={p.value} format={formatNumber} />
                  {p.suffix}
                </span>
              </p>
              <p className="mt-3 text-base text-ink leading-relaxed">{p.label}</p>
              <p className="mt-2 text-sm text-ink-3 leading-relaxed">{p.note}</p>
              <a href={p.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-2 hover:text-brand">
                {translateSync("Source")}: {p.source}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS: one record along one rail */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36" aria-labelledby="steps-title">
        <Reveal className="max-w-3xl">
          <h2 id="steps-title" className="font-display text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-ink">
            {translateSync("One record, from riverbank to shelf")}
          </h2>
          <p className="mt-5 text-lg text-ink-2 leading-relaxed max-w-xl">
            {translateSync("Every step is recorded when it happens, so anyone can check the claim on the tag.")}
          </p>
        </Reveal>
        <ol ref={stepsRef} className={cn("relative mt-14 lg:mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12", stepsIn && "steps-in")}>
          <span className="hidden lg:block absolute left-0 right-0 top-[7px] h-[3px] rounded-full bg-paper-2" aria-hidden>
            <span className="step-rail-fill absolute inset-0 rounded-full bg-brand-2" />
          </span>
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            return (
              <li key={s.title} className="relative">
                <span
                  aria-hidden
                  className={cn("step-dot relative z-10 block w-[17px] h-[17px] rounded-full bg-paper-2", last && "step-dot-last")}
                  style={{ transitionDelay: `${300 + i * 380}ms` }}
                />
                <Reveal delay={i * 90} className="mt-7">
                  <h3 className="font-display text-[26px] leading-tight font-semibold text-ink">{s.title}</h3>
                  <p className="mt-3 text-base text-ink-2 leading-relaxed">{s.body}</p>
                  <p className={cn("mt-4 text-sm font-medium", last ? "text-lantern-600" : "text-brand-2")}>
                    {translateSync("Built on")} {s.tech.split(" · ").join(translateSync(" and "))}
                  </p>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </section>

      {/* CIRCULAR DIGITAL SYSTEM */}
      <section className="ledger-band text-white" aria-labelledby="loop-title">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          <div className="lg:col-span-5">
            <Reveal>
              <h2 id="loop-title" className="font-display text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-white">
                {translateSync("The same loop at every festival")}
              </h2>
              <p className="mt-5 text-lg text-white/80 leading-relaxed">
                {translateSync("HeriTech records each step from leftover to finished piece, so anyone can check where it came from.")}
              </p>
            </Reveal>
            <ul className="mt-10 space-y-7">
              {systemPoints.map((point, i) => (
                <li key={point.title}>
                  <Reveal delay={i * 90}>
                    <h3 className="font-display text-[24px] leading-tight font-semibold text-white">{point.title}</h3>
                    <p className="mt-1.5 text-base text-white/75 leading-relaxed">{point.body}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
          <Reveal delay={150} className="lg:col-span-7 max-w-xl mx-auto w-full">
            <CircularLoop />
          </Reveal>
        </div>
      </section>

      {/* SHOP */}
      <section id="shop" className="scroll-mt-20 bg-paper-2" aria-labelledby="shop-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 space-y-10">
          <Reveal className="grid lg:grid-cols-12 gap-x-10 gap-y-4 items-end">
            <h2 id="shop-title" className="lg:col-span-7 font-display text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-ink">
              {translateSync("Pieces made from what was left")}
            </h2>
            <p className="lg:col-span-5 text-lg text-ink-2 leading-relaxed">
              {translateSync("Each piece links back to the batch of material it was made from.")}
            </p>
          </Reveal>

          {/* Filter bar */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={translateSync("Search crafts, festivals, materials")}
                  aria-label={translateSync("Search crafts")}
                  className={cn(controlClass, "h-11 pl-9 pr-11")}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-0.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-sm text-ink-3 hover:text-ink cursor-pointer" aria-label={translateSync("Clear search")}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 -mx-4 px-4 md:mx-0 md:px-0 md:flex-1 [mask-image:linear-gradient(to_right,black_85%,transparent)] md:[mask-image:none]">
                {materialTags.map(chip)}
                <span className="w-3 shrink-0" aria-hidden />
                {countryTags.map(chip)}
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-ink-3">
              <span aria-live="polite">
                {filteredBatches.length} {filteredBatches.length === 1 ? translateSync("piece") : translateSync("pieces")}
              </span>
              {hasFilters && (
                <button onClick={resetFilters} className="text-brand-2 hover:text-brand font-medium cursor-pointer">
                  {translateSync("Clear filters")}
                </button>
              )}
            </div>
          </div>

          {productsState === "loading" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" role="status" aria-label={translateSync("Loading pieces…")}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-md border border-line bg-surface overflow-hidden">
                  <Skeleton className="aspect-[4/3] rounded-none" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-7 w-20" />
                      <Skeleton className="h-10 w-28 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : productsState === "error" ? (
            <EmptyState
              icon={<PackageOpen className="w-5 h-5" />}
              title={translateSync("The shop couldn't load")}
              description={translateSync("Check your connection and refresh the page.")}
            />
          ) : batches.length === 0 ? (
            <EmptyState
              icon={<PackageOpen className="w-5 h-5" />}
              title={translateSync("No pieces listed yet")}
              description={translateSync("Artisans list their work here once they have crafted it from a collected batch.")}
            />
          ) : filteredBatches.length === 0 ? (
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 grid lg:grid-cols-12 gap-12 items-center" aria-labelledby="split-title">
        <Reveal className="lg:col-span-5">
          <h2 id="split-title" className="font-display text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-ink">
            {translateSync("Every sale, split in the open")}
          </h2>
          <p className="mt-5 text-lg text-ink-2 leading-relaxed">
            {translateSync("Not \u201ca portion goes to charity\u201d. You see the exact split before you pay, and it goes on the public record after. Your pass links to it.")}
          </p>
        </Reveal>
        <Reveal delay={120} className="lg:col-span-7 bg-surface p-7 sm:p-9">
          <div className="flex items-baseline justify-between mb-6">
            <span className="text-base text-ink-2">{translateSync("A piece sold for")}</span>
            <span className="tabular font-display text-[44px] leading-none font-semibold text-ink">{formatCurrency(85)}</span>
          </div>
          <EscrowBar amount={85} animate />
        </Reveal>
      </section>

      {/* PARTNERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24" aria-label={translateSync("Partners")}>
        <Reveal className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface px-7 py-7">
          <div className="flex items-center gap-4">
            <Image src="/university-of-assumption.png" alt="University of the Assumption" width={56} height={56} className="partner-seal h-14 w-auto object-contain" />
            <p className="text-base text-ink-2">
              <span className="font-medium text-ink">{translateSync("Built at University of the Assumption, Pampanga")}</span>
              <br />
              {translateSync("Presented at EDUtech Asia 2026, Planet Protectors Challenge")}
            </p>
          </div>
          <span className="inline-flex items-center bg-pine-900 px-4 py-3">
            <Image src="/EDUtech_asia-REV1200.webp" alt="EDUtech Asia" width={160} height={23} className="h-6 w-auto object-contain" />
          </span>
        </Reveal>
        <p className="mt-4 text-sm text-ink-3">
          {translateSync("Photographs")}: {"\u201cLK 02 loy krathong yi peng san sai\u201d by Takeaway, CC BY-SA 3.0"} · {"\u201cMarigold Flowers as garland\u201d by SnapMeUp, CC BY 4.0"}, {translateSync("via Wikimedia Commons")} · {translateSync("product and material photos from Unsplash")}
        </p>
      </section>
    </div>
  );
}

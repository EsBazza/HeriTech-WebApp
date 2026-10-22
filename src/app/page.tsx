"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, BadgeCheck, Camera, Check, Flower2, Handshake, HandHeart, Hammer, Lamp, Leaf, Layers, MousePointer2, QrCode, Recycle, Search, ShieldCheck, Smartphone, Sparkles, X, PackageOpen } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { FeedCard, toFeedItem, type FeedMaterialBatch } from "@/components/FeedCard";
import { EscrowBar } from "@/components/EscrowBar";
import { userRole } from "@/lib/roleGuard";
import { Button, EmptyState, Eyebrow, SectionHeader, Skeleton, Stat, cn, controlClass } from "@/components/ui";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { useInView } from "@/components/motion/Reveal";
import { spotlight } from "@/components/motion/spotlight";
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
          "relative h-10 px-4 rounded-full text-sm whitespace-nowrap transition-colors cursor-pointer border shrink-0 after:absolute after:-inset-y-0.5 after:inset-x-0 after:content-['']",
          active ? "bg-pine-700 border-pine-700 text-white" : "bg-surface border-line text-ink-2 hover:border-pine-300"
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
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white/15 border border-white/25 text-sm text-white backdrop-blur hover:bg-white/25 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {full ? translateSync("Show leftovers") : translateSync("Craft it")}
            </button>
          </div>
        )}
      >
        {/* Scrim keeps the copy readable over any part of the photo */}
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(0deg,rgb(20_40_30/0.97)_0%,rgb(20_40_30/0.85)_55%,rgb(20_40_30/0.15)_85%,rgb(20_40_30/0)_100%)] lg:bg-[linear-gradient(90deg,rgb(20_40_30/0.95)_0%,rgb(20_40_30/0.8)_34%,rgb(20_40_30/0.2)_62%,rgb(20_40_30/0)_100%)] pointer-events-none" />

        {/* Leftovers → lantern. Hover (or "Craft it") assembles it. */}
        <div
          aria-hidden
          className="absolute z-[1] left-1/2 top-2 -translate-x-1/2 origin-top scale-[0.4] sm:scale-[0.6] lg:scale-100 lg:translate-x-0 lg:left-[calc(72%-220px)] lg:top-[calc(44%-260px)] w-[440px] h-[560px] pointer-events-none"
        >
          <LanternAssembly className="left-0 top-0" />
          <div className="absolute left-1/2 top-[372px] -translate-x-1/2 whitespace-nowrap hidden lg:block">
            <span className="trace-when-idle absolute left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-pine-900/70 border border-white/15 px-3.5 py-1.5 text-sm text-white/85 backdrop-blur">
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
            <div className="rise" style={{ ["--rise-delay" as string]: "0ms" }}>
              <Eyebrow className="text-pine-200">{translateSync("EDUtech Asia 2026 · Planet Protectors Challenge")}</Eyebrow>
            </div>
            <h1
              className="rise font-display text-[40px] sm:text-[60px] lg:text-[68px] leading-[1.0] font-semibold text-white tracking-[-0.01em]"
              style={{ ["--rise-delay" as string]: "80ms" }}
            >
              {translateSync("Festival waste,")} <span className="italic text-pine-200">{translateSync("traced")}</span> {translateSync("into heritage craft.")}
            </h1>
            <p className="rise text-base sm:text-lg text-white/80 leading-relaxed" style={{ ["--rise-delay" as string]: "160ms" }}>
              {translateSync(
                "HeriTech is a circular digital system that logs festival materials at collection, routes them to local artisans, and gives every finished piece a public record of where it came from and who got paid."
              )}
            </p>

            <div className="rise flex flex-col sm:flex-row gap-3" style={{ ["--rise-delay" as string]: "240ms" }}>
              <a href="#shop" className="group inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-white text-pine-900 font-medium hover:bg-pine-50 transition-colors">
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
                  placeholder={translateSync("Pass serial (HT-XXXX-XXXX)")}
                  className={cn(
                    controlClass,
                    "h-12 rounded-r-none border-r-0 font-mono-data text-base sm:text-sm bg-white/10 border-white/30 text-white placeholder:text-white/55 focus:border-white focus:ring-white/20 backdrop-blur"
                  )}
                />
                <button
                  type="submit"
                  className="h-12 px-4 rounded-r-md border border-white/30 bg-white/10 text-white font-medium hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap backdrop-blur"
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

            <p className="rise hidden lg:flex items-center gap-2 text-xs text-white/60" style={{ ["--rise-delay" as string]: "400ms" }}>
              <MousePointer2 className="w-3.5 h-3.5" />
              {translateSync("Hover the photo to turn the leftovers into a lantern")}
            </p>
          </div>
        </div>

      </TraceReveal>

      {/* PROOF STRIP — the live ledger */}
      <section className="ledger-band text-white">
        <svg className="ledger-thread absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-24 pointer-events-none" viewBox="0 0 1200 96" preserveAspectRatio="none" aria-hidden>
          <path d="M0 60 C 200 10, 380 90, 600 48 S 1000 14, 1200 52" fill="none" stroke="rgb(224 138 90 / 0.35)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between gap-4 mb-7">
            <p className="flex items-center gap-2.5 text-sm text-white/75">
              <span className={cn("w-2 h-2 rounded-full shrink-0", statsOffline ? "bg-warn" : "bg-pine-300 ledger-pulse")} aria-hidden />
              {statsOffline ? translateSync("The figures can't load right now.") : translateSync("Live figures from HeriTech's records.")}
            </p>
            <a href="/impact" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/75 hover:text-white transition-colors">
              {translateSync("Open the impact ledger")}
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Leaf, label: translateSync("Material collected"), value: stats ? <CountUp value={stats.kg} decimals={1} format={formatNumber} /> : "—", unit: "kg" },
              { icon: BadgeCheck, label: translateSync("Verified artisans"), value: stats ? <CountUp value={stats.artisans} format={formatNumber} /> : "—" },
              { icon: QrCode, label: translateSync("Impact passes issued"), value: stats ? <CountUp value={stats.passes} format={formatNumber} /> : "—" },
              { icon: HandHeart, label: translateSync("Charity & app upkeep"), value: stats ? <CountUp value={stats.charity} decimals={2} format={formatCurrency} /> : "—" },
            ].map((m, i) => (
              <Reveal
                key={i}
                delay={i * 80}
                onPointerMove={spotlight}
                className="spotlight spotlight-dark rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5"
              >
                <Stat tone="dark" icon={<m.icon className="w-4 h-4 text-pine-300" />} label={m.label} value={m.value} unit={m.unit} />
              </Reveal>
            ))}
          </div>
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
        <div className="lg:col-span-8 grid sm:grid-cols-3 gap-4 self-start">
          {problems.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal
                key={p.figure}
                delay={i * 90}
                onPointerMove={spotlight}
                className="spotlight lift group relative overflow-hidden flex flex-col bg-surface border border-line rounded-lg p-6 shadow-card"
              >
                <Icon className="absolute -right-6 -bottom-6 w-32 h-32 text-pine-700/[0.05] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" strokeWidth={1.25} aria-hidden />
                <div className="flex items-center justify-between">
                  <span className={cn("w-10 h-10 rounded-full flex items-center justify-center", i === 2 ? "bg-pine-100 text-pine-700" : "bg-lantern-100 text-lantern-600")}>
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  <span className="font-display text-2xl text-line-strong tabular">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="mt-6 font-display text-[44px] leading-none font-semibold text-lantern-gradient">
                  <span className="sr-only">{p.figure}</span>
                  <span aria-hidden>
                    <CountUp value={p.value} format={formatNumber} />
                    {p.suffix}
                  </span>
                </p>
                <p className="mt-3 text-sm text-ink-2 leading-relaxed">{p.label}</p>
                <p className="mt-3 text-xs text-ink-3 flex-1">{p.note}</p>
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="mt-5 pt-4 border-t border-line inline-flex items-center gap-1 text-xs font-medium text-pine-600 hover:text-pine-700">
                  {translateSync("Source")}: {p.source}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-10">
        <Reveal>
          <SectionHeader
            eyebrow={translateSync("How HeriTech works")}
            title={translateSync("One record, from riverbank to your shelf")}
            description={translateSync("Every step is recorded when it happens, so anyone can check the claim on the tag.")}
          />
        </Reveal>
        <ol ref={stepsRef} className={cn("relative grid sm:grid-cols-2 lg:grid-cols-4 gap-5", stepsIn && "steps-in")}>
          <span className="hidden lg:block absolute left-[12.5%] right-[12.5%] top-6 h-px bg-line-strong" aria-hidden>
            <span className="step-rail-fill absolute inset-0 bg-gradient-to-r from-pine-500 via-pine-500 to-lantern" />
          </span>
          {steps.map((s, i) => {
            const Icon = s.icon;
            const last = i === steps.length - 1;
            return (
              <li key={s.title} className="relative flex flex-col">
                <span
                  className={cn("step-dot relative z-10 mx-auto w-12 h-12 rounded-full bg-pine-100 text-pine-700 flex items-center justify-center", last && "step-dot-last")}
                  style={{ transitionDelay: `${300 + i * 380}ms` }}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <Reveal
                  delay={i * 90}
                  onPointerMove={spotlight}
                  className={cn(
                    "spotlight lift mt-5 flex-1 rounded-lg border p-6 flex flex-col",
                    last ? "spotlight-dark bg-pine-900 border-pine-900 text-white" : "bg-surface border-line shadow-card"
                  )}
                >
                  <span className={cn("font-display text-sm tabular", last ? "text-pine-300" : "text-ink-3")}>
                    {translateSync("Step")} {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className={cn("mt-1 font-display text-[22px] leading-snug font-semibold", last ? "text-white" : "text-ink")}>{s.title}</h3>
                  <p className={cn("mt-2 text-sm leading-relaxed flex-1", last ? "text-white/75" : "text-ink-2")}>{s.body}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {s.tech.split(" · ").map((t) => (
                      <span
                        key={t}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                          last ? "bg-lantern text-white" : "bg-pine-50 border border-pine-100 text-pine-700"
                        )}
                      >
                        <Sparkles className="w-3 h-3" aria-hidden />
                        {t}
                      </span>
                    ))}
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </section>

      {/* CIRCULAR DIGITAL SYSTEM */}
      <section className="ledger-band text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-5 space-y-8">
            <Reveal>
              <SectionHeader
                tone="dark"
                eyebrow={translateSync("How it works")}
                title={translateSync("One system for every festival")}
                description={translateSync("HeriTech records each step from leftover to finished piece, so anyone can check where it came from.")}
              />
            </Reveal>
            <ul className="space-y-3">
              {systemPoints.map((point, i) => {
                const Icon = point.icon;
                return (
                  <li key={point.title}>
                    <Reveal
                      delay={i * 90}
                      onPointerMove={spotlight}
                      className="spotlight spotlight-dark flex gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/20"
                    >
                      <span className="shrink-0 w-10 h-10 rounded-full bg-white/10 text-pine-200 flex items-center justify-center">
                        <Icon className="w-5 h-5" strokeWidth={1.75} />
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-white font-sans">{point.title}</h3>
                        <p className="mt-1 text-sm text-white/70 leading-relaxed">{point.body}</p>
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </div>
          <Reveal delay={150} className="lg:col-span-7 max-w-xl mx-auto w-full">
            <CircularLoop />
          </Reveal>
        </div>
      </section>

      {/* SHOP */}
      <section id="shop" className="scroll-mt-20 border-t border-line bg-gradient-to-b from-paper-2/70 to-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <Reveal>
          <SectionHeader
            eyebrow={translateSync("Shop")}
            title={translateSync("Sourced from festivals, crafted by artisans")}
            description={translateSync("Each piece links back to the batch of material it was made from.")}
          />
          </Reveal>

          {/* Filter bar */}
          <div className="space-y-3 rounded-lg border border-line bg-surface/80 backdrop-blur p-3 sm:p-4 shadow-card">
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
                <span className="w-px h-5 bg-line-strong shrink-0 mx-1" aria-hidden />
                {countryTags.map(chip)}
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
        <Reveal>
        <SectionHeader
          eyebrow={translateSync("Transparent checkout")}
          title={translateSync("Not “a portion goes to charity.” The exact split, every sale.")}
          description={translateSync("You see the split before you pay, and it goes on the public record after. Your pass links to it.")}
        />
        </Reveal>
        <Reveal delay={120} className="bg-surface border border-line rounded-md p-6 shadow-card">
          <div className="flex items-baseline justify-between mb-5">
            <span className="text-sm text-ink-3">{translateSync("Example: a piece sold for")}</span>
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
            <span className="inline-flex items-center rounded-md bg-pine-900 px-4 py-3">
              <Image src="/EDUtech_asia-REV1200.webp" alt="EDUtech Asia" width={160} height={23} className="h-6 w-auto object-contain" />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

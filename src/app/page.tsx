"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Hammer, MousePointer2, RotateCcw, Search, X, PackageOpen } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { FeedCard, toFeedItem, type FeedMaterialBatch } from "@/components/FeedCard";
import { userRole } from "@/lib/roleGuard";
import { Button, EmptyState, Skeleton, cn, controlClass } from "@/components/ui";
import { Reveal } from "@/components/motion/Reveal";
import { LedgerMarquee } from "@/components/home/LedgerMarquee";
import { TraceReveal, type TraceTag } from "@/components/motion/TraceReveal";
import { LanternAssembly } from "@/components/motion/LanternAssembly";
import { apiJson } from "@/lib/api";
import type { PublicStats } from "@/app/api/stats/route";
import type { ProductView } from "@/lib/server/views";

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

const PAGE = 6;

/** Placeholder with the shape of a product tile: square photo, then name, price and button. */
function TileSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="aspect-square rounded-lg" />
      <div className="pt-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default function FeedHomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { translateSync, translateTemplate } = useTranslation();
  const [batches, setBatches] = useState<FeedMaterialBatch[]>([]);
  const [productsState, setProductsState] = useState<"loading" | "ready" | "error">("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [serial, setSerial] = useState("");

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

  // The shop grows as you scroll, a page at a time; a new search or filter starts again at one page.
  const filterKey = `${searchQuery}\u0000${selectedTag}`;
  const [shown, setShown] = useState({ key: filterKey, count: PAGE });
  const visibleCount = shown.key === filterKey ? shown.count : PAGE;
  const total = filteredBatches.length;
  const hasMore = visibleCount < total;
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canObserve = typeof window === "undefined" || "IntersectionObserver" in window;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadingMore || !canObserve) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setLoadingMore(true);
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingMore, canObserve, productsState]);

  useEffect(() => {
    if (!loadingMore) return;
    // A short beat of skeletons, so new pieces arrive as a row rather than a jump
    const t = setTimeout(() => {
      setShown({ key: filterKey, count: visibleCount + PAGE });
      setLoadingMore(false);
    }, 250);
    return () => clearTimeout(t);
  }, [loadingMore, filterKey, visibleCount]);
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
          // Phones: the leftovers start out of sight. "Craft the lantern" sits where the
          // lantern will hang; once it is built, a small control in the corner takes it apart.
          <div className="absolute inset-0 z-[2] pointer-events-none lg:hidden">
            <button
              type="button"
              onClick={toggle}
              aria-pressed={full}
              tabIndex={full ? -1 : 0}
              aria-hidden={full}
              className="hero-craft-cta pointer-events-auto absolute left-1/2 top-[64px] sm:top-[108px] -translate-x-1/2 inline-flex items-center gap-2 h-12 pl-4 pr-5 rounded-full bg-lantern text-white text-[16px] font-semibold cursor-pointer"
              data-hidden={full}
            >
              <Hammer className="w-[18px] h-[18px]" strokeWidth={2} />
              {translateSync("Craft the lantern")}
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-pressed={full}
              tabIndex={full ? 0 : -1}
              aria-hidden={!full}
              className="hero-craft-reset pointer-events-auto absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-pine-900/60 border border-white/25 text-[14px] text-white cursor-pointer"
              data-shown={full}
            >
              <RotateCcw className="w-4 h-4" />
              {translateSync("Take it apart")}
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
          <div className="max-w-xl sm:max-w-[640px] lg:max-w-[700px] space-y-5 sm:space-y-7">
            <h1
              className="rise font-display text-[44px] sm:text-[62px] lg:text-[72px] leading-[0.97] font-semibold text-white tracking-[-0.025em] text-balance"
              style={{ ["--rise-delay" as string]: "80ms" }}
            >
              {translateSync("Festival waste, traced into heritage craft.")}
            </h1>
            <p className="rise text-[17px] sm:text-[19px] text-white/85 leading-[1.55] max-w-[46ch] text-pretty" style={{ ["--rise-delay" as string]: "160ms" }}>
              {translateSync("HeriTech logs festival leftovers, routes them to local artisans, and gives every piece a public record of where it came from and who got paid.")}
            </p>

            <div className="rise flex flex-col sm:flex-row gap-3" style={{ ["--rise-delay" as string]: "240ms" }}>
              <a href="#shop" className="group inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-white text-pine-900 font-medium hover:bg-white/90 transition-colors">
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

            <ul className="rise flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-white/80" style={{ ["--rise-delay" as string]: "320ms" }}>
              {[translateSync("Gemini classification"), translateSync("Google Wallet passes"), translateSync("Public impact record")].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-pine-200" />
                  {t}
                </li>
              ))}
            </ul>

            <p className="rise hidden lg:flex items-center gap-2 text-sm text-white/65" style={{ ["--rise-delay" as string]: "400ms" }}>
              <MousePointer2 className="w-4 h-4" />
              {translateSync("Hover the photo to craft the lantern")}
            </p>
          </div>
        </div>

      </TraceReveal>

      {/* PROOF STRIP: the live ledger as one endless line of type */}
      <LedgerMarquee stats={stats} offline={statsOffline} />

      {/* SHOP */}
      <section id="shop" className="scroll-mt-20 bg-paper-2" aria-labelledby="shop-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 space-y-10">
          <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-4 items-end">
            <h2 id="shop-title" className="lg:col-span-7 font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.025em] text-balance text-ink">
              {translateSync("Pieces made from what was left")}
            </h2>
            <p className="lg:col-span-5 text-[18px] text-ink-2 leading-[1.6] max-w-[40ch] text-pretty">
              {translateSync("Each one links back to the batch it was made from.")}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10" role="status" aria-label={translateSync("Loading pieces…")}>
              {[0, 1, 2].map((i) => (
                <TileSkeleton key={i} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {filteredBatches.slice(0, visibleCount).map((batch) => (
                <FeedCard key={batch.id} batch={batch} role={role} />
              ))}
            </div>
          )}

          {productsState === "ready" && total > 0 && (
            <>
              {loadingMore && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <TileSkeleton key={i} className={cn(i > 0 && "max-sm:hidden", i > 1 && "max-lg:hidden")} />
                  ))}
                </div>
              )}
              <div ref={sentinelRef} aria-hidden className="h-px" />
              <p className="sr-only" aria-live="polite">
                {translateTemplate("Showing {shown} of {total} pieces", { shown: Math.min(visibleCount, total), total })}
              </p>
              {hasMore && !canObserve && (
                <div className="text-center">
                  <Button variant="secondary" size="lg" onClick={() => setLoadingMore(true)}>
                    {translateSync("Load more pieces")}
                  </Button>
                </div>
              )}
              {!hasMore && total > PAGE && (
                <p className="text-center text-sm text-ink-3">{translateTemplate("You've seen all {total} pieces", { total })}</p>
              )}
            </>
          )}

          <p className="text-center">
            <Link href="/about" className="group inline-flex items-center gap-1.5 min-h-11 text-[15px] font-medium text-brand-2 hover:text-brand">
              {translateSync("How every piece is traced")}
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </p>
        </div>
      </section>

    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  FileSignature,
  ScanLine,
  Hammer,
  ShoppingBag,
  HeartHandshake,
  Copy,
  Check,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Leaf,
  HandCoins,
  Landmark,
  MoveHorizontal,
  Gift,
} from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { EscrowBar } from "@/components/EscrowBar";
import { BoothClaimPanel } from "@/components/wallet/BoothClaimPanel";
import { ProvenanceTimeline, type ProvenanceEvent } from "@/components/ProvenanceTimeline";
import { BeforeAfter } from "@/components/motion/BeforeAfter";
import { CountUp } from "@/components/motion/CountUp";
import { apiJson } from "@/lib/api";
import type { PassRecord } from "@/lib/server/passRecord";
import { Badge, Button, Card, EmptyState, LinkButton, Skeleton, buttonClass, controlClass, cn } from "@/components/ui";

/**
 * The public record a pass QR code opens, laid out like a digital product passport:
 * the piece and its seal first, three numbers, the lantern-string journey, the
 * maker and the split, with the technical proof folded away at the end.
 */
export function VerifyPass({ serial }: { serial: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { translateTemplate, formatCurrency, formatNumber, formatDate, translateSync } = useTranslation();

  const [data, setData] = useState<PassRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const [retry, setRetry] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(null);
    apiJson<PassRecord>(`/api/verify/${encodeURIComponent(serial)}`).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) setData(result.data);
      // A 404 is "no such pass"; anything else is a failed request worth retrying.
      else if (result.status !== 404) setFailed(result.error ?? "Couldn't check this pass.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [serial, attempt]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6" role="status" aria-label={translateSync("Checking the record…")}>
        <Skeleton className="aspect-[4/3] sm:aspect-[16/9] w-full rounded-lg" />
        <Skeleton className="h-8 w-3/4 rounded-md" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!data && failed) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <EmptyState
          icon={<ShieldAlert className="w-5 h-5" />}
          title={translateSync("We couldn't check this pass")}
          description={translateSync(failed)}
          action={
            <Button onClick={() => setAttempt((n) => n + 1)}>
              <RefreshCw className="w-4 h-4" />
              {translateSync("Try again")}
            </Button>
          }
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <span className="w-12 h-12 mx-auto rounded-full bg-warn-100 text-warn flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" strokeWidth={1.75} />
        </span>
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-semibold text-ink">{translateSync("No record found")}</h1>
          <p className="text-ink-2">
            {translateSync("We couldn't find a pass with serial")} <span className="font-mono-data text-ink break-all">{serial}</span>.{" "}
            {translateSync("Check the code and try again.")}
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const next = retry.trim().toUpperCase();
            if (next) router.push(`/verify/${encodeURIComponent(next)}`);
          }}
          className="flex gap-2"
        >
          <input
            value={retry}
            onChange={(e) => setRetry(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="HT-XXXX-XXXX"
            aria-label={translateSync("Pass serial")}
            className={cn(controlClass, "h-11 font-mono-data flex-1 min-w-0")}
          />
          <Button type="submit">{translateSync("Verify")}</Button>
        </form>
        <Link href="/" className="inline-flex items-center gap-1.5 min-h-11 text-sm text-brand-2 hover:text-brand">
          <ArrowLeft className="w-4 h-4" />
          {translateSync("Back to HeriTech")}
        </Link>
      </div>
    );
  }

  const origin: Partial<NonNullable<PassRecord["originHarvest"]>> = data.originHarvest ?? {};
  const escrow = data.escrowAudit;
  // Pieces given away at the showcase booth: no money moved, so there is no split to show.
  const freeClaim = escrow.paymentMode === "free_claim";
  const maker = data.maker;
  const gps = origin.gpsCoordinates;
  const hasGps = gps && typeof gps.lat === "number" && typeof gps.lng === "number";
  const fmt = (d?: string) => (d ? formatDate(new Date(d)) : undefined);
  const productImage = data.product.image;
  // Served at Wallet-banner size by the same public endpoint the pass uses.
  const beforeImage = origin.hasPhoto ? `/api/wallet/before/${encodeURIComponent(data.serial)}` : null;

  const events: ProvenanceEvent[] = [
    {
      icon: <FileSignature className="w-4 h-4" />,
      title: translateSync("Collection agreed"),
      detail: origin.festival
        ? translateTemplate("Material release agreement with {origin}.", { origin: `${translateSync(origin.festival)}${origin.country ? `, ${translateSync(origin.country)}` : ""}` })
        : translateSync("Material release agreement on file."),
    },
    {
      icon: <ScanLine className="w-4 h-4" />,
      title: translateSync("Material logged & classified"),
      meta: fmt(origin.harvestLoggedAt),
      detail: (
        <>
          {formatNumber(origin.weightKg ?? data.product.kgDiverted)} kg {translateSync(origin.materialType || "")}
          {origin.condition && <> · {translateSync(origin.condition)}</>}
          {origin.loggedByOfficer && (
            <span className="block text-ink-3">
              {translateSync("Logged by")} {translateSync(origin.loggedByOfficer)}
              {origin.municipalityStation && <>, {translateSync(origin.municipalityStation)}</>}
            </span>
          )}
        </>
      ),
    },
    {
      icon: <Hammer className="w-4 h-4" />,
      title: translateSync("Crafted"),
      detail: (
        <>
          {translateSync(maker.name || "Artisan")}
          {maker.workshop && <>, {translateSync(maker.workshop)}</>}
          {maker.country && <> · {translateSync(maker.country)}</>}
        </>
      ),
    },
    ...(freeClaim
      ? [
          {
            icon: <Gift className="w-4 h-4" />,
            title: translateSync("Claimed free at the HeriTech booth"),
            meta: fmt(data.issuedAt),
            detail: `${translateTemplate("Pass {serial}", { serial: data.serial })} · ${translateSync("no money changed hands")}`,
          },
        ]
      : [
          {
            icon: <ShoppingBag className="w-4 h-4" />,
            title: translateSync("Sold & pass issued"),
            meta: fmt(data.issuedAt),
            detail: `${formatCurrency(escrow.totalAmount ?? data.product.price)} · ${translateSync("Pass")} ${data.serial}${
              escrow.paymentMode === "simulated" ? ` · ${translateSync("demo payment")}` : ""
            }`,
          },
          {
            icon: <HeartHandshake className="w-4 h-4" />,
            title: translateSync("Split recorded"),
            detail: `${formatCurrency(escrow.lguShare ?? 0)} ${translateSync("to the local government")} · ${formatCurrency(escrow.developerShare ?? 0)} ${translateSync(
              "to the developers"
            )} · ${formatCurrency(escrow.ngoShare ?? 0)} ${translateSync("to")} ${escrow.ngoFundName ? translateSync(escrow.ngoFundName) : translateSync("NGOs & tree planting")}`,
          },
        ]),
  ];

  const facts = [
    { icon: Leaf, label: translateSync("Kept out of landfill"), value: <CountUp value={Number(data.product.kgDiverted) || 0} decimals={1} format={formatNumber} />, unit: "kg" },
    ...(freeClaim
      ? []
      : [
          { icon: HandCoins, label: translateSync("Paid to the maker"), value: <CountUp value={escrow.artisanPayout ?? 0} decimals={2} format={formatCurrency} /> },
          { icon: Landmark, label: translateSync("Paid to the local government"), value: <CountUp value={escrow.lguShare ?? 0} decimals={2} format={formatCurrency} /> },
        ]),
  ];

  const copySerial = async () => {
    try {
      await navigator.clipboard.writeText(data.serial);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6">
      {freeClaim && user?.role === "admin" && <BoothClaimPanel serial={data.serial} />}

      {/* The piece and its seal */}
      <Card className="overflow-hidden rise">
        {productImage &&
          (beforeImage ? (
            <div>
              <BeforeAfter
                className="aspect-[4/3] sm:aspect-[16/9] bg-paper-2"
                label={translateSync("Compare the collected material with the finished piece")}
                before={{ src: beforeImage, label: translateSync("Collected material") }}
                after={{ src: productImage, label: translateSync("Finished piece") }}
              />
              <p className="flex items-center justify-center gap-1.5 py-2 text-xs text-ink-3 bg-surface border-b border-line">
                <MoveHorizontal className="w-3.5 h-3.5" />
                {translateSync("Drag to see what it was made from")}
              </p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- product photos are Storage or data URLs
            <img src={productImage} alt={translateSync(data.product.title)} className="w-full aspect-[4/3] sm:aspect-[16/9] object-cover bg-paper-2" />
          ))}

        <div className="bg-pine-900 text-white px-5 sm:px-8 py-6 sm:py-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 pl-2 pr-3 py-1 text-sm text-white/90">
              <ShieldCheck className="w-4 h-4 text-pine-200" strokeWidth={2} />
              {translateSync("Verified Impact Pass")}
            </span>
            {data.integrity === "match" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/25 px-3 py-1 text-sm text-white">
                <Check className="w-4 h-4" strokeWidth={2.5} />
                {translateSync("Record unchanged since collection")}
              </span>
            )}
            {data.integrity === "changed" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-solid px-3 py-1 text-sm text-white">
                <ShieldAlert className="w-4 h-4" />
                {translateSync("Collection record was edited after logging")}
              </span>
            )}
            {data.issuedAt && (
              <span className="text-sm text-white/60">
                {translateSync("Issued")} {fmt(data.issuedAt)}
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-[34px] sm:text-[44px] leading-[1.05] font-semibold text-white">{translateSync(data.product.title)}</h1>
          {origin.festival && (
            <p className="mt-2 text-white/80 max-w-xl">
              {translateSync("Made from")} {formatNumber(data.product.kgDiverted)} kg {translateSync("of material recovered after")} {translateSync(origin.festival)}
              {origin.country && <>, {translateSync(origin.country)}</>}.
            </p>
          )}
          <button
            onClick={copySerial}
            className="mt-5 inline-flex items-center gap-2 min-h-11 px-3 rounded-md bg-white/10 hover:bg-white/15 text-sm font-mono-data cursor-pointer transition-colors"
            aria-label={`${translateSync("Copy serial")} ${data.serial}`}
          >
            {data.serial}
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-white/70" />}
          </button>
        </div>

        {/* Three numbers, one style */}
        <dl className={cn("grid grid-cols-1 divide-y sm:divide-y-0 sm:divide-x divide-line", facts.length === 3 && "sm:grid-cols-3")}>
          {facts.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 p-4 sm:p-5">
                <span className="w-10 h-10 rounded-full bg-lantern-100 text-lantern-600 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <dd className="tabular font-display text-[28px] leading-none font-semibold text-ink">
                    {f.value}
                    {f.unit && <span className="ml-1 font-sans text-sm font-medium text-ink-3">{f.unit}</span>}
                  </dd>
                  <dt className="mt-1 text-sm text-ink-3">{f.label}</dt>
                </div>
              </div>
            );
          })}
        </dl>
      </Card>

      {/* The journey, lit step by step */}
      <Card className="p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h2 className="font-display text-[28px] leading-tight font-semibold text-ink">{translateSync("Where it came from")}</h2>
            <p className="text-sm text-ink-3 mt-1">{translateSync("Every step below was recorded when it happened.")}</p>
          </div>
          {hasGps && (
            <a
              href={`https://www.google.com/maps?q=${gps.lat},${gps.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary", "sm", "shrink-0")}
              aria-label={`${translateSync("Collection point")} (${translateSync("opens Google Maps")})`}
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">{translateSync("Collection point")}</span>
              <ExternalLink className="w-3.5 h-3.5 text-ink-3" />
            </a>
          )}
        </div>
        <ProvenanceTimeline events={events} animate />
      </Card>

      {/* Maker + split */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="md:col-span-2 p-5 sm:p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink font-sans">{translateSync("Maker")}</h2>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-pine-100 text-brand font-semibold text-sm flex items-center justify-center shrink-0">
              {(maker.name || "A").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-ink truncate">{translateSync(maker.name || "Artisan")}</p>
              {(maker.workshop || maker.country) && (
                <p className="text-sm text-ink-3 truncate">{[maker.workshop, maker.country].filter(Boolean).map((p) => translateSync(p as string)).join(" · ")}</p>
              )}
            </div>
          </div>
          {maker.verified && (
            <Badge tone="success">
              <ShieldCheck className="w-3.5 h-3.5" />
              {translateSync("Verified artisan")}
            </Badge>
          )}
        </Card>

        {freeClaim ? (
          <Card className="md:col-span-3 p-5 sm:p-6 space-y-2">
            <h2 className="text-sm font-semibold text-ink font-sans">{translateSync("Where the money went")}</h2>
            <p className="text-sm text-ink-2">
              {translateSync("This piece was given away free at the HeriTech showcase booth, so no money changed hands and there is no split to show.")}
            </p>
          </Card>
        ) : (
          <Card className="md:col-span-3 p-5 sm:p-6 space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink font-sans">{translateSync("Where the money went")}</h2>
              <span className="tabular font-semibold text-ink">{formatCurrency(escrow.totalAmount ?? 0)}</span>
            </div>
            <EscrowBar amount={escrow.totalAmount ?? 0} ngoName={escrow.ngoFundName} compact animate />
          </Card>
        )}
      </div>

      {/* Technical proof, for whoever wants it */}
      {data.tamperEvidentHarvestHash && (
        <details className="group bg-surface border border-line rounded-md shadow-card">
          <summary className="flex items-center justify-between gap-3 px-5 sm:px-6 min-h-16 py-3 cursor-pointer list-none">
            <span>
              <span className="block text-sm font-semibold text-ink">{translateSync("Technical proof")}</span>
              <span className="block text-sm text-ink-3">{translateSync("SHA-256 hash of the original collection record")}</span>
            </span>
            <ChevronDown className="w-4 h-4 text-ink-3 transition-transform group-open:rotate-180 shrink-0" />
          </summary>
          <div className="px-5 sm:px-6 pb-5">
            <p className="font-mono-data text-xs text-ink-2 break-all bg-paper rounded-sm border border-line p-3">{data.tamperEvidentHarvestHash}</p>
            <p className="text-sm text-ink-3 mt-2">
              {data.integrity === "match"
                ? translateSync("HeriTech recomputed this hash from the stored collection record just now, and it matches the one taken when the material was logged and when this pass was issued.")
                : data.integrity === "changed"
                ? translateSync("The stored collection record no longer produces this hash, so a detail was changed after it was logged.")
                : translateSync("This record is missing a detail needed to recompute the hash, so it can't be checked automatically.")}
            </p>
          </div>
        </details>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 pt-2">
        <LinkButton href={`/products/${encodeURIComponent(data.product.id)}`} variant="secondary">
          {translateSync("See this piece in the shop")}
        </LinkButton>
        <LinkButton href="/#shop" variant="ghost">
          {translateSync("Discover more pieces")}
          <ArrowRight className="w-4 h-4" />
        </LinkButton>
      </div>
    </div>
  );
}

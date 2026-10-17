"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { EscrowBar } from "@/components/EscrowBar";
import { ProvenanceTimeline, type ProvenanceEvent } from "@/components/ProvenanceTimeline";
import { Badge, Button, Card, Spinner, buttonClass, controlClass, cn } from "@/components/ui";

export default function PublicVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const serial = params?.serial as string;
  const { formatCurrency, formatNumber, formatDate, translateSync } = useTranslation();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [retry, setRetry] = useState("");

  useEffect(() => {
    async function loadVerification() {
      try {
        const res = await fetch(`/api/verify/${serial}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Verification fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    if (serial) loadVerification();
  }, [serial]);

  if (loading) {
    return <Spinner label={translateSync("Checking the ledger…")} className="py-32" />;
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
            {translateSync("We couldn't find a pass with serial")} <span className="font-mono-data text-ink">{serial}</span>.{" "}
            {translateSync("Check the code and try again.")}
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (retry.trim()) router.push(`/verify/${encodeURIComponent(retry.trim())}`);
          }}
          className="flex gap-2"
        >
          <input value={retry} onChange={(e) => setRetry(e.target.value)} placeholder="HT-519-PH" aria-label={translateSync("Pass serial")} className={cn(controlClass, "h-11 font-mono-data flex-1")} />
          <Button type="submit">{translateSync("Verify")}</Button>
        </form>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-pine-600 hover:text-pine-700">
          <ArrowLeft className="w-4 h-4" />
          {translateSync("Back to HeriTech")}
        </Link>
      </div>
    );
  }

  const origin = data.originHarvest || {};
  const escrow = data.escrowAudit || {};
  const maker = data.maker || {};
  const gps = origin.gpsCoordinates;
  const hasGps = gps && typeof gps.lat === "number" && typeof gps.lng === "number";
  const fmt = (d?: string) => (d ? formatDate(new Date(d)) : undefined);

  const events: ProvenanceEvent[] = [
    {
      icon: <FileSignature className="w-4 h-4" />,
      title: translateSync("Collection agreed"),
      detail: origin.festival
        ? `${translateSync("Material release agreement with")} ${translateSync(origin.festival)}${origin.country ? `, ${translateSync(origin.country)}` : ""}.`
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
      detail: `${formatCurrency(escrow.lguShare ?? 0)} ${translateSync("to the LGU")} · ${formatCurrency(escrow.charityMaintenanceShare ?? 0)} ${translateSync("to charity")}${
        escrow.ngoFundName ? ` (${translateSync(escrow.ngoFundName)})` : ""
      } ${translateSync("& app upkeep")}`,
    },
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      {/* Seal */}
      <Card className="overflow-hidden">
        <div className="bg-pine-900 text-white px-5 sm:px-8 py-7 sm:py-9">
          <div className="flex items-center gap-2 text-sm text-pine-200">
            <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
            {translateSync("Verified Impact Pass")}
          </div>
          <h1 className="mt-3 font-display text-[34px] sm:text-[44px] leading-[1.05] font-semibold text-white">{translateSync(data.product.title)}</h1>
          {origin.festival && (
            <p className="mt-3 text-white/80 max-w-xl">
              {translateSync("Made from")} {formatNumber(data.product.kgDiverted)} kg {translateSync("of material recovered after")} {translateSync(origin.festival)}
              {origin.country && <>, {translateSync(origin.country)}</>}.
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              onClick={copySerial}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-white/10 hover:bg-white/15 text-sm font-mono-data cursor-pointer transition-colors"
              aria-label={translateSync("Copy serial")}
            >
              {data.serial}
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-white/70" />}
            </button>
            {data.issuedAt && (
              <span className="text-sm text-white/60">
                {translateSync("Issued")} {fmt(data.issuedAt)}
              </span>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-line">
          <div className="p-4 sm:p-5">
            <dt className="text-xs text-ink-3">{translateSync("Diverted")}</dt>
            <dd className="tabular mt-1 font-display text-2xl font-semibold text-ink">{formatNumber(data.product.kgDiverted)} kg</dd>
          </div>
          <div className="p-4 sm:p-5">
            <dt className="text-xs text-ink-3">{translateSync("Material")}</dt>
            <dd className="mt-1 text-sm font-medium text-ink">{translateSync(origin.materialType || "—")}</dd>
          </div>
          <div className="p-4 sm:p-5">
            <dt className="text-xs text-ink-3">{translateSync("Paid to artisan")}</dt>
            <dd className="tabular mt-1 font-display text-2xl font-semibold text-ink">{formatCurrency(escrow.artisanPayout ?? 0)}</dd>
          </div>
          <div className="p-4 sm:p-5">
            <dt className="text-xs text-ink-3">{translateSync("Paid to the LGU")}</dt>
            <dd className="tabular mt-1 font-display text-2xl font-semibold text-lantern-600">{formatCurrency(escrow.lguShare ?? 0)}</dd>
          </div>
        </dl>
      </Card>

      {/* Chain of custody */}
      <Card className="p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-[28px] font-semibold text-ink">{translateSync("Chain of custody")}</h2>
            <p className="text-sm text-ink-3">{translateSync("Every step below was written to the ledger when it happened.")}</p>
          </div>
          {hasGps && (
            <a
              href={`https://www.google.com/maps?q=${gps.lat},${gps.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary", "sm", "shrink-0")}
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">{translateSync("Collection point")}</span>
              <ExternalLink className="w-3.5 h-3.5 text-ink-3" />
            </a>
          )}
        </div>
        <ProvenanceTimeline events={events} />
      </Card>

      {/* Maker + split */}
      <div className="grid md:grid-cols-5 gap-6">
        <Card className="md:col-span-2 p-5 sm:p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink font-sans">{translateSync("Maker")}</h2>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-paper-2 text-ink-2 font-semibold text-sm flex items-center justify-center shrink-0">
              {(maker.name || "A").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-ink truncate">{translateSync(maker.name || "Artisan")}</p>
              {maker.workshop && <p className="text-sm text-ink-3 truncate">{translateSync(maker.workshop)}</p>}
            </div>
          </div>
          {maker.verified !== false && (
            <Badge tone="success">
              <ShieldCheck className="w-3.5 h-3.5" />
              {translateSync("Verified cooperative")}
            </Badge>
          )}
        </Card>

        <Card className="md:col-span-3 p-5 sm:p-6 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-ink font-sans">{translateSync("Payment split")}</h2>
            <span className="tabular font-semibold text-ink">{formatCurrency(escrow.totalAmount ?? 0)}</span>
          </div>
          <EscrowBar amount={escrow.totalAmount ?? 0} ngoName={escrow.ngoFundName} compact />
        </Card>
      </div>

      {/* Technical proof */}
      {data.tamperEvidentHarvestHash && (
        <details className="group bg-surface border border-line rounded-md shadow-card">
          <summary className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 cursor-pointer list-none">
            <span>
              <span className="block text-sm font-semibold text-ink">{translateSync("Technical proof")}</span>
              <span className="block text-xs text-ink-3">{translateSync("SHA-256 hash of the original collection record")}</span>
            </span>
            <ChevronDown className="w-4 h-4 text-ink-3 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 sm:px-6 pb-5">
            <p className="font-mono-data text-xs text-ink-2 break-all bg-paper rounded-sm border border-line p-3">{data.tamperEvidentHarvestHash}</p>
            <p className="text-xs text-ink-3 mt-2">
              {translateSync("If any detail of the collection record changes, this hash no longer matches, so tampering is visible.")}
            </p>
          </div>
        </details>
      )}

      <div className="text-center pt-2">
        <Link href="/" className="text-sm text-pine-600 hover:text-pine-700">
          {translateSync("Discover more pieces on HeriTech")} →
        </Link>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading } from "@/components/translation/TranslatableText";
import {
  MapPin,
  CheckCircle2,
  QrCode,
  X,
  Navigation,
  Crosshair,
  Car,
  Footprints,
  ExternalLink,
} from "lucide-react";
import { AccessGuard } from "@/components/AccessGuard";
import { HandoverCode } from "@/components/handover/HandoverCode";
import { HandoverVerifyForm } from "@/components/handover/HandoverVerifyForm";
import { apiJson } from "@/lib/api";
import { directionsUrl } from "@/lib/googleMaps";
import { BatchMap } from "@/components/map/BatchMap";
import { useRoute } from "@/components/map/useRoute";
import { Badge, Button, Card, PageHeader, buttonClass, cn, type BadgeTone } from "@/components/ui";

interface BatchItem {
  id: string;
  title: string;
  materialType: string;
  weightKg: number;
  condition: string;
  status: "available" | "reserved" | "claimed";
  gpsLat: number;
  gpsLng: number;
  pickupAddress?: string | null;
  weightSource?: "scale" | "ai_estimate";
  alsoContains?: string[];
  imageUrl: string;
  txHash: string;
  aiInferredMaterial?: string;
  aiInferredCondition?: string;
  aiConfidence?: number | null;
  aiSource?: "gemini" | "on_device";
  agreement?: {
    festival: string;
    country: string;
  };
  scannedByOfficer?: {
    fullName: string;
    stationName?: string;
  };
  reservedByArtisanId?: string | null;
  reservedByArtisan?: {
    fullName: string;
    workshopName?: string;
  };
}

function MaterialsMapPageContent() {
  const { user } = useAuth();
  const { formatNumber, translateSync } = useTranslation();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Contextual Handover Modal State
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverTab, setHandoverTab] = useState<"artisan" | "lgu">("artisan");
  const [handoverSuccess, setHandoverSuccess] = useState<string | null>(null);

  // In-app route from the user's live position to the selected batch.
  const destLat = selectedBatch?.gpsLat;
  const destLng = selectedBatch?.gpsLng;
  const destination = useMemo(() => (destLat != null && destLng != null ? { lat: destLat, lng: destLng } : null), [destLat, destLng]);
  const nav = useRoute(destination);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const { stop: stopRoute } = nav;
  useEffect(() => stopRoute(), [selectedBatch?.id, stopRoute]);

  const showRoute = () => {
    nav.start();
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isAdmin = user?.role === "admin";
  const holdsReservation = Boolean(user && selectedBatch?.reservedByArtisanId === user.id);
  const canShowCode = holdsReservation;
  const canVerify = user?.role === "lgu" || isAdmin;

  useEffect(() => {
    apiJson<BatchItem[]>("/api/materials").then((result) => {
      if (result.success && result.data) {
        setBatches(result.data);
        setSelectedBatch(result.data[0] ?? null);
      } else {
        setActionError(result.error ?? "Couldn't load material batches.");
      }
      setLoading(false);
    });
  }, []);

  const replaceBatch = (updated: BatchItem) => {
    setBatches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedBatch((prev) => (prev?.id === updated.id ? updated : prev));
  };

  // The server records the reservation and messages the logging officer in one transaction.
  const handleReserve = async (batchId: string) => {
    setReserving(true);
    setReserveSuccess(null);
    setActionError(null);
    const result = await apiJson<BatchItem>(`/api/materials/${batchId}/reserve`, { method: "POST" });
    if (result.success && result.data) {
      replaceBatch(result.data);
      setReserveSuccess(`Batch ${batchId} is reserved for you. Show this code at the depot.`);
      // Go straight to the pickup code; it is the artisan's next step.
      setHandoverTab("artisan");
      setHandoverSuccess(null);
      setHandoverModalOpen(true);
    } else {
      setActionError(result.error ?? "Reservation failed.");
    }
    setReserving(false);
  };

  const openHandover = () => {
    setHandoverTab(canShowCode ? "artisan" : "lgu");
    setHandoverSuccess(null);
    setHandoverModalOpen(true);
  };

  const statusBadge = (status: string): { label: string; tone: BadgeTone } => {
    switch (status) {
      case "available":
        return { label: translateSync("Available"), tone: "success" };
      case "reserved":
        return { label: translateSync("Reserved"), tone: "warn" };
      case "claimed":
        return { label: translateSync("Picked up"), tone: "neutral" };
      default:
        return { label: translateSync(status), tone: "neutral" };
    }
  };

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        eyebrow={translateSync("Material map")}
        title={translateSync("Leftover material near you")}
        description={translateSync("Every batch collected after a festival, with its photo, weight and pickup point. Artisans can reserve a batch and pick it up.")}
      />

      <div ref={mapSectionRef} className="scroll-mt-24 space-y-3">
        <BatchMap
          batches={batches}
          selectedId={selectedBatch?.id ?? null}
          onSelect={(id) => {
            setSelectedBatch(batches.find((b) => b.id === id) ?? null);
            setReserveSuccess(null);
          }}
          route={nav.route?.path}
          userPosition={nav.active ? nav.position : null}
          recenterSignal={recenterSignal}
        />

        {nav.active && selectedBatch && (
          <div className="rounded-lg border border-line bg-surface p-4 shadow-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-ink-3">
                  {translateSync("Route to")} {selectedBatch.id}
                  {selectedBatch.pickupAddress ? ` · ${selectedBatch.pickupAddress}` : ""}
                </p>
                <p className="text-lg font-semibold text-ink tabular">
                  {nav.route ? `${nav.route.duration} · ${nav.route.distance}` : nav.loading ? translateSync("Finding the best route…") : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-md border border-line overflow-hidden" role="group" aria-label={translateSync("Travel mode")}>
                  {([
                    ["DRIVING", Car, "Drive"],
                    ["WALKING", Footprints, "Walk"],
                  ] as const).map(([mode, Icon, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => nav.setMode(mode)}
                      aria-pressed={nav.mode === mode}
                      className={`inline-flex items-center gap-1.5 px-3 h-9 text-xs font-medium cursor-pointer ${nav.mode === mode ? "bg-pine-700 text-white" : "bg-surface text-ink-2 hover:bg-paper-2"}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {translateSync(label)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setRecenterSignal((n) => n + 1)}
                  disabled={!nav.position}
                  className={buttonClass("secondary", "sm")}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  {translateSync("Recenter")}
                </button>
                <button type="button" onClick={nav.stop} className={buttonClass("ghost", "sm")}>
                  <X className="w-3.5 h-3.5" />
                  {translateSync("End route")}
                </button>
              </div>
            </div>

            {nav.error && (
              <p role="alert" className="text-xs text-danger">
                {translateSync(nav.error)}
              </p>
            )}

            {nav.route && nav.route.steps.length > 0 && (
              <ol className="max-h-56 overflow-y-auto divide-y divide-line rounded-md border border-line text-sm">
                {nav.route.steps.map((step, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 px-3 py-2">
                    <span className="text-ink-2">
                      <span className="tabular text-ink-3 mr-2">{i + 1}.</span>
                      {step.instruction}
                    </span>
                    <span className="shrink-0 tabular text-xs text-ink-3">{step.distance}</span>
                  </li>
                ))}
              </ol>
            )}

            <a
              href={directionsUrl(selectedBatch.gpsLat, selectedBatch.gpsLng)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-ink-3 underline underline-offset-2 hover:text-ink"
            >
              {translateSync("Open in the Google Maps app instead")}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Split Map View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
        {/* Left Col: Interactive Batch List (5 cols) */}
        <div className="lg:col-span-5 space-y-3 overflow-y-auto max-h-[750px] pr-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-line rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            batches.map((batch) => {
              const isSelected = selectedBatch?.id === batch.id;
              return (
                <button
                  type="button"
                  key={batch.id}
                  onClick={() => {
                    setSelectedBatch(batch);
                    setReserveSuccess(null);
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border bg-surface transition-colors cursor-pointer",
                    isSelected ? "border-pine-500 ring-1 ring-pine-500 shadow-card" : "border-line hover:border-line-strong"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-mono-data text-ink-3">{batch.id}</span>
                      <h3 className="text-sm font-semibold text-ink mt-0.5">
                        <TranslatableText>{batch.title}</TranslatableText>
                      </h3>
                    </div>
                    <Badge tone={statusBadge(batch.status).tone} className="shrink-0">
                      {statusBadge(batch.status).label}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-ink-3">
                    <span className="flex items-center gap-1 min-w-0 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {batch.pickupAddress || <TranslatableText>{batch.agreement?.festival || "Festival"}</TranslatableText>}
                    </span>
                    <span className="tabular font-semibold text-ink">{formatNumber(batch.weightKg)} kg</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Col: Batch Detail & Map Telemetry (7 cols) */}
        <div className="lg:col-span-7">
          {selectedBatch ? (
            <Card className="p-5 sm:p-6 space-y-5 lg:sticky lg:top-24">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-mono-data text-ink-3">{selectedBatch.id}</span>
                  <h2 className="font-display text-[28px] leading-tight font-semibold text-ink mt-1">
                    <TranslatableText>{selectedBatch.title}</TranslatableText>
                  </h2>
                  <p className="text-sm text-ink-3 mt-0.5">
                    <TranslatableText>{selectedBatch.agreement?.festival || ""}</TranslatableText>
                    {selectedBatch.agreement?.country && <> · <TranslatableText>{selectedBatch.agreement.country}</TranslatableText></>}
                  </p>
                </div>
                <Badge tone={statusBadge(selectedBatch.status).tone} className="shrink-0">
                  {statusBadge(selectedBatch.status).label}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <figure className="space-y-1.5">
                  <div className="aspect-video sm:aspect-square rounded-md bg-paper-2 overflow-hidden border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element -- batch photos are data URLs or Storage URLs */}
                    <img src={selectedBatch.imageUrl} alt={selectedBatch.title} className="w-full h-full object-cover" />
                  </div>
                  <figcaption className="text-xs text-ink-3 text-center">{translateSync("Photo at collection")}</figcaption>
                </figure>

                <div className="flex flex-col justify-center gap-3 rounded-md border border-line bg-paper p-4">
                  <p className="flex items-center gap-1.5 text-xs text-ink-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {translateSync("Pickup point")}
                  </p>
                  <p className="text-sm font-medium text-ink">
                    {selectedBatch.pickupAddress || `${selectedBatch.gpsLat.toFixed(4)}°, ${selectedBatch.gpsLng.toFixed(4)}°`}
                  </p>
                  <Button variant={nav.active ? "secondary" : "primary"} size="sm" className="w-full" onClick={nav.active ? nav.stop : showRoute}>
                    <Navigation className="w-3.5 h-3.5" />
                    {translateSync(nav.active ? "End route" : "Show route")}
                  </Button>
                </div>
              </div>

              <dl className="divide-y divide-line rounded-md border border-line text-sm">
                {[
                  {
                    term: selectedBatch.weightSource === "ai_estimate" ? "Weight (AI estimate)" : "Weight",
                    value: `${selectedBatch.weightSource === "ai_estimate" ? "~" : ""}${formatNumber(selectedBatch.weightKg)} kg`,
                  },
                  { term: "Condition", value: translateSync(selectedBatch.condition) },
                  {
                    term: selectedBatch.aiSource === "on_device" ? "Checked on-device" : "Checked by Gemini",
                    value: [
                      translateSync(selectedBatch.aiInferredMaterial || selectedBatch.materialType),
                      selectedBatch.alsoContains?.length
                        ? `${translateSync("also")} ${selectedBatch.alsoContains.map((c) => translateSync(c).toLowerCase()).join(", ")}`
                        : "",
                      // Only the on-device model gives a real class probability; Gemini's self-rating is not shown.
                      selectedBatch.aiSource === "on_device" && selectedBatch.aiConfidence != null ? `${Math.round(selectedBatch.aiConfidence * 100)}%` : "",
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  },
                  { term: "Logged by", value: selectedBatch.scannedByOfficer?.fullName || translateSync("Local government officer") },
                ].map((row) => (
                  <div key={row.term} className="flex items-start justify-between gap-4 px-3.5 py-2.5">
                    <dt className="text-ink-3 shrink-0">{translateSync(row.term)}</dt>
                    <dd className="text-right font-medium text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <details className="rounded-md border border-line bg-paper px-3.5 py-2.5 text-xs">
                <summary className="cursor-pointer text-ink-2 font-medium">{translateSync("Tamper check")}</summary>
                <p className="mt-1.5 text-ink-3">{translateSync("This code changes if anyone edits where, when or how much was collected.")}</p>
                <p className="mt-1 font-mono-data text-ink-2 break-all" title="SHA-256">{selectedBatch.txHash}</p>
              </details>

              {reserveSuccess && (
                <p role="status" className="flex items-center gap-2 rounded-md border border-success/20 bg-success-100 p-3 text-sm text-success">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <TranslatableText>{reserveSuccess}</TranslatableText>
                </p>
              )}
              {actionError && (
                <p role="alert" className="rounded-md bg-danger-100 p-3 text-sm text-danger">
                  {translateSync(actionError)}
                </p>
              )}

              {selectedBatch.status === "available" ? (
                user?.role === "artisan" || user?.role === "admin" ? (
                  <Button size="lg" className="w-full" onClick={() => handleReserve(selectedBatch.id)} loading={reserving}>
                    {reserving ? translateSync("Reserving…") : translateSync("Reserve this batch")}
                  </Button>
                ) : (
                  <p className="rounded-md border border-line bg-paper p-3 text-sm text-ink-2">
                    {translateSync("Sign in as an artisan to reserve batches.")}
                  </p>
                )
              ) : selectedBatch.status === "reserved" ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-warn/20 bg-warn-100 p-3.5 text-sm text-warn">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {translateSync("Reserved by")} {selectedBatch.reservedByArtisan?.workshopName || selectedBatch.reservedByArtisan?.fullName || translateSync("an artisan")}
                    </p>
                    <p className="text-xs mt-0.5">
                      {translateSync(
                        holdsReservation
                          ? "Open the pickup screen to show your code at the collection point."
                          : "Waiting for the artisan to pick it up at the collection point."
                      )}
                    </p>
                  </div>
                  {(canShowCode || canVerify) && (
                    <Button size="sm" variant="secondary" className="shrink-0" onClick={openHandover}>
                      <QrCode className="w-4 h-4" />
                      {translateSync("Open pickup")}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="flex items-center gap-2 rounded-md border border-line bg-paper p-3 text-sm text-ink-2">
                  <CheckCircle2 className="w-4 h-4 text-pine-500 shrink-0" />
                  {translateSync("Picked up by an artisan. Finished pieces appear in the shop.")}
                </p>
              )}
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-12 bg-surface rounded-lg border border-line text-center text-ink-3">
              <TranslatableText>Select a batch to see its details</TranslatableText>
            </div>
          )}
        </div>
      </div>

      {/* CONTEXTUAL REAL SCANNABLE QR HANDOVER MODAL */}
      {handoverModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-pop border border-line relative">
            <button
              onClick={() => {
                setHandoverModalOpen(false);
                setHandoverSuccess(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full text-ink-3 hover:text-ink-2 hover:bg-paper-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-line pb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-pine-600">
                <QrCode className="w-4 h-4" />
                <TranslatableText>QR handover</TranslatableText>
              </div>
              <TranslatableHeading level={3} className="text-xl font-semibold text-ink mt-1">
                Pickup handover: {selectedBatch.id}
              </TranslatableHeading>
            </div>

            {/* Mode Switcher, only when this user can do both sides */}
            {canShowCode && canVerify && (
              <div className="flex p-1 bg-paper rounded-lg border border-line">
                <button
                  onClick={() => setHandoverTab("artisan")}
                  className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                    handoverTab === "artisan" ? "bg-pine-700 text-white shadow-card" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  <TranslatableText>Artisan: show code</TranslatableText>
                </button>
                <button
                  onClick={() => setHandoverTab("lgu")}
                  className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                    handoverTab === "lgu" ? "bg-pine-700 text-white shadow-card" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  <TranslatableText>Officer: scan & release</TranslatableText>
                </button>
              </div>
            )}

            {handoverSuccess ? (
              <div className="p-6 bg-pine-50 border border-pine-200 rounded-lg text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-pine-500 mx-auto" />
                <TranslatableHeading level={4} className="text-base font-bold text-ink">Picked up</TranslatableHeading>
                <p className="text-xs text-pine-700"><TranslatableText>{handoverSuccess}</TranslatableText></p>
                <button
                  onClick={() => {
                    setHandoverModalOpen(false);
                    setHandoverSuccess(null);
                  }}
                  className="px-5 py-2 rounded-md bg-pine-700 text-white text-xs font-bold"
                >
                  <TranslatableText>Done</TranslatableText>
                </button>
              </div>
            ) : handoverTab === "artisan" && canShowCode ? (
              <HandoverCode batch={selectedBatch} />
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-paper rounded-md space-y-1 text-xs">
                  <TranslatableText className="text-xs text-ink-3 font-bold">Batch awaiting pickup</TranslatableText>
                  <p className="font-bold text-ink"><TranslatableText>{selectedBatch.title}</TranslatableText></p>
                  <p className="font-mono-data text-ink-3">{formatNumber(selectedBatch.weightKg)} kg <TranslatableText>{selectedBatch.materialType}</TranslatableText></p>
                </div>
                <HandoverVerifyForm
                  onVerified={(result, message) => {
                    setHandoverSuccess(message);
                    const claimed = batches.find((b) => b.id === result.batchId);
                    if (claimed) replaceBatch({ ...claimed, status: "claimed" });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaterialsMapPage() {
  return (
    <AccessGuard allowedRoles={["artisan", "lgu", "admin"]} pageTitle="Material map">
      <MaterialsMapPageContent />
    </AccessGuard>
  );
}

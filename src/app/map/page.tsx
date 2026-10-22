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
import { LanternString } from "@/components/ProvenanceTimeline";
import { SuccessBurst } from "@/components/motion/SuccessBurst";
import { Badge, Button, Card, Dialog, EmptyState, PageHeader, buttonClass, cn, useMediaQuery, type BadgeTone } from "@/components/ui";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [reserving, setReserving] = useState(false);
  const [releasing, setReleasing] = useState(false);
  // Status chips above the list; the map always shows every batch.
  const [statusFilter, setStatusFilter] = useState<"all" | BatchItem["status"]>("all");
  // The batch whose Reserve button is showing its "Reserved" confirmation before the pickup code opens.
  const [justReserved, setJustReserved] = useState<string | null>(null);
  const [reserveSuccess, setReserveSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Phones show the selected batch in a bottom sheet; desktop keeps the side-by-side detail card.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [sheetOpen, setSheetOpen] = useState(false);

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
    setSheetOpen(false);
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
        setLoadError(result.error ?? "Couldn't load material batches.");
      }
      setLoading(false);
    });
  }, []);

  const replaceBatch = (updated: BatchItem) => {
    setBatches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedBatch((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const selectBatch = (batch: BatchItem | null) => {
    setSelectedBatch(batch);
    setReserveSuccess(null);
    setActionError(null);
    if (batch && !isDesktop) setSheetOpen(true);
  };

  // The server records the reservation and messages the logging officer in one transaction.
  const handleReserve = async (batchId: string) => {
    setReserving(true);
    setReserveSuccess(null);
    setActionError(null);
    const result = await apiJson<BatchItem>(`/api/materials/${batchId}/reserve`, { method: "POST" });
    setReserving(false);
    if (result.success && result.data) {
      const reserved = result.data;
      // Let the button glow "Reserved" for a beat, then go straight to the pickup code: the artisan's next step.
      setJustReserved(batchId);
      setTimeout(() => {
        setJustReserved(null);
        replaceBatch(reserved);
        setReserveSuccess(`Batch ${batchId} is reserved for you. Show this code at the depot.`);
        setSheetOpen(false);
        setHandoverTab("artisan");
        setHandoverSuccess(null);
        setHandoverModalOpen(true);
      }, 750);
    } else {
      setActionError(result.error ?? "Reservation failed.");
    }
  };

  // The holder cancels their own reservation; an admin can release anyone's.
  const handleRelease = async (batchId: string) => {
    setReleasing(true);
    setReserveSuccess(null);
    setActionError(null);
    const result = await apiJson<BatchItem>(`/api/materials/${batchId}/release`, { method: "POST" });
    setReleasing(false);
    if (result.success && result.data) {
      replaceBatch(result.data);
      setReserveSuccess(result.message ?? `Batch ${batchId} is available again.`);
    } else {
      setActionError(result.error ?? "Couldn't release the reservation.");
    }
  };

  const openHandover = () => {
    setSheetOpen(false);
    setHandoverTab(canShowCode ? "artisan" : "lgu");
    setHandoverSuccess(null);
    setHandoverModalOpen(true);
  };

  const closeHandover = () => {
    setHandoverModalOpen(false);
    setHandoverSuccess(null);
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

  const visibleBatches = statusFilter === "all" ? batches : batches.filter((b) => b.status === statusFilter);

  /** Photo, pickup point, facts and tamper check: shared by the desktop card and the phone sheet. */
  const journeySteps = [translateSync("Logged"), translateSync("Reserved"), translateSync("Picked up"), translateSync("In the shop")];
  const reachedStep = (status: BatchItem["status"]) => (status === "claimed" ? 2 : status === "reserved" ? 1 : 0);

  const renderDetail = (batch: BatchItem) => (
    <>
      <LanternString steps={journeySteps} reached={reachedStep(batch.status)} label={translateSync("Batch journey")} className="py-1" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <figure className="space-y-1.5">
          <div className="aspect-video sm:aspect-square rounded-md bg-paper-2 overflow-hidden border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- batch photos are data URLs or Storage URLs */}
            <img src={batch.imageUrl} alt={batch.title} className="w-full h-full object-cover" />
          </div>
          <figcaption className="text-xs text-ink-3 text-center">{translateSync("Photo at collection")}</figcaption>
        </figure>

        <div className="flex flex-col justify-center gap-3 rounded-md border border-line bg-paper p-4">
          <p className="flex items-center gap-1.5 text-sm text-ink-3">
            <MapPin className="w-4 h-4" />
            {translateSync("Pickup point")}
          </p>
          <p className="text-[15px] font-medium text-ink">
            {batch.pickupAddress || `${batch.gpsLat.toFixed(4)}°, ${batch.gpsLng.toFixed(4)}°`}
          </p>
          <Button variant={nav.active ? "secondary" : "primary"} size="sm" className="w-full" onClick={nav.active ? nav.stop : showRoute}>
            <Navigation className="w-4 h-4" />
            {translateSync(nav.active ? "End route" : "Show route")}
          </Button>
        </div>
      </div>

      <dl className="divide-y divide-line rounded-md border border-line text-sm">
        {[
          {
            term: batch.weightSource === "ai_estimate" ? "Weight (AI estimate)" : "Weight",
            value: `${batch.weightSource === "ai_estimate" ? "~" : ""}${formatNumber(batch.weightKg)} kg`,
          },
          { term: "Condition", value: translateSync(batch.condition) },
          {
            term: batch.aiSource === "on_device" ? "Checked on-device" : "Checked by Gemini",
            value: [
              translateSync(batch.aiInferredMaterial || batch.materialType),
              batch.alsoContains?.length ? `${translateSync("also")} ${batch.alsoContains.map((c) => translateSync(c).toLowerCase()).join(", ")}` : "",
              // Only the on-device model gives a real class probability; Gemini's self-rating is not shown.
              batch.aiSource === "on_device" && batch.aiConfidence != null ? `${Math.round(batch.aiConfidence * 100)}%` : "",
            ]
              .filter(Boolean)
              .join(" · "),
          },
          { term: "Logged by", value: batch.scannedByOfficer?.fullName || translateSync("Local government officer") },
        ].map((row) => (
          <div key={row.term} className="flex items-start justify-between gap-4 px-3.5 py-2.5">
            <dt className="text-ink-3 shrink-0">{translateSync(row.term)}</dt>
            <dd className="text-right font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>

      <details className="rounded-md border border-line bg-paper text-sm">
        <summary className="cursor-pointer text-ink-2 font-medium px-3.5 min-h-11 flex items-center">{translateSync("Tamper check")}</summary>
        <div className="px-3.5 pb-3">
          <p className="text-ink-3">
            {translateSync("A fingerprint of where, when and how much was collected. Each Impact Pass from this batch recomputes it to show the record wasn't edited.")}
          </p>
          <p className="mt-1 font-mono-data text-xs text-ink-2 break-all" title="SHA-256">
            {batch.txHash}
          </p>
        </div>
      </details>
    </>
  );

  /** Reserve, pickup or status, plus feedback for the last action. Pinned in the phone sheet's footer. */
  const renderAction = (batch: BatchItem) => (
    <div className="space-y-3">
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

      {justReserved === batch.id ? (
        <div role="status" className={buttonClass("primary", "lg", "w-full just-done bg-success-solid hover:bg-success-solid cursor-default")}>
          <CheckCircle2 className="w-5 h-5" />
          {translateSync("Reserved")}
        </div>
      ) : batch.status === "available" ? (
        user?.role === "artisan" ? (
          <Button variant="accent" size="lg" className="w-full" onClick={() => handleReserve(batch.id)} loading={reserving}>
            {reserving ? translateSync("Reserving…") : translateSync("Reserve this batch")}
          </Button>
        ) : (
          <p className="rounded-md border border-line bg-paper p-3 text-sm text-ink-2">
            {translateSync(
              isAdmin
                ? "Artisans reserve batches. As an admin you can release a reservation that is stuck."
                : "Artisans reserve batches. Once one is reserved, you can verify its pickup here."
            )}
          </p>
        )
      ) : batch.status === "reserved" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warn/20 bg-warn-100 p-3.5 text-sm text-warn">
          <div className="min-w-0 flex-1 basis-48">
            <p className="font-medium">
              {translateSync("Reserved by")} {batch.reservedByArtisan?.workshopName || batch.reservedByArtisan?.fullName || translateSync("an artisan")}
            </p>
            <p className="mt-0.5">
              {translateSync(
                holdsReservation ? "Open the pickup screen to show your code at the collection point." : "Waiting for the artisan to pick it up at the collection point."
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0 grow sm:grow-0">
            {(canShowCode || canVerify) && (
              <Button size="sm" variant="secondary" className="grow sm:grow-0" onClick={openHandover}>
                <QrCode className="w-4 h-4" />
                {translateSync("Open pickup")}
              </Button>
            )}
            {(holdsReservation || isAdmin) && (
              <Button size="sm" variant="ghost" className="grow sm:grow-0" onClick={() => handleRelease(batch.id)} loading={releasing}>
                <X className="w-4 h-4" />
                {translateSync(holdsReservation ? "Cancel reservation" : "Release reservation")}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-md border border-line bg-paper p-3 text-sm text-ink-2">
          <CheckCircle2 className="w-4 h-4 text-brand-2 shrink-0" />
          {translateSync("Picked up by an artisan. Finished pieces appear in the shop.")}
        </p>
      )}
    </div>
  );

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
          onSelect={(id) => selectBatch(batches.find((b) => b.id === id) ?? null)}
          route={nav.route?.path}
          userPosition={nav.active ? nav.position : null}
          recenterSignal={recenterSignal}
        />

        {nav.active && selectedBatch && (
          <div className="rounded-lg border border-line bg-surface p-4 shadow-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink-3">
                  {translateSync("Route to")} {selectedBatch.id}
                  {selectedBatch.pickupAddress ? ` · ${selectedBatch.pickupAddress}` : ""}
                </p>
                <p className="text-lg font-semibold text-ink tabular">
                  {nav.route ? `${nav.route.duration} · ${nav.route.distance}` : nav.loading ? translateSync("Finding the best route…") : "—"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 h-10 text-sm font-medium cursor-pointer",
                        nav.mode === mode ? "bg-pine-700 text-white" : "bg-surface text-ink-2 hover:bg-paper-2"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {translateSync(label)}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setRecenterSignal((n) => n + 1)} disabled={!nav.position} className={buttonClass("secondary", "sm")}>
                  <Crosshair className="w-4 h-4" />
                  {translateSync("Recenter")}
                </button>
                <button type="button" onClick={nav.stop} className={buttonClass("ghost", "sm")}>
                  <X className="w-4 h-4" />
                  {translateSync("End route")}
                </button>
              </div>
            </div>

            {nav.error && (
              <p role="alert" className="text-sm text-danger">
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
              className="inline-flex items-center gap-1 min-h-10 text-sm text-ink-3 underline underline-offset-2 hover:text-ink"
            >
              {translateSync("Open in the Google Maps app instead")}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {loadError && (
        <p role="alert" className="rounded-md bg-danger-100 p-3 text-sm text-danger">
          {translateSync(loadError)}
        </p>
      )}

      {/* Split view on desktop; on phones the list is the page and the detail opens as a sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 lg:min-h-[600px]">
        <div className="lg:col-span-5 space-y-3 lg:overflow-y-auto lg:max-h-[750px] lg:pr-2">
          <h2 className="lg:hidden text-base font-semibold text-ink font-sans">
            {translateSync("Batches")}
            {!loading && <span className="text-ink-3 font-normal"> · {visibleBatches.length}</span>}
          </h2>
          {!loading && batches.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0" role="group" aria-label={translateSync("Filter batches")}>
              {(["all", "available", "reserved", "claimed"] as const).map((s) => {
                const count = s === "all" ? batches.length : batches.filter((b) => b.status === s).length;
                const active = statusFilter === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    aria-pressed={active}
                    className={cn(
                      "shrink-0 min-h-10 px-3.5 rounded-full text-sm border transition-colors cursor-pointer",
                      active ? "bg-pine-700 border-pine-700 text-white" : "bg-surface border-line text-ink-2 hover:border-pine-300"
                    )}
                  >
                    {s === "all" ? translateSync("All") : statusBadge(s).label} · {count}
                  </button>
                );
              })}
            </div>
          )}
          {loading ? (
            <div className="space-y-3" role="status" aria-label={translateSync("Loading batches")}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-paper-2 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : batches.length === 0 && !loadError ? (
            <EmptyState
              icon={<MapPin className="w-5 h-5" />}
              title={translateSync("No batches yet")}
              description={translateSync("Batches appear here once a local government officer scans and logs leftover festival material.")}
            />
          ) : visibleBatches.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-ink-3">
              {translateSync("No batches with this status.")}
            </p>
          ) : (
            visibleBatches.map((batch) => {
              const isSelected = isDesktop && selectedBatch?.id === batch.id;
              return (
                <button
                  type="button"
                  key={batch.id}
                  onClick={() => selectBatch(batch)}
                  aria-pressed={isDesktop ? isSelected : undefined}
                  aria-haspopup={isDesktop ? undefined : "dialog"}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border bg-surface transition-colors cursor-pointer",
                    isSelected ? "border-pine-500 ring-1 ring-pine-500 shadow-card" : "border-line hover:border-line-strong"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-mono-data text-ink-3">{batch.id}</span>
                      <h3 className="text-[15px] font-semibold text-ink mt-0.5">
                        <TranslatableText>{batch.title}</TranslatableText>
                      </h3>
                    </div>
                    <Badge tone={statusBadge(batch.status).tone} className="shrink-0">
                      {statusBadge(batch.status).label}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-ink-3">
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

        {/* Desktop detail */}
        <div className="hidden lg:block lg:col-span-7">
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
                    {selectedBatch.agreement?.country && (
                      <>
                        {" "}
                        · <TranslatableText>{selectedBatch.agreement.country}</TranslatableText>
                      </>
                    )}
                  </p>
                </div>
                <Badge tone={statusBadge(selectedBatch.status).tone} className="shrink-0">
                  {statusBadge(selectedBatch.status).label}
                </Badge>
              </div>
              {renderDetail(selectedBatch)}
              {renderAction(selectedBatch)}
            </Card>
          ) : (
            !loading && (
              <div className="h-full flex items-center justify-center p-12 bg-surface rounded-lg border border-line text-center text-ink-3">
                <TranslatableText>Select a batch to see its details</TranslatableText>
              </div>
            )
          )}
        </div>
      </div>

      {/* Phone detail sheet, with the main action pinned in its footer */}
      {selectedBatch && (
        <Dialog
          open={sheetOpen && !isDesktop}
          onClose={() => setSheetOpen(false)}
          closeLabel={translateSync("Close")}
          title={<TranslatableText>{selectedBatch.title}</TranslatableText>}
          description={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Badge tone={statusBadge(selectedBatch.status).tone}>{statusBadge(selectedBatch.status).label}</Badge>
              <span className="font-mono-data">{selectedBatch.id}</span>
              {selectedBatch.agreement?.festival && <TranslatableText>{selectedBatch.agreement.festival}</TranslatableText>}
            </span>
          }
          footer={renderAction(selectedBatch)}
        >
          <div className="space-y-5">{renderDetail(selectedBatch)}</div>
        </Dialog>
      )}

      {/* QR pickup handover */}
      {selectedBatch && (
        <Dialog
          open={handoverModalOpen}
          onClose={closeHandover}
          closeLabel={translateSync("Close")}
          title={translateSync("Pickup handover")}
          description={
            <span className="inline-flex items-center gap-1.5">
              <QrCode className="w-4 h-4" />
              <span className="font-mono-data">{selectedBatch.id}</span>
            </span>
          }
        >
          <div className="space-y-5">
            {/* Mode Switcher, only when this user can do both sides */}
            {canShowCode && canVerify && (
              <div className="flex p-1 bg-paper rounded-lg border border-line" role="group" aria-label={translateSync("Pickup role")}>
                {([
                  ["artisan", "Artisan: show code"],
                  ["lgu", "Officer: scan & release"],
                ] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setHandoverTab(tab)}
                    aria-pressed={handoverTab === tab}
                    className={cn(
                      "flex-1 min-h-10 px-2 rounded-md text-sm font-semibold transition-all cursor-pointer",
                      handoverTab === tab ? "bg-pine-700 text-white shadow-card" : "text-ink-2 hover:text-ink"
                    )}
                  >
                    {translateSync(label)}
                  </button>
                ))}
              </div>
            )}

            {handoverSuccess ? (
              <div className="p-6 bg-pine-50 border border-brand-line rounded-lg text-center space-y-3" role="status">
                <SuccessBurst size={64} scraps className="mx-auto" />
                <TranslatableHeading level={3} className="text-lg font-semibold text-ink font-sans">
                  Picked up
                </TranslatableHeading>
                <p className="text-sm text-brand">
                  <TranslatableText>{handoverSuccess}</TranslatableText>
                </p>
                <Button onClick={closeHandover}>{translateSync("Done")}</Button>
              </div>
            ) : handoverTab === "artisan" && canShowCode ? (
              <HandoverCode batch={selectedBatch} />
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-paper rounded-md space-y-1 text-sm">
                  <TranslatableText className="text-ink-3">Batch awaiting pickup</TranslatableText>
                  <p className="font-semibold text-ink">
                    <TranslatableText>{selectedBatch.title}</TranslatableText>
                  </p>
                  <p className="font-mono-data text-ink-3">
                    {formatNumber(selectedBatch.weightKg)} kg <TranslatableText>{selectedBatch.materialType}</TranslatableText>
                  </p>
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
        </Dialog>
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

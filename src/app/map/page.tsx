"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from "@/components/translation/TranslatableText";
import {
  MapPin,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  X,
} from "lucide-react";
import { AccessGuard } from "@/components/AccessGuard";
import { HandoverCode } from "@/components/handover/HandoverCode";
import { HandoverVerifyForm } from "@/components/handover/HandoverVerifyForm";
import { apiJson } from "@/lib/api";
import { directionsUrl } from "@/lib/googleMaps";
import { BatchMap } from "@/components/map/BatchMap";
import { buttonClass } from "@/components/ui";

interface BatchItem {
  id: string;
  title: string;
  materialType: string;
  weightKg: number;
  condition: string;
  status: "available" | "reserved" | "claimed";
  gpsLat: number;
  gpsLng: number;
  imageUrl: string;
  txHash: string;
  aiInferredMaterial?: string;
  aiInferredCondition?: string;
  aiConfidence?: number;
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

  const getStatusPill = (status: string) => {
    switch (status) {
      case "available":
        return { label: translateSync("Available for artisans"), bg: "bg-pine-100 text-pine-700 border-pine-300" };
      case "reserved":
        return { label: translateSync("Reserved, awaiting QR handover"), bg: "bg-warn-100 text-warn border-warn/20" };
      case "claimed":
        return { label: translateSync("Claimed, in crafting"), bg: "bg-pine-100 text-pine-700 border-pine-300" };
      default:
        return { label: translateSync(status.toUpperCase()), bg: "bg-paper-2 text-ink" };
    }
  };

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-pine-500">
            <Sparkles className="w-3.5 h-3.5" />
            <TranslatableText>Harvest map</TranslatableText>
          </div>
          <TranslatableHeading level={1} className="font-display text-4xl sm:text-[44px] leading-[1.05] font-semibold text-ink mt-2">
            Material harvest registry
          </TranslatableHeading>
          <TranslatableParagraph className="text-base text-ink-2 mt-2 max-w-2xl">
            Inspect raw festival waste logged across Asia with GPS and AI confidence scores. Artisans can reserve batches for pickup.
          </TranslatableParagraph>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold">
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-pine-50 text-pine-700 border border-pine-200">
            <span className="w-2 h-2 rounded-full bg-pine-500"></span>
            <TranslatableText>Available</TranslatableText>
          </span>
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-warn-100 text-warn border border-warn/20">
            <span className="w-2 h-2 rounded-full bg-warn"></span>
            <TranslatableText>Reserved (QR Pending)</TranslatableText>
          </span>
        </div>
      </div>

      <BatchMap
        batches={batches}
        selectedId={selectedBatch?.id ?? null}
        onSelect={(id) => {
          setSelectedBatch(batches.find((b) => b.id === id) ?? null);
          setReserveSuccess(null);
        }}
      />

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
                <div
                  key={batch.id}
                  onClick={() => {
                    setSelectedBatch(batch);
                    setReserveSuccess(null);
                  }}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-surface border-pine-500 shadow-card ring-1 ring-pine-500"
                      : "bg-surface/80 border-line hover:border-line-strong"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-mono-data text-ink-3">
                        {batch.id}
                      </span>
                      <h3 className="text-sm font-bold text-ink mt-0.5"><TranslatableText>{batch.title}</TranslatableText></h3>
                    </div>
                    <span
                      className={`shrink-0 whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full border ${
                        getStatusPill(batch.status).bg
                      }`}
                    >
                      {getStatusPill(batch.status).label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-ink-2">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-pine-600" />
                      <span>
                        <TranslatableText>{batch.agreement?.festival || "Festival"}</TranslatableText>
                        {batch.agreement?.country && <> · <TranslatableText>{batch.agreement.country}</TranslatableText></>}
                      </span>
                    </span>
                    <span className="tabular font-semibold text-ink">
                      {formatNumber(batch.weightKg)} kg
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Batch Detail & Map Telemetry (7 cols) */}
        <div className="lg:col-span-7">
          {selectedBatch ? (
            <div className="bg-surface rounded-lg border border-line p-6 space-y-6 shadow-card sticky top-24">
              {/* Batch Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <span className="text-xs font-mono-data text-ink-3">{selectedBatch.id}</span>
                  <h2 className="font-display text-[28px] leading-tight font-semibold text-ink mt-1"><TranslatableText>{selectedBatch.title}</TranslatableText></h2>
                  <p className="text-sm text-ink-3 mt-0.5">
                    <TranslatableText>{selectedBatch.agreement?.festival}</TranslatableText> • <TranslatableText>{selectedBatch.agreement?.country}</TranslatableText>
                  </p>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border self-start ${
                    getStatusPill(selectedBatch.status).bg
                  }`}
                >
                  {getStatusPill(selectedBatch.status).label}
                </span>
              </div>

              {/* Harvest Photo & Live Google Maps View */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="aspect-video sm:aspect-square rounded-lg bg-paper-2 overflow-hidden border border-line">
                    <img
                      src={selectedBatch.imageUrl}
                      alt={selectedBatch.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <TranslatableText className="text-xs text-ink-3 font-medium block text-center">
                    Field Origin Photograph
                  </TranslatableText>
                </div>

                <div className="flex flex-col justify-center gap-3 rounded-lg border border-line bg-paper p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-ink-3">
                    <MapPin className="w-3.5 h-3.5 text-pine-600" />
                    {translateSync("Collection depot")}
                  </p>
                  <p className="font-mono-data text-xs text-ink-2">
                    {selectedBatch.gpsLat.toFixed(4)}°, {selectedBatch.gpsLng.toFixed(4)}°
                  </p>
                  <a
                    href={directionsUrl(selectedBatch.gpsLat, selectedBatch.gpsLng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("secondary", "sm", "w-full")}
                  >
                    {translateSync("Directions in Google Maps")}
                  </a>
                </div>
              </div>

              {/* Harvest Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-paper rounded-md space-y-1">
                  <TranslatableText className="text-xs text-ink-3 font-bold">
                    Scale Measurement
                  </TranslatableText>
                  <p className="text-base font-semibold text-ink font-mono-data">
                    {formatNumber(selectedBatch.weightKg)} <span className="text-xs font-normal">kg</span>
                  </p>
                  <span className="text-xs text-ink-3 block">
                    <TranslatableText>Condition</TranslatableText>: <strong><TranslatableText>{selectedBatch.condition}</TranslatableText></strong>
                  </span>
                </div>

                <div className="p-3 bg-paper rounded-md space-y-1">
                  <TranslatableText className="text-xs text-ink-3 font-bold">
                    Gemini AI Vision
                  </TranslatableText>
                  <p className="font-semibold text-ink truncate">
                    <TranslatableText>{selectedBatch.aiInferredMaterial || selectedBatch.materialType}</TranslatableText>
                  </p>
                  <div className="flex items-center space-x-1 text-pine-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      <TranslatableText>Confidence</TranslatableText>:{" "}
                      <strong>
                        {selectedBatch.aiConfidence ? `${Math.round(selectedBatch.aiConfidence * 100)}%` : "95%"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-paper rounded-md space-y-1">
                  <TranslatableText className="text-xs text-ink-3 font-bold">
                    GPS Coordinates
                  </TranslatableText>
                  <p className="font-mono-data text-xs text-ink">
                    {selectedBatch.gpsLat.toFixed(4)}° N, {selectedBatch.gpsLng.toFixed(4)}° E
                  </p>
                  <span className="text-xs text-ink-3 block truncate">
                    <TranslatableText>Officer</TranslatableText>: <TranslatableText>{selectedBatch.scannedByOfficer?.fullName || "Field Officer"}</TranslatableText>
                  </span>
                </div>
              </div>

              {/* Origin fingerprint (SHA-256 of the collection record) */}
              <div className="p-3 bg-paper rounded-md border border-line text-xs space-y-1">
                <p className="font-bold text-ink-3">{translateSync("Origin fingerprint")}</p>
                <p className="text-ink-3">{translateSync("Changes if anyone edits where, when or how much was collected.")}</p>
                <p className="font-mono-data text-ink-2 break-all" title="SHA-256">{selectedBatch.txHash}</p>
              </div>

              {/* Success Notification */}
              {reserveSuccess && (
                <div className="p-3 bg-pine-50 border border-pine-200 rounded-md text-xs font-semibold text-pine-700 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-pine-500" />
                  <span><TranslatableText>{reserveSuccess}</TranslatableText></span>
                </div>
              )}
              {actionError && (
                <p role="alert" className="p-3 bg-danger-100 rounded-md text-xs font-semibold text-danger">
                  {translateSync(actionError)}
                </p>
              )}

              {/* Reservation Action Button & Contextual Handover Access */}
              {selectedBatch.status === "available" ? (
                user?.role === "artisan" || user?.role === "admin" ? (
                  <button
                    onClick={() => handleReserve(selectedBatch.id)}
                    disabled={reserving}
                    className="w-full py-3.5 rounded-md bg-pine-700 hover:bg-pine-600 text-white font-bold text-xs shadow-card transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {reserving ? (
                      <TranslatableText>Reserving Batch for Pickup...</TranslatableText>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <TranslatableText>Ping LGU & Reserve Batch for Upcycling</TranslatableText>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-3 bg-pine-50 border border-pine-200 rounded-md text-xs text-pine-700">
                    <TranslatableParagraph className="font-semibold">Want to claim this material?</TranslatableParagraph>
                    <TranslatableParagraph className="text-xs text-pine-600 mt-0.5">
                      Sign in as a Verified Artisan to reserve festival waste batches.
                    </TranslatableParagraph>
                  </div>
                )
              ) : selectedBatch.status === "reserved" ? (
                <div className="p-3.5 bg-warn-100 border border-warn/20 rounded-lg text-xs text-warn flex items-center justify-between">
                  <div>
                    <p className="font-bold">
                      {translateSync("Reserved by")} {selectedBatch.reservedByArtisan?.workshopName || selectedBatch.reservedByArtisan?.fullName || translateSync("an artisan")}
                    </p>
                    <TranslatableParagraph className="text-xs text-warn">
                      {holdsReservation
                        ? "Open the handover to show your pickup code at the collection depot."
                        : "Waiting for the artisan to pick it up at the collection depot."}
                    </TranslatableParagraph>
                  </div>
                  {(canShowCode || canVerify) && (
                    <button
                      onClick={openHandover}
                      className="px-4 py-2 rounded-md bg-warn hover:bg-warn text-white text-xs font-bold shadow-card transition-all flex items-center space-x-1.5 whitespace-nowrap ml-3"
                    >
                      <QrCode className="w-4 h-4" />
                      <TranslatableText>Open Handover</TranslatableText>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-paper border border-line rounded-md text-xs text-ink-2 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-pine-500" />
                  <TranslatableText>
                    Batch claimed and in production. View finished items in the Marketplace.
                  </TranslatableText>
                </div>
              )}
            </div>
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
                Chain-of-Custody Handover: {selectedBatch.id}
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
                  <TranslatableText>LGU: check & release</TranslatableText>
                </button>
              </div>
            )}

            {handoverSuccess ? (
              <div className="p-6 bg-pine-50 border border-pine-200 rounded-lg text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-pine-500 mx-auto" />
                <TranslatableHeading level={4} className="text-base font-bold text-ink">Custody Confirmed!</TranslatableHeading>
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
              <HandoverCode batchId={selectedBatch.id} />
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
    <AccessGuard allowedRoles={["artisan", "lgu", "admin"]} pageTitle="Harvest Map">
      <MaterialsMapPageContent />
    </AccessGuard>
  );
}

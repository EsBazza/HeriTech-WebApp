"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  ScanLine,
} from "lucide-react";
import { QRCodeViewer } from "@/components/qr/QRCodeViewer";

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
  reservedByArtisan?: {
    fullName: string;
    workshopName?: string;
  };
}

export default function MaterialsMapPage() {
  const { user } = useAuth();
  const { formatNumber, translateSync } = useTranslation();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState<string | null>(null);

  // Contextual Handover Modal State
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverTab, setHandoverTab] = useState<"artisan" | "lgu">("artisan");
  const [scannedArtisanId, setScannedArtisanId] = useState("usr_art_01");
  const [verifyingHandover, setVerifyingHandover] = useState(false);
  const [handoverSuccess, setHandoverSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/materials");
        const data = await res.json();
        if (data.success) {
          setBatches(data.data);
          if (data.data.length > 0) setSelectedBatch(data.data[0]);
        }
      } catch (err) {
        console.error("Failed to load materials:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBatches();
  }, []);

  const handleReserve = async (batchId: string) => {
    if (!user) return;
    setReserving(true);
    setReserveSuccess(null);
    try {
      const res = await fetch(`/api/materials/${batchId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artisanId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setReserveSuccess(`Batch ${batchId} reserved! Click 'Open Handover' to generate your Verified QR Token.`);
        // Refresh state
        setBatches((prev) =>
          prev.map((b) => (b.id === batchId ? { ...b, status: "reserved" } : b))
        );
        if (selectedBatch?.id === batchId) {
          setSelectedBatch((prev) => (prev ? { ...prev, status: "reserved" } : null));
        }

        // Trigger automated reservation message to LGU Officer
        try {
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderId: user.id,
              receiverId: selectedBatch?.scannedByOfficer?.fullName ? "usr_lgu_04" : "usr_lgu_01",
              content: `Artisan ${user.fullName} reserved Batch #${batchId} (${selectedBatch?.weightKg} kg ${selectedBatch?.materialType}) for ${selectedBatch?.agreement?.festival || "Festival"} pickup. Please coordinate depot schedule.`,
              contextType: "batch_reservation",
              contextId: batchId,
              isSystem: true,
            }),
          });
        } catch (msgErr) {
          console.warn("Could not trigger batch message:", msgErr);
        }
      }
    } catch (err) {
      console.error("Reservation failed:", err);
    } finally {
      setReserving(false);
    }
  };

  const handleVerifyHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setVerifyingHandover(true);
    setHandoverSuccess(null);
    try {
      const res = await fetch("/api/handover/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedBatch.id,
          artisanId: scannedArtisanId,
          officerId: user?.id || "usr_lgu_04",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHandoverSuccess(`Physical custody transferred! Batch ${selectedBatch.id} is now claimed for crafting.`);
        setBatches((prev) =>
          prev.map((b) => (b.id === selectedBatch.id ? { ...b, status: "claimed" } : b))
        );
        setSelectedBatch((prev) => (prev ? { ...prev, status: "claimed" } : null));
      }
    } catch (err) {
      console.error("Handover error:", err);
    } finally {
      setVerifyingHandover(false);
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case "available":
        return { label: translateSync("AVAILABLE FOR ARTISANS"), bg: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case "reserved":
        return { label: translateSync("RESERVED (PENDING QR HANDOVER)"), bg: "bg-amber-100 text-amber-800 border-amber-300" };
      case "claimed":
        return { label: translateSync("CLAIMED & IN CRAFTING"), bg: "bg-blue-100 text-blue-800 border-blue-300" };
      default:
        return { label: translateSync(status.toUpperCase()), bg: "bg-gray-100 text-gray-800" };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6E2D8] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
            <Sparkles className="w-3.5 h-3.5" />
            <TranslatableText>ACT 2: INTERACTIVE HARVEST MAP & REGIONAL PING</TranslatableText>
          </div>
          <TranslatableHeading level={1} className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Regional Material Harvest Registry
          </TranslatableHeading>
          <TranslatableParagraph className="text-xs text-gray-500 mt-1">
            Inspect raw festival waste logged across Asia with GPS and AI confidence scores. Artisans can reserve batches for pickup.
          </TranslatableParagraph>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold">
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <TranslatableText>Available</TranslatableText>
          </span>
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <TranslatableText>Reserved (QR Pending)</TranslatableText>
          </span>
        </div>
      </div>

      {/* Split Map View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
        {/* Left Col: Interactive Batch List (5 cols) */}
        <div className="lg:col-span-5 space-y-3 overflow-y-auto max-h-[750px] pr-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#1A6B3A] shadow-md ring-1 ring-[#1A6B3A]"
                      : "bg-white/80 border-[#E6E2D8] hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono-data font-bold text-gray-500">
                        {batch.id}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 mt-0.5"><TranslatableText>{batch.title}</TranslatableText></h3>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        getStatusPill(batch.status).bg
                      }`}
                    >
                      {getStatusPill(batch.status).label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-[#1A6B3A]" />
                      <span>
                        <TranslatableText>{batch.agreement?.festival || "Festival"}</TranslatableText> (<TranslatableText>{batch.agreement?.country}</TranslatableText>)
                      </span>
                    </span>
                    <span className="font-mono-data font-bold text-gray-900">
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
            <div className="bg-white rounded-3xl border border-[#E6E2D8] p-6 space-y-6 shadow-sm sticky top-24">
              {/* Batch Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs font-mono-data text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    BATCH ID: {selectedBatch.id}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-1"><TranslatableText>{selectedBatch.title}</TranslatableText></h2>
                  <p className="text-xs text-gray-500">
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
                  <div className="aspect-video sm:aspect-square rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                    <img
                      src={selectedBatch.imageUrl}
                      alt={selectedBatch.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <TranslatableText className="text-[10px] text-gray-400 font-medium block text-center">
                    Field Origin Photograph
                  </TranslatableText>
                </div>

                <div className="space-y-2">
                  <div className="aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 relative">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${
                        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
                      }&q=${selectedBatch.gpsLat},${selectedBatch.gpsLng}&zoom=14`}
                    />
                  </div>
                  <span className="text-[10px] text-emerald-800 font-medium block text-center flex items-center justify-center space-x-1">
                    <MapPin className="w-3 h-3 text-[#1A6B3A]" />
                    <TranslatableText>Live Google Maps GPS Satellite Pin</TranslatableText>
                  </span>
                </div>
              </div>

              {/* Harvest Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#F8F6F0] rounded-xl space-y-1">
                  <TranslatableText className="text-[10px] text-gray-400 font-bold uppercase">
                    Scale Measurement
                  </TranslatableText>
                  <p className="text-base font-black text-gray-900 font-mono-data">
                    {formatNumber(selectedBatch.weightKg)} <span className="text-xs font-normal">kg</span>
                  </p>
                  <span className="text-[10px] text-gray-500 block">
                    <TranslatableText>Condition</TranslatableText>: <strong><TranslatableText>{selectedBatch.condition}</TranslatableText></strong>
                  </span>
                </div>

                <div className="p-3 bg-[#F8F6F0] rounded-xl space-y-1">
                  <TranslatableText className="text-[10px] text-gray-400 font-bold uppercase">
                    Gemini AI Vision
                  </TranslatableText>
                  <p className="font-semibold text-gray-800 truncate">
                    <TranslatableText>{selectedBatch.aiInferredMaterial || selectedBatch.materialType}</TranslatableText>
                  </p>
                  <div className="flex items-center space-x-1 text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      <TranslatableText>Confidence</TranslatableText>:{" "}
                      <strong>
                        {selectedBatch.aiConfidence ? `${Math.round(selectedBatch.aiConfidence * 100)}%` : "95%"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#F8F6F0] rounded-xl space-y-1">
                  <TranslatableText className="text-[10px] text-gray-400 font-bold uppercase">
                    GPS Coordinates
                  </TranslatableText>
                  <p className="font-mono-data text-xs text-gray-800">
                    {selectedBatch.gpsLat.toFixed(4)}° N, {selectedBatch.gpsLng.toFixed(4)}° E
                  </p>
                  <span className="text-[10px] text-gray-500 block truncate">
                    <TranslatableText>Officer</TranslatableText>: <TranslatableText>{selectedBatch.scannedByOfficer?.fullName || "Field Officer"}</TranslatableText>
                  </span>
                </div>
              </div>

              {/* SHA-256 Provenance Hash */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono-data text-xs space-y-1">
                <TranslatableText className="text-[10px] text-gray-400 font-bold uppercase">
                  SHA-256 Harvest Cryptographic Hash
                </TranslatableText>
                <p className="text-gray-700 text-[10px] break-all">{selectedBatch.txHash}</p>
              </div>

              {/* Success Notification */}
              {reserveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span><TranslatableText>{reserveSuccess}</TranslatableText></span>
                </div>
              )}

              {/* Reservation Action Button & Contextual Handover Access */}
              {selectedBatch.status === "available" ? (
                user?.role === "artisan" || user?.role === "admin" ? (
                  <button
                    onClick={() => handleReserve(selectedBatch.id)}
                    disabled={reserving}
                    className="w-full py-3.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
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
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                    <TranslatableParagraph className="font-semibold">Want to claim this material?</TranslatableParagraph>
                    <TranslatableParagraph className="text-[11px] text-blue-700 mt-0.5">
                      Sign in as a Verified Artisan to reserve festival waste batches.
                    </TranslatableParagraph>
                  </div>
                )
              ) : selectedBatch.status === "reserved" ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
                  <div>
                    <TranslatableText className="font-bold">Reserved by Artisan Cooperative</TranslatableText>
                    <TranslatableParagraph className="text-[11px] text-amber-700">
                      Open Handover to present your Scannable QR Token at the collection depot.
                    </TranslatableParagraph>
                  </div>
                  <button
                    onClick={() => setHandoverModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 whitespace-nowrap ml-3"
                  >
                    <QrCode className="w-4 h-4" />
                    <TranslatableText>Open Handover</TranslatableText>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <TranslatableText>
                    Batch claimed and in production. View finished items in the Marketplace.
                  </TranslatableText>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 bg-white rounded-3xl border border-[#E6E2D8] text-center text-gray-400">
              <TranslatableText>Select a batch on the left to inspect harvest telemetry</TranslatableText>
            </div>
          )}
        </div>
      </div>

      {/* CONTEXTUAL REAL SCANNABLE QR HANDOVER MODAL */}
      {handoverModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E6E2D8] relative">
            <button
              onClick={() => {
                setHandoverModalOpen(false);
                setHandoverSuccess(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
                <QrCode className="w-4 h-4" />
                <TranslatableText>ACT 3: PHYSICAL ON-SITE QR HANDOVER AUDIT</TranslatableText>
              </div>
              <TranslatableHeading level={3} className="text-xl font-black text-gray-900 mt-1">
                Chain-of-Custody Handover: {selectedBatch.id}
              </TranslatableHeading>
            </div>

            {/* Mode Switcher */}
            <div className="flex p-1 bg-[#F8F6F0] rounded-2xl border border-gray-200">
              <button
                onClick={() => setHandoverTab("artisan")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  handoverTab === "artisan"
                    ? "bg-[#1A6B3A] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <TranslatableText>Artisan: Show Scannable QR</TranslatableText>
              </button>
              <button
                onClick={() => setHandoverTab("lgu")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  handoverTab === "lgu"
                    ? "bg-[#1A6B3A] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <TranslatableText>LGU: Audit & Release</TranslatableText>
              </button>
            </div>

            {handoverSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <TranslatableHeading level={4} className="text-base font-bold text-gray-900">Custody Confirmed!</TranslatableHeading>
                <p className="text-xs text-emerald-800"><TranslatableText>{handoverSuccess}</TranslatableText></p>
                <button
                  onClick={() => {
                    setHandoverModalOpen(false);
                    setHandoverSuccess(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#1A6B3A] text-white text-xs font-bold"
                >
                  <TranslatableText>Done</TranslatableText>
                </button>
              </div>
            ) : handoverTab === "artisan" ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-2">
                <QRCodeViewer
                  value={`HERITECH-HANDOVER:${selectedBatch.id}:${user?.id || "usr_art_01"}`}
                  size={160}
                  label={`TOKEN: ${selectedBatch.id}`}
                  sublabel={translateSync("Present to Municipal LGU Officer at festival salvage depot")}
                />
                <div className="text-xs text-center text-gray-500 font-mono-data">
                  <TranslatableText>Artisan Cooperative</TranslatableText>: <strong><TranslatableText>{user?.fullName || "Danilo Cruz"}</TranslatableText></strong>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerifyHandover} className="space-y-4 text-xs">
                <div className="p-3 bg-[#F8F6F0] rounded-xl space-y-1">
                  <TranslatableText className="text-[10px] text-gray-400 font-bold uppercase">Batch in Custody</TranslatableText>
                  <p className="font-bold text-gray-900"><TranslatableText>{selectedBatch.title}</TranslatableText></p>
                  <p className="font-mono-data text-gray-500">{formatNumber(selectedBatch.weightKg)} kg <TranslatableText>{selectedBatch.materialType}</TranslatableText></p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700"><TranslatableText>Scanned Artisan Token / User ID</TranslatableText></label>
                  <input
                    type="text"
                    required
                    value={scannedArtisanId}
                    onChange={(e) => setScannedArtisanId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-mono-data font-bold text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyingHandover}
                  className="w-full py-3.5 rounded-xl bg-[#1A6B3A] hover:bg-[#14532D] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {verifyingHandover ? (
                    <TranslatableText>Verifying Token & Transferring Custody...</TranslatableText>
                  ) : (
                    <>
                      <ScanLine className="w-4 h-4" />
                      <TranslatableText>Confirm Physical Handover & Release Batch</TranslatableText>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from "@/components/translation/TranslatableText";
import { QrCode, ShieldCheck, CheckCircle2, ScanLine, ArrowRight, User, Package } from "lucide-react";
import { AccessGuard } from "@/components/AccessGuard";

export default function HandoverPage() {
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const [activeTab, setActiveTab] = useState<"artisan" | "lgu">("artisan");

  // LGU Audit Scanner form state
  const [batchId, setBatchId] = useState("HT-2026-0102");
  const [scannedArtisanId, setScannedArtisanId] = useState("usr_art_01");
  const [verifying, setVerifying] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const handleVerifyHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await fetch("/api/handover/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          artisanId: scannedArtisanId,
          officerId: user?.id || "usr_lgu_01",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAuditResult(data);
      }
    } catch (err) {
      console.error("Handover verification error:", err);
    } finally {
      setVerifying(false);
    }
  };

  const artisanToken = user?.id || "usr_art_05";

  return (
    <AccessGuard allowedRoles={["artisan", "lgu", "admin"]} pageTitle="Physical Custody Handover Audit">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-pine-500">
          <QrCode className="w-3.5 h-3.5" />
          <TranslatableText>Chain of custody</TranslatableText>
        </div>
        <TranslatableHeading level={1} className="font-display text-4xl sm:text-[44px] leading-[1.05] font-semibold text-ink mt-2">
          QR custody handover
        </TranslatableHeading>
        <TranslatableParagraph className="text-base text-ink-2 mt-2 max-w-2xl">
          The artisan shows their verified QR token and the LGU officer scans it on site to release the material. Every handover is logged.
        </TranslatableParagraph>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 bg-surface rounded-lg border border-line max-w-sm">
        <button
          onClick={() => {
            setActiveTab("artisan");
            setAuditResult(null);
          }}
          className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all ${
            activeTab === "artisan"
              ? "bg-pine-700 text-white shadow-card"
              : "text-ink-2 hover:text-ink"
          }`}
        >
          <TranslatableText>Artisan: Show QR Token</TranslatableText>
        </button>
        <button
          onClick={() => {
            setActiveTab("lgu");
            setAuditResult(null);
          }}
          className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all ${
            activeTab === "lgu"
              ? "bg-pine-700 text-white shadow-card"
              : "text-ink-2 hover:text-ink"
          }`}
        >
          <TranslatableText>LGU: Audit & Release</TranslatableText>
        </button>
      </div>

      {/* Main Content Container */}
      <div className="bg-surface rounded-lg border border-line p-8 shadow-card">
        {activeTab === "artisan" ? (
          <div className="flex flex-col items-center text-center space-y-6 max-w-md mx-auto py-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-pine-700 bg-pine-50 px-2.5 py-1 rounded-full border border-pine-200">
                <TranslatableText>Verified artisan token</TranslatableText>
              </span>
              <TranslatableHeading level={2} className="text-lg font-bold text-ink mt-2">
                Present to LGU Officer at Collection Depot
              </TranslatableHeading>
              <TranslatableParagraph className="text-xs text-ink-3">
                Scan using standard mobile camera to unlock custody transfer.
              </TranslatableParagraph>
            </div>

            {/* Generated QR Card */}
            <div className="p-6 bg-surface rounded-lg border-2 border-pine-500 shadow-card space-y-4">
              <div className="w-56 h-56 bg-paper rounded-lg border border-line flex flex-col items-center justify-center p-4">
                <QrCode className="w-40 h-40 text-ink" />
                <span className="font-mono-data text-xs text-ink-3 mt-2 font-bold">
                  {artisanToken}
                </span>
              </div>

              <div className="text-left font-mono-data text-xs space-y-0.5">
                <p className="text-ink-3">
                  <TranslatableText>Artisan</TranslatableText>: <strong><TranslatableText>{user?.fullName || "Danilo Cruz"}</TranslatableText></strong>
                </p>
                <p className="text-ink-3">
                  <TranslatableText>Cooperative</TranslatableText>: <strong><TranslatableText>{user?.workshopName || "Cordillera Botanical Cooperative"}</TranslatableText></strong>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-lg mx-auto py-4">
            <div className="space-y-1 text-center">
              <TranslatableHeading level={2} className="text-lg font-bold text-ink">
                LGU Field Custody Release Scanner
              </TranslatableHeading>
              <TranslatableParagraph className="text-xs text-ink-3">
                Verify artisan registration and transition batch status to "Claimed".
              </TranslatableParagraph>
            </div>

            {auditResult ? (
              <div className="p-6 bg-pine-50 border border-pine-200 rounded-lg space-y-4 text-center">
                <div className="w-12 h-12 bg-pine-100 text-pine-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <TranslatableHeading level={3} className="text-base font-bold text-ink">
                    Physical Custody Transferred!
                  </TranslatableHeading>
                  <p className="text-xs text-pine-700 font-semibold mt-1">
                    <TranslatableText>{auditResult.message}</TranslatableText>
                  </p>
                </div>
                <div className="p-3 bg-surface rounded-md border border-pine-200 text-left font-mono-data text-xs space-y-1">
                  <p className="text-ink-3">
                    <TranslatableText>Batch</TranslatableText>: <strong>{auditResult.data.batchId}</strong>
                  </p>
                  <p className="text-ink-3">
                    <TranslatableText>Status</TranslatableText>: <strong className="text-pine-600"><TranslatableText>Claimed & transferred</TranslatableText></strong>
                  </p>
                  <p className="text-ink-3">
                    <TranslatableText>Timestamp</TranslatableText>: {auditResult.data.verifiedAt}
                  </p>
                </div>
                <button
                  onClick={() => setAuditResult(null)}
                  className="px-5 py-2.5 bg-pine-700 text-white rounded-md text-xs font-bold hover:bg-pine-600"
                >
                  <TranslatableText>Audit Another Handover</TranslatableText>
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyHandover} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-ink-2 flex items-center space-x-1.5">
                    <Package className="w-3.5 h-3.5 text-pine-600" />
                    <TranslatableText>Material Batch ID</TranslatableText>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    placeholder="e.g. HT-2026-0102"
                    className="w-full p-3 rounded-md border border-line bg-paper font-mono-data font-bold text-ink"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-ink-2 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-pine-600" />
                    <TranslatableText>Scanned Artisan QR Token Payload</TranslatableText>
                  </label>
                  <input
                    type="text"
                    required
                    value={scannedArtisanId}
                    onChange={(e) => setScannedArtisanId(e.target.value)}
                    placeholder="e.g. usr_art_01"
                    className="w-full p-3 rounded-md border border-line bg-paper font-mono-data font-bold text-ink"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-4 rounded-md bg-pine-700 hover:bg-pine-600 text-white font-bold text-xs shadow-card transition-all flex items-center justify-center space-x-2"
                >
                  {verifying ? (
                    <TranslatableText>Verifying Handover Token...</TranslatableText>
                  ) : (
                    <>
                      <ScanLine className="w-4 h-4" />
                      <TranslatableText>Confirm Physical Handover & Transfer Custody</TranslatableText>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
    </AccessGuard>
  );
}

"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from "@/components/translation/TranslatableText";
import { QrCode, ShieldCheck, CheckCircle2, ScanLine, ArrowRight, User, Package } from "lucide-react";

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
          <QrCode className="w-3.5 h-3.5" />
          <TranslatableText>ACT 3: ON-SITE PHYSICAL QR CUSTODY HANDOVER (STRICTLY NO NFC)</TranslatableText>
        </div>
        <TranslatableHeading level={1} className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
          QR Handover & Chain-of-Custody Audit
        </TranslatableHeading>
        <TranslatableParagraph className="text-xs text-gray-500 mt-1">
          Zero-NFC cross-device verification protocol. Artisans present their HeriTech Verified QR Token; LGU officers scan on-site to release physical custody.
        </TranslatableParagraph>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 bg-white rounded-2xl border border-[#E6E2D8] max-w-sm">
        <button
          onClick={() => {
            setActiveTab("artisan");
            setAuditResult(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "artisan"
              ? "bg-[#1A6B3A] text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <TranslatableText>Artisan: Show QR Token</TranslatableText>
        </button>
        <button
          onClick={() => {
            setActiveTab("lgu");
            setAuditResult(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "lgu"
              ? "bg-[#1A6B3A] text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <TranslatableText>LGU: Audit & Release</TranslatableText>
        </button>
      </div>

      {/* Main Content Container */}
      <div className="bg-white rounded-3xl border border-[#E6E2D8] p-8 shadow-sm">
        {activeTab === "artisan" ? (
          <div className="flex flex-col items-center text-center space-y-6 max-w-md mx-auto py-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <TranslatableText>HERITECH VERIFIED ARTISAN TOKEN</TranslatableText>
              </span>
              <TranslatableHeading level={2} className="text-lg font-bold text-gray-900 mt-2">
                Present to LGU Officer at Collection Depot
              </TranslatableHeading>
              <TranslatableParagraph className="text-xs text-gray-500">
                Scan using standard mobile camera to unlock custody transfer.
              </TranslatableParagraph>
            </div>

            {/* Generated QR Card */}
            <div className="p-6 bg-white rounded-3xl border-2 border-[#1A6B3A] shadow-xl space-y-4">
              <div className="w-56 h-56 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col items-center justify-center p-4">
                <QrCode className="w-40 h-40 text-gray-900" />
                <span className="font-mono-data text-[10px] text-gray-500 mt-2 font-bold">
                  {artisanToken}
                </span>
              </div>

              <div className="text-left font-mono-data text-xs space-y-0.5">
                <p className="text-gray-500">
                  <TranslatableText>Artisan</TranslatableText>: <strong><TranslatableText>{user?.fullName || "Danilo Cruz"}</TranslatableText></strong>
                </p>
                <p className="text-gray-500">
                  <TranslatableText>Cooperative</TranslatableText>: <strong><TranslatableText>{user?.workshopName || "Cordillera Botanical Cooperative"}</TranslatableText></strong>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-lg mx-auto py-4">
            <div className="space-y-1 text-center">
              <TranslatableHeading level={2} className="text-lg font-bold text-gray-900">
                LGU Field Custody Release Scanner
              </TranslatableHeading>
              <TranslatableParagraph className="text-xs text-gray-500">
                Verify artisan registration and transition batch status to "Claimed".
              </TranslatableParagraph>
            </div>

            {auditResult ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-[#1A6B3A] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <TranslatableHeading level={3} className="text-base font-bold text-gray-900">
                    Physical Custody Transferred!
                  </TranslatableHeading>
                  <p className="text-xs text-emerald-800 font-semibold mt-1">
                    <TranslatableText>{auditResult.message}</TranslatableText>
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-left font-mono-data text-xs space-y-1">
                  <p className="text-gray-500">
                    <TranslatableText>Batch</TranslatableText>: <strong>{auditResult.data.batchId}</strong>
                  </p>
                  <p className="text-gray-500">
                    <TranslatableText>Status</TranslatableText>: <strong className="text-emerald-700"><TranslatableText>CLAIMED & TRANSFERRED</TranslatableText></strong>
                  </p>
                  <p className="text-gray-500">
                    <TranslatableText>Timestamp</TranslatableText>: {auditResult.data.verifiedAt}
                  </p>
                </div>
                <button
                  onClick={() => setAuditResult(null)}
                  className="px-5 py-2.5 bg-[#1A6B3A] text-white rounded-xl text-xs font-bold hover:bg-[#14532D]"
                >
                  <TranslatableText>Audit Another Handover</TranslatableText>
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyHandover} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 flex items-center space-x-1.5">
                    <Package className="w-3.5 h-3.5 text-[#1A6B3A]" />
                    <TranslatableText>Material Batch ID</TranslatableText>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    placeholder="e.g. HT-2026-0102"
                    className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-mono-data font-bold text-gray-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-[#1A6B3A]" />
                    <TranslatableText>Scanned Artisan QR Token Payload</TranslatableText>
                  </label>
                  <input
                    type="text"
                    required
                    value={scannedArtisanId}
                    onChange={(e) => setScannedArtisanId(e.target.value)}
                    placeholder="e.g. usr_art_01"
                    className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-mono-data font-bold text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-4 rounded-xl bg-[#1A6B3A] hover:bg-[#14532D] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
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
  );
}

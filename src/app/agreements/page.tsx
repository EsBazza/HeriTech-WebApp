"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from "@/components/translation/TranslatableText";
import { FileCheck2, Plus, MapPin } from "lucide-react";

export default function AgreementsPage() {
  const { formatNumber, translateSync } = useTranslation();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Agreement Modal Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [festival, setFestival] = useState("");
  const [country, setCountry] = useState("Philippines");
  const [allocatedKg, setAllocatedKg] = useState("2000");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadAgreements() {
      try {
        const res = await fetch("/api/agreements");
        const data = await res.json();
        if (data.success) {
          setAgreements(data.data);
        }
      } catch (err) {
        console.error("Failed to load agreements:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAgreements();
  }, []);

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          organizerName,
          festival,
          country,
          allocatedKg: parseFloat(allocatedKg),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAgreements([data.data, ...agreements]);
        setModalOpen(false);
        setTitle("");
        setOrganizerName("");
        setFestival("");
      }
    } catch (err) {
      console.error("Failed to create agreement:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E2D8] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
            <FileCheck2 className="w-3.5 h-3.5" />
            <TranslatableText>STEP 0: MUNICIPAL PARTNERSHIPS & DIGITAL CONSENT</TranslatableText>
          </div>
          <TranslatableHeading level={1} className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Material Release Agreements & Quotas
          </TranslatableHeading>
          <TranslatableParagraph className="text-xs text-gray-500 mt-1">
            Pre-collection consent contracts establishing legal salvage rights and quota thresholds with municipal authorities.
          </TranslatableParagraph>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#1A6B3A] hover:bg-[#14532D] text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <TranslatableText>New Municipal Agreement MOU</TranslatableText>
        </button>
      </div>

      {/* Agreements Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agreements.map((agreement) => {
            const percentage = Math.min(
              100,
              Math.round((agreement.collectedKg / agreement.allocatedKg) * 100)
            );
            return (
              <div
                key={agreement.id}
                className="bg-white rounded-3xl border border-[#E6E2D8] p-6 space-y-4 shadow-sm hover:border-[#1A6B3A] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono-data font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {agreement.id}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1">
                      <TranslatableText>{agreement.title}</TranslatableText>
                    </h3>
                    <p className="text-xs text-gray-500">
                      <TranslatableText>{agreement.organizerName}</TranslatableText>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    <TranslatableText>ACTIVE MOU</TranslatableText>
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-[#1A6B3A]" />
                  <span>
                    <TranslatableText>{agreement.festival}</TranslatableText> (<TranslatableText>{agreement.country}</TranslatableText>)
                  </span>
                </div>

                {/* Quota Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono-data">
                    <TranslatableText className="text-gray-500 font-medium">Harvest Quota Collected:</TranslatableText>
                    <span className="font-bold text-gray-900">
                      {formatNumber(agreement.collectedKg)} kg / {formatNumber(agreement.allocatedKg)} kg ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-[#1A6B3A] transition-all duration-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Agreement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#E6E2D8]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <TranslatableHeading level={3} className="text-base font-bold text-gray-900">Issue Municipal Release Agreement</TranslatableHeading>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAgreement} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700"><TranslatableText>Agreement Title</TranslatableText></label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={translateSync("e.g. Baguio Panagbenga Floral Salvage Protocol")}
                  className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-semibold text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700"><TranslatableText>Organizer / Municipality Name</TranslatableText></label>
                <input
                  type="text"
                  required
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder={translateSync("e.g. Baguio Flower Festival Foundation & CEPMO")}
                  className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-semibold text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700"><TranslatableText>Festival</TranslatableText></label>
                  <input
                    type="text"
                    required
                    value={festival}
                    onChange={(e) => setFestival(e.target.value)}
                    placeholder={translateSync("e.g. Panagbenga Festival")}
                    className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700"><TranslatableText>Country</TranslatableText></label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] text-gray-900 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700"><TranslatableText>Allocated Waste Quota Target (kg)</TranslatableText></label>
                <input
                  type="number"
                  required
                  value={allocatedKg}
                  onChange={(e) => setAllocatedKg(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-mono-data font-bold text-gray-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
                >
                  <TranslatableText>Cancel</TranslatableText>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#1A6B3A] text-white font-bold hover:bg-[#14532D]"
                >
                  <TranslatableText>{submitting ? "Signing MOU..." : "Create Agreement"}</TranslatableText>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

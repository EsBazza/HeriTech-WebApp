"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from "@/components/translation/TranslatableText";
import { FileCheck2, Plus, MapPin } from "lucide-react";
import { AccessGuard } from "@/components/AccessGuard";
import { apiJson } from "@/lib/api";

function AgreementsPageContent() {
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

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<any[]>("/api/agreements").then((result) => {
      if (result.success) setAgreements(result.data ?? []);
      else setError(result.error ?? "Couldn't load agreements.");
      setLoading(false);
    });
  }, []);

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await apiJson<any>("/api/agreements", {
      method: "POST",
      body: JSON.stringify({ title, organizerName, festival, country, allocatedKg: parseFloat(allocatedKg) }),
    });
    if (result.success) {
      setAgreements((prev) => [result.data, ...prev]);
      setModalOpen(false);
      setTitle("");
      setOrganizerName("");
      setFestival("");
    } else {
      setError(result.error ?? "Couldn't create the agreement.");
    }
    setSubmitting(false);
  };

  return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-pine-500">
            <FileCheck2 className="w-3.5 h-3.5" />
            <TranslatableText>Step 0 · Digital consent</TranslatableText>
          </div>
          <TranslatableHeading level={1} className="font-display text-4xl sm:text-[44px] leading-[1.05] font-semibold text-ink mt-2">
            Material release agreements
          </TranslatableHeading>
          <TranslatableParagraph className="text-base text-ink-2 mt-2 max-w-2xl">
            Signed consent records that define what may be collected, where and how much, before any collection starts.
          </TranslatableParagraph>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-md bg-pine-700 hover:bg-pine-600 text-white text-xs font-bold shadow-card transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <TranslatableText>New agreement</TranslatableText>
        </button>
      </div>

      {error && (
        <p role="alert" className="p-4 rounded-md bg-danger-100 text-sm text-danger">
          {translateSync(error)}
        </p>
      )}

      {/* Agreements Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-line rounded-lg animate-pulse" />
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
                className="bg-surface rounded-lg border border-line p-6 space-y-4 shadow-card hover:border-pine-500 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono-data font-bold text-pine-700 bg-pine-50 px-2 py-0.5 rounded">
                      {agreement.id}
                    </span>
                    <h3 className="text-base font-bold text-ink mt-1">
                      <TranslatableText>{agreement.title}</TranslatableText>
                    </h3>
                    <p className="text-xs text-ink-3">
                      <TranslatableText>{agreement.organizerName}</TranslatableText>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-pine-100 text-pine-700 font-bold text-xs">
                    <TranslatableText>Active</TranslatableText>
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-ink-2">
                  <MapPin className="w-3.5 h-3.5 text-pine-600" />
                  <span>
                    <TranslatableText>{agreement.festival}</TranslatableText> (<TranslatableText>{agreement.country}</TranslatableText>)
                  </span>
                </div>

                {/* Quota Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono-data">
                    <TranslatableText className="text-ink-3 font-medium">Harvest Quota Collected:</TranslatableText>
                    <span className="font-bold text-ink">
                      {formatNumber(agreement.collectedKg)} kg / {formatNumber(agreement.allocatedKg)} kg ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-paper-2 overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-pine-700 transition-all duration-500 rounded-full"
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
          <div className="bg-surface rounded-lg max-w-lg w-full p-6 space-y-5 shadow-pop border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <TranslatableHeading level={3} className="text-base font-bold text-ink">Issue Municipal Release Agreement</TranslatableHeading>
              <button
                onClick={() => setModalOpen(false)}
                className="text-ink-3 hover:text-ink-2 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAgreement} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-ink-2"><TranslatableText>Agreement Title</TranslatableText></label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={translateSync("Name of the agreement")}
                  className="w-full p-2.5 rounded-md border border-line bg-paper font-semibold text-ink"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-ink-2"><TranslatableText>Organizer / Municipality Name</TranslatableText></label>
                <input
                  type="text"
                  required
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder={translateSync("Festival organiser or municipal office")}
                  className="w-full p-2.5 rounded-md border border-line bg-paper font-semibold text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-ink-2"><TranslatableText>Festival</TranslatableText></label>
                  <input
                    type="text"
                    required
                    value={festival}
                    onChange={(e) => setFestival(e.target.value)}
                    placeholder={translateSync("Festival name")}
                    className="w-full p-2.5 rounded-md border border-line bg-paper text-ink"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-ink-2"><TranslatableText>Country</TranslatableText></label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-2.5 rounded-md border border-line bg-paper text-ink font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-ink-2"><TranslatableText>Allocated Waste Quota Target (kg)</TranslatableText></label>
                <input
                  type="number"
                  required
                  value={allocatedKg}
                  onChange={(e) => setAllocatedKg(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-line bg-paper font-mono-data font-bold text-ink"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-md text-ink-2 hover:bg-paper-2 font-semibold"
                >
                  <TranslatableText>Cancel</TranslatableText>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-md bg-pine-700 text-white font-bold hover:bg-pine-600"
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

export default function AgreementsPage() {
  return (
    <AccessGuard allowedRoles={["lgu", "admin"]} pageTitle="Material release agreements">
      <AgreementsPageContent />
    </AccessGuard>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText } from "@/components/translation/TranslatableText";
import { FileCheck2, Plus, MapPin, AlertTriangle } from "lucide-react";
import { AccessGuard } from "@/components/AccessGuard";
import type { AgreementWithBatches } from "@/app/api/agreements/route";
import { apiJson } from "@/lib/api";
import { Badge, Button, Card, Dialog, EmptyState, Input, PageHeader, Skeleton } from "@/components/ui";

function AgreementsPageContent() {
  const { formatNumber, translateSync } = useTranslation();
  const [agreements, setAgreements] = useState<AgreementWithBatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New agreement form
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [festival, setFestival] = useState("");
  const [country, setCountry] = useState("Philippines");
  const [allocatedKg, setAllocatedKg] = useState("2000");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<AgreementWithBatches[]>("/api/agreements").then((result) => {
      if (result.success) setAgreements(result.data ?? []);
      else setLoadError(result.error ?? "Couldn't load agreements.");
      setLoading(false);
    });
  }, []);

  const openForm = () => {
    setCreateError(null);
    setModalOpen(true);
  };

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError(null);
    const result = await apiJson<AgreementWithBatches>("/api/agreements", {
      method: "POST",
      body: JSON.stringify({ title, organizerName, festival, country, allocatedKg: parseFloat(allocatedKg) }),
    });
    if (result.success && result.data) {
      const created = result.data;
      setAgreements((prev) => [created, ...prev]);
      setModalOpen(false);
      setTitle("");
      setOrganizerName("");
      setFestival("");
    } else {
      setCreateError(result.error ?? "Couldn't create the agreement.");
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string) =>
    status === "active" ? (
      <Badge tone="success">{translateSync("Active")}</Badge>
    ) : (
      <Badge tone="neutral">{translateSync(status.charAt(0).toUpperCase() + status.slice(1))}</Badge>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        eyebrow={translateSync("Before collection")}
        title={translateSync("Material release agreements")}
        description={translateSync("Signed records of what may be collected, where and how much, agreed before any collection starts.")}
        actions={
          <Button onClick={openForm}>
            <Plus className="w-4 h-4" />
            {translateSync("New agreement")}
          </Button>
        }
      />

      {loadError && (
        <p role="alert" className="flex items-start gap-2 p-4 rounded-md bg-danger-100 text-sm text-danger">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {translateSync(loadError)}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="status" aria-label={translateSync("Loading agreements")}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 rounded-md" />
          ))}
        </div>
      ) : agreements.length === 0 && !loadError ? (
        <EmptyState
          icon={<FileCheck2 className="w-5 h-5" />}
          title={translateSync("No agreements yet")}
          description={translateSync("Create one with the festival organiser before collecting. Every batch you log is recorded against an agreement.")}
          action={
            <Button onClick={openForm}>
              <Plus className="w-4 h-4" />
              {translateSync("New agreement")}
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agreements.map((agreement) => {
            const percentage = agreement.allocatedKg > 0 ? Math.min(100, Math.round((agreement.collectedKg / agreement.allocatedKg) * 100)) : 0;
            return (
              <li key={agreement.id}>
                <Card className="h-full p-5 sm:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-mono-data text-ink-3">{agreement.id}</span>
                      <h2 className="text-base font-semibold text-ink mt-0.5 font-sans">
                        <TranslatableText>{agreement.title}</TranslatableText>
                      </h2>
                      <p className="text-sm text-ink-3">
                        <TranslatableText>{agreement.organizerName}</TranslatableText>
                      </p>
                    </div>
                    <span className="shrink-0">{statusBadge(agreement.status)}</span>
                  </div>

                  <p className="flex items-center gap-2 text-sm text-ink-2">
                    <MapPin className="w-4 h-4 text-brand-2 shrink-0" />
                    <span>
                      <TranslatableText>{agreement.festival}</TranslatableText> · <TranslatableText>{agreement.country}</TranslatableText>
                    </span>
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                      <span className="text-ink-3">{translateSync("Collected so far")}</span>
                      <span className="tabular font-semibold text-ink">
                        {formatNumber(agreement.collectedKg)} / {formatNumber(agreement.allocatedKg)} kg · {percentage}%
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full bg-paper-2 overflow-hidden"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percentage}
                      aria-label={translateSync("Share of the agreed amount collected")}
                    >
                      <div style={{ width: `${percentage}%` }} className="h-full bg-brand transition-[width] duration-700 rounded-full" />
                    </div>
                  </div>

                  {agreement.batches.length > 0 ? (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-ink-2 font-medium min-h-10 flex items-center">
                        {agreement.batches.length} {translateSync(agreement.batches.length === 1 ? "batch logged" : "batches logged")}
                      </summary>
                      <ul className="mt-1 divide-y divide-line rounded-md border border-line">
                        {agreement.batches.map((b) => (
                          <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-2">
                            <span className="min-w-0">
                              <span className="block font-mono-data text-xs text-ink-3">{b.id}</span>
                              <span className="block truncate text-ink">
                                <TranslatableText>{b.title}</TranslatableText>
                              </span>
                            </span>
                            <span className="shrink-0 text-right">
                              <span className="block tabular font-medium text-ink">{formatNumber(b.weightKg)} kg</span>
                              <Badge tone={b.status === "available" ? "success" : b.status === "reserved" ? "warn" : "neutral"}>
                                {translateSync(b.status === "available" ? "Available" : b.status === "reserved" ? "Reserved" : "Picked up")}
                              </Badge>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <p className="text-sm text-ink-3">{translateSync("No batches logged yet.")}</p>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        dismissible={!submitting}
        closeLabel={translateSync("Close")}
        title={translateSync("New release agreement")}
        description={translateSync("What the organiser allows the local government to collect after the festival.")}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)} disabled={submitting}>
              {translateSync("Cancel")}
            </Button>
            <Button type="submit" form="agreement-form" className="flex-1" loading={submitting}>
              {submitting ? translateSync("Creating…") : translateSync("Create agreement")}
            </Button>
          </div>
        }
      >
        <form id="agreement-form" onSubmit={handleCreateAgreement} className="space-y-4">
          <Input label={translateSync("Agreement name")} required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            label={translateSync("Organiser or municipal office")}
            required
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            autoComplete="organization"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={translateSync("Festival")} required value={festival} onChange={(e) => setFestival(e.target.value)} />
            <Input label={translateSync("Country")} required value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" />
          </div>
          <Input
            label={translateSync("Amount that may be collected (kg)")}
            type="number"
            inputMode="decimal"
            min="1"
            required
            value={allocatedKg}
            onChange={(e) => setAllocatedKg(e.target.value)}
            className="tabular"
          />
          {createError && (
            <p role="alert" className="text-sm text-danger">
              {translateSync(createError)}
            </p>
          )}
        </form>
      </Dialog>
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

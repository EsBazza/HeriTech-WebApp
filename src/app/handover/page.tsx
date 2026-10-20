"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { SuccessBurst } from "@/components/motion/SuccessBurst";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableHeading, TranslatableParagraph, TranslatableText } from "@/components/translation/TranslatableText";
import { AccessGuard } from "@/components/AccessGuard";
import { HandoverCode } from "@/components/handover/HandoverCode";
import { HandoverVerifyForm, type HandoverResult } from "@/components/handover/HandoverVerifyForm";
import { Button, PageHeader, Select, Spinner, cn } from "@/components/ui";
import { apiJson } from "@/lib/api";

interface ReservedBatch {
  id: string;
  title: string;
  weightKg: number;
  materialType: string;
}

function ArtisanHandover() {
  const { translateSync } = useTranslation();
  const [batches, setBatches] = useState<ReservedBatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    apiJson<ReservedBatch[]>("/api/materials?mine=reserved&status=reserved").then((result) => {
      if (result.success) {
        setBatches(result.data ?? []);
        setSelected(result.data?.[0]?.id ?? null);
      } else {
        setError(result.error ?? "Couldn't load your reservations.");
      }
    });
  }, []);

  const selectedBatch = batches?.find((b) => b.id === selected) ?? null;

  if (error) return <p role="alert" className="text-sm text-danger text-center">{translateSync(error)}</p>;
  if (!batches) return <Spinner className="py-10" />;

  if (batches.length === 0) {
    return (
      <div className="text-center space-y-3 py-6">
        <TranslatableParagraph className="text-sm text-ink-2">
          You have no batches waiting for pickup. Reserve one on the material map first.
        </TranslatableParagraph>
        <Link href="/map" className="text-sm font-semibold text-pine-700 underline">
          {translateSync("Open the material map")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center space-y-6 max-w-md mx-auto py-4">
      <div className="space-y-1">
        <TranslatableHeading level={2} className="font-display text-[28px] leading-tight font-semibold text-ink">
          Your pickup code
        </TranslatableHeading>
        <TranslatableParagraph className="text-sm text-ink-3">
          Show it on screen, or download it, at the collection point. The local government officer scans it to release the batch to you.
        </TranslatableParagraph>
      </div>

      {batches.length > 1 && (
        <div className="w-full text-left">
          <Select
            label={
              <span className="inline-flex items-center gap-1.5">
                <Package className="w-4 h-4 text-pine-600" />
                {translateSync("Batch to pick up")}
              </span>
            }
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value)}
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} · {b.weightKg} kg {b.materialType}
              </option>
            ))}
          </Select>
        </div>
      )}

      {selectedBatch && <HandoverCode key={selectedBatch.id} batch={selectedBatch} />}
    </div>
  );
}

function LguHandover() {
  const { translateSync } = useTranslation();
  const [result, setResult] = useState<{ data: HandoverResult; message: string } | null>(null);

  if (result) {
    return (
      <div className="handover-success p-6 sm:p-8 bg-success-100/60 border border-success/20 rounded-lg space-y-5 text-center max-w-lg mx-auto" role="status">
        <SuccessBurst size={64} scraps className="mx-auto" />
        <div>
          <TranslatableHeading level={3} className="font-display text-[28px] leading-tight font-semibold text-ink">
            Picked up
          </TranslatableHeading>
          <p className="text-sm text-ink-2 mt-1">{translateSync(result.message)}</p>
        </div>
        <dl className="bg-surface rounded-md border border-line text-left text-sm divide-y divide-line">
          <div className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-ink-3">{translateSync("Batch")}</dt>
            <dd className="font-mono-data text-ink">{result.data.batchId}</dd>
          </div>
          <div className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-ink-3">{translateSync("Artisan")}</dt>
            <dd className="text-ink text-right">
              {result.data.artisan.name}
              {result.data.artisan.workshop && <span className="block text-xs text-ink-3">{result.data.artisan.workshop}</span>}
            </dd>
          </div>
          <div className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-ink-3">{translateSync("Verified at")}</dt>
            <dd className="text-ink">{new Date(result.data.verifiedAt).toLocaleString()}</dd>
          </div>
        </dl>
        <Button size="lg" className="w-full" onClick={() => setResult(null)}>
          {translateSync("Check another handover")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto py-4">
      <div className="space-y-1 text-center">
        <TranslatableHeading level={2} className="font-display text-[28px] leading-tight font-semibold text-ink">
          Release a reserved batch
        </TranslatableHeading>
        <TranslatableParagraph className="text-sm text-ink-3">
          Scan the artisan&apos;s code or import a photo of it. The code proves they hold the reservation and expires 30 minutes after it is created.
        </TranslatableParagraph>
      </div>
      <HandoverVerifyForm onVerified={(data, message) => setResult({ data, message })} />
    </div>
  );
}

function HandoverPageContent() {
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const isAdmin = user?.role === "admin";
  const canShowCode = user?.role === "artisan" || isAdmin;
  const canVerify = user?.role === "lgu" || isAdmin;
  const [activeTab, setActiveTab] = useState<"artisan" | "lgu">(canShowCode ? "artisan" : "lgu");

  const tabClass = (tab: "artisan" | "lgu") =>
    cn(
      "flex-1 min-h-11 px-2 py-2 rounded-md text-sm font-medium leading-tight transition-all cursor-pointer",
      activeTab === tab ? "bg-pine-700 text-white shadow-card" : "text-ink-2 hover:text-ink"
    );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        eyebrow={translateSync("Pickup")}
        title={translateSync("Pickup handover")}
        description={translateSync(
          "The artisan shows a pickup code and the local government officer scans it before handing over the material. Every pickup is recorded."
        )}
      />

      {canShowCode && canVerify && (
        <div className="flex p-1 bg-surface rounded-lg border border-line sm:max-w-sm" role="group" aria-label={translateSync("Pickup role")}>
          <button onClick={() => setActiveTab("artisan")} aria-pressed={activeTab === "artisan"} className={tabClass("artisan")}>
            <TranslatableText>Artisan: show code</TranslatableText>
          </button>
          <button onClick={() => setActiveTab("lgu")} aria-pressed={activeTab === "lgu"} className={tabClass("lgu")}>
            <TranslatableText>Officer: scan & release</TranslatableText>
          </button>
        </div>
      )}

      <div className="bg-surface rounded-lg border border-line p-5 sm:p-8 shadow-card">
        {activeTab === "artisan" && canShowCode ? <ArtisanHandover /> : <LguHandover />}
      </div>
    </div>
  );
}

export default function HandoverPage() {
  return (
    <AccessGuard allowedRoles={["artisan", "lgu", "admin"]} pageTitle="Pickup handover">
      <HandoverPageContent />
    </AccessGuard>
  );
}

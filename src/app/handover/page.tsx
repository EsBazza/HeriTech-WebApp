"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Package, QrCode } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableHeading, TranslatableParagraph, TranslatableText } from "@/components/translation/TranslatableText";
import { AccessGuard } from "@/components/AccessGuard";
import { HandoverCode } from "@/components/handover/HandoverCode";
import { HandoverVerifyForm, type HandoverResult } from "@/components/handover/HandoverVerifyForm";
import { Button, Spinner } from "@/components/ui";
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

  if (error) return <p role="alert" className="text-sm text-danger text-center">{translateSync(error)}</p>;
  if (!batches) return <Spinner className="py-10" />;

  if (batches.length === 0) {
    return (
      <div className="text-center space-y-3 py-6">
        <TranslatableParagraph className="text-sm text-ink-2">
          You have no batches waiting for pickup. Reserve one on the harvest map first.
        </TranslatableParagraph>
        <Link href="/map" className="text-sm font-semibold text-pine-700 underline">
          {translateSync("Open the harvest map")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center space-y-6 max-w-md mx-auto py-4">
      <div className="space-y-1">
        <TranslatableHeading level={2} className="text-lg font-bold text-ink">
          Show this at the collection depot
        </TranslatableHeading>
        <TranslatableParagraph className="text-xs text-ink-3">
          The LGU officer scans your code to release the batch to you.
        </TranslatableParagraph>
      </div>

      {batches.length > 1 && (
        <label className="w-full text-left space-y-1.5 text-xs">
          <span className="font-bold text-ink-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-pine-600" />
            {translateSync("Batch to pick up")}
          </span>
          <select
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full p-3 rounded-md border border-line bg-paper text-ink"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} · {b.weightKg} kg {b.materialType}
              </option>
            ))}
          </select>
        </label>
      )}

      {selected && <HandoverCode key={selected} batchId={selected} />}
    </div>
  );
}

function LguHandover() {
  const { translateSync } = useTranslation();
  const [result, setResult] = useState<{ data: HandoverResult; message: string } | null>(null);

  if (result) {
    return (
      <div className="p-6 bg-pine-50 border border-pine-200 rounded-lg space-y-4 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-pine-100 text-pine-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <TranslatableHeading level={3} className="text-base font-bold text-ink">
            Custody transferred
          </TranslatableHeading>
          <p className="text-xs text-pine-700 font-semibold mt-1">{translateSync(result.message)}</p>
        </div>
        <dl className="p-3 bg-surface rounded-md border border-pine-200 text-left font-mono-data text-xs space-y-1 text-ink-3">
          <div>
            <dt className="inline">{translateSync("Batch")}: </dt>
            <dd className="inline font-bold text-ink">{result.data.batchId}</dd>
          </div>
          <div>
            <dt className="inline">{translateSync("Artisan")}: </dt>
            <dd className="inline font-bold text-ink">{result.data.artisan.name}</dd>
          </div>
          <div>
            <dt className="inline">{translateSync("Verified at")}: </dt>
            <dd className="inline">{new Date(result.data.verifiedAt).toLocaleString()}</dd>
          </div>
        </dl>
        <Button onClick={() => setResult(null)}>{translateSync("Check another handover")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto py-4">
      <div className="space-y-1 text-center">
        <TranslatableHeading level={2} className="text-lg font-bold text-ink">
          Release a reserved batch
        </TranslatableHeading>
        <TranslatableParagraph className="text-xs text-ink-3">
          The code proves the artisan holds the reservation. It expires 30 minutes after it is shown.
        </TranslatableParagraph>
      </div>
      <HandoverVerifyForm onVerified={(data, message) => setResult({ data, message })} />
    </div>
  );
}

function HandoverPageContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canShowCode = user?.role === "artisan" || isAdmin;
  const canVerify = user?.role === "lgu" || isAdmin;
  const [activeTab, setActiveTab] = useState<"artisan" | "lgu">(canShowCode ? "artisan" : "lgu");

  const tabClass = (tab: "artisan" | "lgu") =>
    `flex-1 py-2.5 rounded-md text-xs font-bold transition-all ${
      activeTab === tab ? "bg-pine-700 text-white shadow-card" : "text-ink-2 hover:text-ink"
    }`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-pine-500">
          <QrCode className="w-3.5 h-3.5" />
          <TranslatableText>Chain of custody</TranslatableText>
        </div>
        <TranslatableHeading level={1} className="font-display text-4xl sm:text-[44px] leading-[1.05] font-semibold text-ink mt-2">
          QR custody handover
        </TranslatableHeading>
        <TranslatableParagraph className="text-base text-ink-2 mt-2 max-w-2xl">
          The artisan shows a signed pickup code and the LGU officer checks it on site before releasing the material. Every handover is logged.
        </TranslatableParagraph>
      </div>

      {canShowCode && canVerify && (
        <div className="flex p-1 bg-surface rounded-lg border border-line max-w-sm">
          <button onClick={() => setActiveTab("artisan")} className={tabClass("artisan")}>
            <TranslatableText>Artisan: show code</TranslatableText>
          </button>
          <button onClick={() => setActiveTab("lgu")} className={tabClass("lgu")}>
            <TranslatableText>LGU: check & release</TranslatableText>
          </button>
        </div>
      )}

      <div className="bg-surface rounded-lg border border-line p-8 shadow-card">
        {activeTab === "artisan" && canShowCode ? <ArtisanHandover /> : <LguHandover />}
      </div>
    </div>
  );
}

export default function HandoverPage() {
  return (
    <AccessGuard allowedRoles={["artisan", "lgu", "admin"]} pageTitle="Physical Custody Handover Audit">
      <HandoverPageContent />
    </AccessGuard>
  );
}

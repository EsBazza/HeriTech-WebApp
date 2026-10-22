"use client";

import React, { useEffect, useState } from "react";
import { Check, Gift } from "lucide-react";
import { apiJson } from "@/lib/api";
import { useTranslation } from "@/contexts/TranslationContext";
import type { BoothClaimStatus } from "@/app/api/claims/[serial]/route";
import { Button, Card } from "@/components/ui";

/**
 * Booth staff only (admins): shows whether the free piece behind this pass has
 * been handed over, and records the hand-over once. Staff open the visitor's
 * pass by scanning its QR code.
 */
export function BoothClaimPanel({ serial }: { serial: string }) {
  const { formatDate, translateSync } = useTranslation();
  const [status, setStatus] = useState<BoothClaimStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiJson<BoothClaimStatus>(`/api/claims/${encodeURIComponent(serial)}`).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) setStatus(result.data);
      else setError(result.error ?? "Couldn't load the booth claim.");
    });
    return () => {
      cancelled = true;
    };
  }, [serial]);

  const handOver = async () => {
    setSaving(true);
    const result = await apiJson<BoothClaimStatus>(`/api/claims/${encodeURIComponent(serial)}`, { method: "POST" });
    setSaving(false);
    if (result.success && result.data) setStatus(result.data);
    else setError(result.error ?? "Couldn't record the hand-over.");
  };

  return (
    <Card className="p-5 sm:p-6 space-y-3 border-lantern/40">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink font-sans">
        <Gift className="w-4 h-4 text-lantern-600" />
        {translateSync("Booth staff")}
      </h2>
      {error && <p className="text-sm text-danger" role="alert">{translateSync(error)}</p>}
      {status &&
        (status.tokenGivenAt ? (
          <p className="flex items-start gap-2 text-sm text-ink-2" role="status">
            <Check className="w-4 h-4 text-success shrink-0 mt-0.5" strokeWidth={2.5} />
            <span>
              {translateSync("Already handed over")} {formatDate(new Date(status.tokenGivenAt))}
              {status.tokenGivenBy && <> · {status.tokenGivenBy}</>}. {translateSync("Don't give another one for this pass.")}
            </span>
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-2">
              {translateSync("Not handed over yet")}
              {status.productTitle && <> · {translateSync(status.productTitle)}</>}
            </p>
            <Button variant="accent" onClick={handOver} loading={saving}>
              {translateSync("Mark as handed over")}
            </Button>
          </div>
        ))}
    </Card>
  );
}

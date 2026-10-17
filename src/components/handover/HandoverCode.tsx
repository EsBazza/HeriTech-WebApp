"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiJson } from "@/lib/api";
import { useTranslation } from "@/contexts/TranslationContext";
import { QRCodeViewer } from "@/components/qr/QRCodeViewer";
import { Button, Spinner } from "@/components/ui";

interface HandoverToken {
  token: string;
  expiresAt: string;
}

/** The reserving artisan's signed pickup code for one batch, as a QR code and as text. */
export function HandoverCode({ batchId }: { batchId: string }) {
  const { translateSync } = useTranslation();
  const [token, setToken] = useState<HandoverToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await apiJson<HandoverToken>("/api/handover/token", { method: "POST", body: JSON.stringify({ batchId }) });
    if (result.success && result.data) setToken(result.data);
    else setError(result.error ?? "Couldn't create a pickup code.");
    setLoading(false);
  }, [batchId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner className="py-10" label={translateSync("Creating pickup code…")} />;

  if (error || !token) {
    return (
      <div className="space-y-3 text-center">
        <p role="alert" className="text-sm text-danger">{translateSync(error ?? "Couldn't create a pickup code.")}</p>
        <Button variant="secondary" onClick={load}>
          <RefreshCw className="w-4 h-4" />
          {translateSync("Try again")}
        </Button>
      </div>
    );
  }

  const expires = new Date(token.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col items-center gap-4">
      <QRCodeViewer
        value={token.token}
        size={208}
        label={`${translateSync("Batch")} ${batchId}`}
        sublabel={`${translateSync("Show this to the LGU officer. Valid until")} ${expires}.`}
      />
      <div className="w-full space-y-1.5">
        <p className="text-xs text-ink-3">{translateSync("No camera? Send the officer this code instead:")}</p>
        <div className="flex gap-2">
          <code className="flex-1 min-w-0 truncate rounded-md border border-line bg-paper px-3 py-2 font-mono-data text-xs text-ink">
            {token.token}
          </code>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(token.token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? translateSync("Copied") : translateSync("Copy")}
          </Button>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={load}>
        <RefreshCw className="w-4 h-4" />
        {translateSync("Refresh code")}
      </Button>
    </div>
  );
}

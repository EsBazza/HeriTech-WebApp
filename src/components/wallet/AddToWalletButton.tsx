"use client";

import React, { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { apiJson } from "@/lib/api";
import { useTranslation } from "@/contexts/TranslationContext";
import { cn } from "@/components/ui";

/**
 * "Add to Google Wallet" for the signed-in buyer's own pass. The save link is
 * fetched up front and rendered as a normal link, so mobile popup blockers
 * don't interfere. Swap the styling for Google's official button artwork
 * before public launch (Wallet brand guidelines).
 */
export function AddToWalletButton({ serial, className }: { serial: string; className?: string }) {
  const { translateSync } = useTranslation();
  const [saveUrl, setSaveUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiJson<{ saveUrl: string }>(`/api/wallet/${encodeURIComponent(serial)}`).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) setSaveUrl(result.data.saveUrl);
      else setError(result.error ?? "Google Wallet is unavailable.");
    });
    return () => {
      cancelled = true;
    };
  }, [serial]);

  if (error) return <p className="text-sm text-ink-3" role="status">{translateSync(error)}</p>;

  return (
    <a
      href={saveUrl ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!saveUrl}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-medium text-white transition-opacity",
        saveUrl ? "hover:opacity-90" : "pointer-events-none opacity-60",
        className
      )}
    >
      <Wallet className="h-5 w-5" aria-hidden />
      {saveUrl ? translateSync("Add to Google Wallet") : translateSync("Preparing Wallet pass…")}
    </a>
  );
}

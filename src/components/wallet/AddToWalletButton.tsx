"use client";

import React, { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useTranslation } from "@/contexts/TranslationContext";
import { cn } from "@/components/ui";

/**
 * Google's official button artwork (public/wallet), unmodified as the Wallet
 * brand guidelines require. Languages without an official version use English.
 */
const BUTTON_LANGUAGES = new Set(["en", "zh-TW", "ja", "th", "id"]);

/** The official "Add to Google Wallet" button around a ready save link. */
export function WalletButtonLink({ href, className }: { href: string; className?: string }) {
  const { currentLanguage } = useTranslation();
  const lang = BUTTON_LANGUAGES.has(currentLanguage.code) ? currentLanguage.code : "en";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex justify-center rounded-full focus-visible:outline-offset-4", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/wallet/add-to-google-wallet-${lang}.svg`} alt="Add to Google Wallet" className="h-12 w-auto" />
    </a>
  );
}

/**
 * "Add to Google Wallet" for the signed-in buyer's own pass. The save link is
 * fetched up front and rendered as a normal link, so mobile popup blockers
 * don't interfere.
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
  if (!saveUrl) {
    return (
      <p className={cn("flex h-12 items-center justify-center text-sm text-ink-3", className)} role="status">
        {translateSync("Preparing Wallet pass…")}
      </p>
    );
  }
  return <WalletButtonLink href={saveUrl} className={className} />;
}

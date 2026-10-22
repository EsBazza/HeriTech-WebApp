"use client";

import React, { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { AddToWalletButton } from "@/components/wallet/AddToWalletButton";
import { Button, LinkButton } from "@/components/ui";
import { apiJson } from "@/lib/api";

interface Claim {
  serial: string;
  productId: string;
}

/**
 * Claim box for a piece given away at the showcase booth: one free piece per
 * account. After claiming, the visitor gets their Impact Pass (and Wallet
 * button) to show at the booth.
 */
export function ClaimBox({ productId, stock, onClaimed }: { productId: string; stock: number; onClaimed: () => void }) {
  const { user, signInWithGoogle } = useAuth();
  const { translateSync } = useTranslation();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [checking, setChecking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setChecking(true);
    apiJson<Claim | null>(`/api/products/${encodeURIComponent(productId)}/claim`).then((result) => {
      if (cancelled) return;
      setClaim(result.data ?? null);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, productId]);

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    const result = await apiJson<Claim>(`/api/products/${encodeURIComponent(productId)}/claim`, { method: "POST" });
    setClaiming(false);
    if (result.success && result.data) {
      setClaim({ serial: result.data.serial, productId });
      onClaimed();
    } else {
      setError(result.error ?? "Couldn't claim this piece. Please try again.");
    }
  };

  if (claim) {
    return (
      <div className="space-y-3 rounded-md border border-line bg-paper p-4" role="status">
        <p className="flex items-center gap-2 font-medium text-ink">
          <Gift className="w-4 h-4 text-lantern-600" />
          {claim.productId === productId ? translateSync("Claimed. It's yours.") : translateSync("You've already claimed your free piece.")}
        </p>
        <p className="text-sm text-ink-2">
          {translateSync("Show your Impact Pass at the HeriTech booth to collect it.")}{" "}
          <span className="font-mono-data text-ink">{claim.serial}</span>
        </p>
        <AddToWalletButton serial={claim.serial} className="w-full" />
        <LinkButton href={`/verify/${claim.serial}`} variant="secondary" className="w-full">
          {translateSync("Open my Impact Pass")}
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {user ? (
        <Button variant="accent" size="lg" className="w-full" onClick={handleClaim} loading={claiming || checking} disabled={stock === 0}>
          <Gift className="w-4 h-4" />
          {stock === 0 ? translateSync("All claimed") : translateSync("Claim for free")}
        </Button>
      ) : (
        <Button variant="accent" size="lg" className="w-full" onClick={signInWithGoogle} disabled={stock === 0}>
          <Gift className="w-4 h-4" />
          {translateSync("Sign in with Google to claim")}
        </Button>
      )}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {translateSync(error)}
        </p>
      )}
      <p className="text-sm text-ink-3 text-center">{translateSync("One free piece per person. Collect it at the HeriTech booth.")}</p>
    </div>
  );
}

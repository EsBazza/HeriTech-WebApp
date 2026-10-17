"use client";

import React, { useState } from "react";
import { ScanLine } from "lucide-react";
import { apiJson } from "@/lib/api";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button } from "@/components/ui";

export interface HandoverResult {
  batchId: string;
  status: "claimed";
  artisan: { id: string; name: string; workshop: string | null };
  verifiedAt: string;
}

interface Props {
  onVerified: (result: HandoverResult, message: string) => void;
}

/**
 * LGU officers paste or scan the artisan's pickup code here. The server checks the
 * signature, expiry and reservation before custody moves to the artisan.
 */
export function HandoverVerifyForm({ onVerified }: Props) {
  const { translateSync } = useTranslation();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    const result = await apiJson<HandoverResult>("/api/handover/verify", {
      method: "POST",
      body: JSON.stringify({ token: code.trim() }),
    });
    setVerifying(false);
    if (result.success && result.data) {
      setCode("");
      onVerified(result.data, result.message ?? "");
    } else {
      setError(result.error ?? "Verification failed.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label htmlFor="handover-code" className="font-bold text-ink-2 flex items-center gap-1.5">
          <ScanLine className="w-3.5 h-3.5 text-pine-600" />
          {translateSync("Artisan's pickup code")}
        </label>
        <textarea
          id="handover-code"
          required
          rows={3}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="HT1.…"
          className="w-full p-3 rounded-md border border-line bg-paper font-mono-data text-ink break-all"
        />
        <p className="text-ink-3">
          {translateSync("Scan the artisan's QR code with your phone camera and paste the text here.")}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {translateSync(error)}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" loading={verifying} disabled={!code.trim()}>
        {translateSync("Confirm handover")}
      </Button>
    </form>
  );
}

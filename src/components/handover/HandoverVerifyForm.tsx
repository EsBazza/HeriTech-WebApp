"use client";

import React, { useCallback, useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { apiJson } from "@/lib/api";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button } from "@/components/ui";
import { QrScanner } from "@/components/qr/QrScanner";

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
 * LGU officers scan the artisan's pickup QR code with the camera (or paste the
 * code). The server checks the signature, expiry and reservation before custody
 * moves to the artisan.
 */
export function HandoverVerifyForm({ onVerified }: Props) {
  const { translateSync } = useTranslation();
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (token: string) => {
      setVerifying(true);
      setError(null);
      const result = await apiJson<HandoverResult>("/api/handover/verify", {
        method: "POST",
        body: JSON.stringify({ token: token.trim() }),
      });
      setVerifying(false);
      if (result.success && result.data) {
        setCode("");
        onVerified(result.data, result.message ?? "");
      } else {
        setCode(token);
        setError(result.error ?? "Verification failed.");
      }
    },
    [onVerified]
  );

  // A successful scan is checked immediately; no extra tap needed.
  const handleScan = useCallback(
    (text: string) => {
      setScanning(false);
      verify(text);
    },
    [verify]
  );

  if (scanning) return <QrScanner onResult={handleScan} onCancel={() => setScanning(false)} />;

  return (
    <div className="space-y-4 text-xs">
      <Button size="lg" className="w-full" onClick={() => setScanning(true)} loading={verifying}>
        {!verifying && <Camera className="w-4 h-4" />}
        {verifying ? translateSync("Checking code…") : translateSync("Scan pickup QR code")}
      </Button>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {translateSync(error)}
        </p>
      )}

      <details className="group">
        <summary className="cursor-pointer text-ink-3 hover:text-ink">{translateSync("No camera? Paste the code instead")}</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify(code);
          }}
          className="mt-3 space-y-3"
        >
          <label htmlFor="handover-code" className="font-bold text-ink-2 flex items-center gap-1.5">
            <ScanLine className="w-3.5 h-3.5 text-pine-600" />
            {translateSync("Artisan's pickup code")}
          </label>
          <textarea
            id="handover-code"
            rows={3}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HT1.…"
            className="w-full p-3 rounded-md border border-line bg-paper font-mono-data text-ink break-all"
          />
          <Button type="submit" variant="secondary" className="w-full" loading={verifying} disabled={!code.trim()}>
            {translateSync("Confirm handover")}
          </Button>
        </form>
      </details>
    </div>
  );
}

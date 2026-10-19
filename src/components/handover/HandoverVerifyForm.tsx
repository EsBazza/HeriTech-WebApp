"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, ScanLine } from "lucide-react";
import { apiJson } from "@/lib/api";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button, cn } from "@/components/ui";
import { QrScanner } from "@/components/qr/QrScanner";
import { decodeQrFromFile, isHandoverCode } from "@/lib/qr/decode";

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
 * LGU officers check the artisan's pickup code three ways: scan it with the
 * camera, import a photo or screenshot of it (file, drag-and-drop or paste),
 * or paste the text code. Each is checked locally for the HeriTech format,
 * then the server checks the signature, expiry and reservation before custody
 * moves to the artisan.
 */
export function HandoverVerifyForm({ onVerified }: Props) {
  const { translateSync } = useTranslation();
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [reading, setReading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const verify = useCallback(
    async (raw: string) => {
      const token = raw.trim();
      setError(null);
      if (!isHandoverCode(token)) {
        setError("That isn't a HeriTech pickup code. Ask the artisan to open their code on the handover page.");
        return;
      }
      setVerifying(true);
      const result = await apiJson<HandoverResult>("/api/handover/verify", {
        method: "POST",
        body: JSON.stringify({ token }),
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

  const readPhoto = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      setScanning(false);
      setError(null);
      if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp|heic|heif|gif|bmp)$/i.test(file.name)) {
        setError("That file isn't an image. Choose a photo or screenshot of the QR code.");
        return;
      }
      setReading(true);
      const text = await decodeQrFromFile(file);
      setReading(false);
      if (!text) {
        setError("No QR code could be read from that photo. Make sure the whole code is in the picture, in focus and not cut off, then try again.");
        return;
      }
      verify(text);
    },
    [verify]
  );

  // Paste an image (e.g. a screenshot the artisan sent) anywhere on the page
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      if (!item) return;
      e.preventDefault();
      readPhoto(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [readPhoto]);

  const busy = reading || verifying;

  const picker = (
    <input
      ref={fileInput}
      type="file"
      accept="image/*"
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      onChange={(e) => {
        readPhoto(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  if (scanning) {
    return (
      <>
        {picker}
        <QrScanner onResult={handleScan} onCancel={() => setScanning(false)} onImportPhoto={() => fileInput.current?.click()} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {picker}

      <Button size="lg" className="w-full" onClick={() => setScanning(true)} disabled={busy}>
        <Camera className="w-4 h-4" />
        {translateSync("Scan pickup QR code")}
      </Button>

      {/* Import a photo: click, drop a file, or paste a screenshot */}
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          readPhoto(e.dataTransfer.files?.[0]);
        }}
        disabled={busy}
        className={cn(
          "w-full rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors cursor-pointer disabled:cursor-wait",
          dragging ? "border-pine-500 bg-pine-50" : "border-line-strong bg-paper hover:border-pine-300"
        )}
      >
        <span className="mx-auto mb-2 flex w-10 h-10 items-center justify-center rounded-full bg-pine-100 text-pine-700">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageUp className="w-5 h-5" />}
        </span>
        <span className="block text-sm font-medium text-ink">
          {reading ? translateSync("Reading the QR code…") : verifying ? translateSync("Checking the code…") : translateSync("Import a photo of the QR code")}
        </span>
        <span className="block text-xs text-ink-3 mt-0.5">
          {translateSync("Choose a photo or the artisan's downloaded code, drop it here, or paste a screenshot.")}
        </span>
      </button>

      {error && (
        <p role="alert" className="rounded-md bg-danger-100 border border-danger/20 px-3 py-2.5 text-sm text-danger">
          {translateSync(error)}
        </p>
      )}

      <details className="group text-sm">
        <summary className="cursor-pointer text-ink-3 hover:text-ink">{translateSync("No camera or photo? Paste the text code instead")}</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify(code);
          }}
          className="mt-3 space-y-3"
        >
          <label htmlFor="handover-code" className="font-medium text-ink-2 flex items-center gap-1.5">
            <ScanLine className="w-4 h-4 text-pine-600" />
            {translateSync("Artisan's pickup code")}
          </label>
          <textarea
            id="handover-code"
            rows={3}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HT1.…"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full p-3 rounded-md border border-line bg-paper font-mono-data text-xs text-ink break-all"
          />
          <Button type="submit" variant="secondary" className="w-full" loading={verifying} disabled={!code.trim() || busy}>
            {translateSync("Confirm handover")}
          </Button>
        </form>
      </details>
    </div>
  );
}

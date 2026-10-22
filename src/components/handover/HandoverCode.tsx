"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Download, RefreshCw, Share2, TimerOff } from "lucide-react";
import { apiJson } from "@/lib/api";
import { useTranslation } from "@/contexts/TranslationContext";
import { QRCodeViewer } from "@/components/qr/QRCodeViewer";
import { Button, Spinner, cn } from "@/components/ui";

interface HandoverToken {
  token: string;
  expiresAt: string;
}

export interface HandoverBatch {
  id: string;
  weightKg: number;
  materialType: string;
}

/** Renders the pickup card the artisan downloads: QR, batch details and expiry. */
export async function pickupCardBlob(qr: HTMLCanvasElement, batch: HandoverBatch, expires: Date): Promise<Blob | null> {
  const W = 1080;
  const H = 1440;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const font = (weight: number, size: number) => `${weight} ${size}px "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif`;

  ctx.fillStyle = "#f6f1e7";
  ctx.fillRect(0, 0, W, H);
  // Header band
  ctx.fillStyle = "#14281e";
  ctx.fillRect(0, 0, W, 200);
  ctx.fillStyle = "#ffffff";
  ctx.font = font(700, 54);
  ctx.fillText("HeriTech", 80, 112);
  ctx.font = font(500, 30);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("Material pickup code", 80, 158);

  // QR on a white tile (keeps the quiet zone clean for scanners)
  const tile = 820;
  const tx = (W - tile) / 2;
  const ty = 260;
  ctx.fillStyle = "#ffffff";
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(tx, ty, tile, tile, 28);
    ctx.fill();
  } else {
    ctx.fillRect(tx, ty, tile, tile);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qr, tx + 30, ty + 30, tile - 60, tile - 60);

  ctx.fillStyle = "#1b1f1c";
  ctx.textAlign = "center";
  ctx.font = font(700, 48);
  ctx.fillText(`Batch ${batch.id}`, W / 2, 1180);
  ctx.font = font(500, 32);
  ctx.fillStyle = "#3f4742";
  ctx.fillText(`${batch.weightKg} kg · ${batch.materialType}`, W / 2, 1236);
  ctx.fillStyle = "#a33a17";
  ctx.font = font(600, 32);
  ctx.fillText(
    `Valid until ${expires.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, ${expires.toLocaleDateString([], { day: "numeric", month: "short" })}`,
    W / 2,
    1300
  );
  ctx.fillStyle = "#5f6661";
  ctx.font = font(400, 28);
  ctx.fillText("Show this to the local government officer at the collection point.", W / 2, 1376);

  return new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
}

function useCountdown(expiresAt: string | null) {
  const [left, setLeft] = useState<number>(() => (expiresAt ? new Date(expiresAt).getTime() - Date.now() : 0));
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => setLeft(new Date(expiresAt).getTime() - Date.now());
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);
  return left;
}

/** The reserving artisan's signed pickup code for one batch: QR to show, download or share, and text to copy. */
export function HandoverCode({ batch }: { batch: HandoverBatch }) {
  const { translateSync } = useTranslation();
  const [token, setToken] = useState<HandoverToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState<"download" | "share" | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const qrCanvas = useRef<HTMLCanvasElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await apiJson<HandoverToken>("/api/handover/token", { method: "POST", body: JSON.stringify({ batchId: batch.id }) });
    if (result.success && result.data) setToken(result.data);
    else setError(result.error ?? "Couldn't create a pickup code.");
    setLoading(false);
  }, [batch.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    try {
      const probe = new File([new Blob()], "probe.png", { type: "image/png" });
      setCanShareFiles(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  useCountdown(token?.expiresAt ?? null); // re-renders every second
  // Worked out from the token itself, so a fresh code never flashes as expired before the timer catches up.
  const msLeft = token ? new Date(token.expiresAt).getTime() - Date.now() : 0;
  const expired = Boolean(token) && msLeft <= 0;

  const makeFile = async (): Promise<File | null> => {
    if (!token || !qrCanvas.current) return null;
    const blob = await pickupCardBlob(qrCanvas.current, batch, new Date(token.expiresAt));
    return blob ? new File([blob], `heritech-pickup-${batch.id}.png`, { type: "image/png" }) : null;
  };

  const download = async () => {
    setSaving("download");
    const file = await makeFile();
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    setSaving(null);
  };

  const share = async () => {
    setSaving("share");
    const file = await makeFile();
    try {
      if (file) await navigator.share({ files: [file], title: `HeriTech pickup ${batch.id}` });
    } catch {
      /* cancelled by the user */
    }
    setSaving(null);
  };

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

  const mm = Math.max(0, Math.floor(msLeft / 60000));
  const ss = Math.max(0, Math.floor((msLeft % 60000) / 1000));
  const lowTime = msLeft < 5 * 60000;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* High-resolution copy used for the downloaded card */}
      <QRCodeCanvas ref={qrCanvas} value={token.token} size={760} level="M" marginSize={4} className="hidden" aria-hidden />

      <div className="relative">
        <div className={cn("transition-opacity", expired && "opacity-15")}>
          <QRCodeViewer value={token.token} level="M" size={224} label={`${translateSync("Batch")} ${batch.id}`} />
        </div>
        {expired && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <TimerOff className="w-7 h-7 text-warn" />
            <p className="text-sm font-medium text-ink">{translateSync("This code has expired")}</p>
            <Button size="sm" onClick={load}>
              <RefreshCw className="w-4 h-4" />
              {translateSync("Get a new code")}
            </Button>
          </div>
        )}
      </div>

      {!expired && (
        <p className={cn("text-sm tabular", lowTime ? "text-lantern-600" : "text-ink-3")} aria-live="off">
          {translateSync("Valid for")} {mm}:{String(ss).padStart(2, "0")}
        </p>
      )}
      {/* The ticking clock stays silent; screen readers hear only these two changes. */}
      <p className="sr-only" aria-live="polite">
        {expired ? translateSync("This code has expired") : lowTime ? translateSync("Less than 5 minutes left on this code") : ""}
      </p>

      {!expired && (
        <div className={cn("grid w-full gap-2", canShareFiles ? "grid-cols-2" : "grid-cols-1")}>
          <Button variant="primary" onClick={download} loading={saving === "download"}>
            {saving !== "download" && <Download className="w-4 h-4" />}
            {translateSync("Download QR")}
          </Button>
          {canShareFiles && (
            <Button variant="secondary" onClick={share} loading={saving === "share"}>
              {saving !== "share" && <Share2 className="w-4 h-4" />}
              {translateSync("Share")}
            </Button>
          )}
        </div>
      )}

      {!expired && (
        <div className="w-full space-y-1.5 text-left">
          <p className="text-xs text-ink-3">{translateSync("No camera at the depot? Send the officer this code instead:")}</p>
          <div className="flex gap-2">
            <code className="flex-1 min-w-0 truncate rounded-md border border-line bg-paper px-3 py-2 font-mono-data text-xs text-ink">{token.token}</code>
            <Button
              variant="secondary"
              size="sm"
              aria-label={translateSync("Copy code")}
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
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? translateSync("Copied") : translateSync("Copy")}
            </Button>
          </div>
        </div>
      )}

      {!expired && (
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4" />
          {translateSync("Refresh code")}
        </Button>
      )}
    </div>
  );
}

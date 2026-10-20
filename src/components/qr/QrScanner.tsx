"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Flashlight, FlashlightOff, ImageUp } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button, cn } from "@/components/ui";
import { decodeQrFromVideo, isHandoverCode, nativeDetector, loadJsQr } from "@/lib/qr/decode";

interface QrScannerProps {
  /** Called once with a valid HeriTech pickup code; the camera stops afterwards. */
  onResult: (text: string) => void;
  onCancel: () => void;
  /** Offered inside the viewfinder so officers can switch to a photo without closing. */
  onImportPhoto?: () => void;
}

/** ~10 decodes a second keeps the preview smooth on mid-range phones. */
const SCAN_INTERVAL_MS = 100;

function cameraError(err: unknown): string {
  const name = (err as { name?: string })?.name;
  if (typeof window !== "undefined" && !window.isSecureContext) return "The camera only works over a secure (https) connection. Import a photo or paste the code instead.";
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera access was blocked. Allow the camera for this site, or import a photo instead.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found on this device. Import a photo or paste the code instead.";
  if (name === "NotReadableError") return "The camera is being used by another app. Close it and try again, or import a photo.";
  return "The camera couldn't start. Import a photo or paste the code instead.";
}

/**
 * Live camera reader for pickup codes. Uses the native detector when present,
 * otherwise jsQR on a downscaled frame. Other QR codes are ignored with a hint,
 * so a stray sticker in view never interrupts the scan.
 */
export function QrScanner({ onResult, onCancel, onImportPhoto }: QrScannerProps) {
  const { translateSync } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [found, setFound] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    let tick = 0;
    let hintTimer = 0;

    async function start() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setError(cameraError(null));
        return;
      }
      try {
        // Warm the decoder while the camera opens
        const decoderReady = nativeDetector().then((d) => (d ? null : loadJsQr()));
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (stopped || !videoRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean; focusMode?: string[] };
        setTorchSupported(Boolean(caps.torch));
        if (caps.focusMode?.includes("continuous")) {
          track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => {});
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        await decoderReady;
        setReady(true);

        const loop = async () => {
          if (stopped || !videoRef.current) return;
          const text = await decodeQrFromVideo(videoRef.current, tick++ % 3 === 2);
          if (stopped) return;
          if (text) {
            if (isHandoverCode(text)) {
              stopped = true;
              setFound(true);
              navigator.vibrate?.(60);
              // Let the success frame show before handing over
              window.setTimeout(() => onResultRef.current(text.trim()), 350);
              return;
            }
            setHint("That QR code isn't a HeriTech pickup code. Point at the artisan's code.");
            window.clearTimeout(hintTimer);
            hintTimer = window.setTimeout(() => setHint(null), 2200);
          }
          timer = window.setTimeout(loop, SCAN_INTERVAL_MS);
        };
        loop();
      } catch (err) {
        setError(cameraError(err));
      }
    }

    start();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearTimeout(hintTimer);
      stream?.getTracks().forEach((t) => t.stop());
      trackRef.current = null;
    };
  }, []);

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn(!torchOn);
    } catch {
      setTorchSupported(false);
    }
  };

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="rounded-md bg-warn-100 border border-warn/20 p-3 text-sm text-warn">
          {translateSync(error)}
        </p>
      ) : (
        <div className="relative overflow-hidden rounded-lg bg-ink aspect-square">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline aria-label={translateSync("Camera preview")} />

          {/* Viewfinder */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-[16%] rounded-lg border-2 transition-colors duration-200",
              found ? "border-success bg-success/15" : "border-white/85"
            )}
          >
            {!found && ready && <span className="scan-line absolute inset-x-3 h-0.5 rounded-full bg-pine-300/90 shadow-[0_0_12px_rgb(143_176_156/0.9)]" />}
            {found && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-14 h-14 rounded-full bg-success text-white flex items-center justify-center shadow-pop">
                  <Check className="w-7 h-7" strokeWidth={3} />
                </span>
              </span>
            )}
          </div>

          {!ready && !found && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-white/80">{translateSync("Opening camera…")}</p>
          )}

          <p className="absolute bottom-3 inset-x-3 text-center text-xs text-white/90" aria-live="polite">
            {found
              ? translateSync("Code read. Checking…")
              : hint
              ? translateSync(hint)
              : translateSync("Hold the artisan's QR code inside the frame")}
          </p>

          {torchSupported && (
            <button
              type="button"
              onClick={toggleTorch}
              aria-pressed={torchOn}
              aria-label={torchOn ? translateSync("Turn off the light") : translateSync("Turn on the light")}
              className="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur cursor-pointer"
            >
              {torchOn ? <FlashlightOff className="w-5 h-5" /> : <Flashlight className="w-5 h-5" />}
            </button>
          )}
        </div>
      )}
      <div className={cn("grid gap-2", onImportPhoto ? "grid-cols-2" : "grid-cols-1")}>
        {onImportPhoto && (
          <Button variant="secondary" onClick={onImportPhoto}>
            <ImageUp className="w-4 h-4" />
            {translateSync("Import photo")}
          </Button>
        )}
        <Button variant="secondary" onClick={onCancel}>
          {translateSync("Close camera")}
        </Button>
      </div>
    </div>
  );
}

export default QrScanner;

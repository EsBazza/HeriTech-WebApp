"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button } from "@/components/ui";

interface QrScannerProps {
  /** Called once with the decoded text; the camera stops afterwards. */
  onResult: (text: string) => void;
  onCancel: () => void;
}

/**
 * Live camera QR reader. Frames are decoded with jsQR (loaded on demand), which
 * works in every modern browser, including iOS Safari where BarcodeDetector is missing.
 */
export function QrScanner({ onResult, onCancel }: QrScannerProps) {
  const { translateSync } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser can't open the camera. Paste the code instead.");
        return;
      }
      try {
        const [{ default: jsQR }, media] = await Promise.all([
          import("jsqr"),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }),
        ]);
        stream = media;
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = media;
        await videoRef.current.play();

        const scan = () => {
          const video = videoRef.current;
          if (stopped || !video || !ctx) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });
            if (code?.data) {
              stopped = true;
              onResult(code.data);
              return;
            }
          }
          frame = requestAnimationFrame(scan);
        };
        frame = requestAnimationFrame(scan);
      } catch {
        setError("Camera access was blocked. Allow the camera for this site, or paste the code instead.");
      }
    }

    start();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onResult]);

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="rounded-md bg-warn-100 border border-warn/20 p-3 text-sm text-warn">
          {translateSync(error)}
        </p>
      ) : (
        <div className="relative overflow-hidden rounded-md bg-ink aspect-square">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-[18%] rounded-lg border-2 border-white/80" aria-hidden />
          <p className="absolute bottom-3 inset-x-0 text-center text-xs text-white/90">
            {translateSync("Point the camera at the artisan's QR code")}
          </p>
        </div>
      )}
      <Button variant="secondary" className="w-full" onClick={onCancel}>
        {translateSync("Close camera")}
      </Button>
    </div>
  );
}

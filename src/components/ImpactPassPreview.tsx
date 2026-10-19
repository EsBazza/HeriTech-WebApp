"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { QrCode } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

interface ImpactPassPreviewProps {
  title: string;
  origin: string;
  maker: string;
  material: string;
  kgDiverted: number;
}

/**
 * What the buyer receives: a Google Wallet-style Verified Impact Pass.
 * A slow sheen passes over it, and it tilts gently toward a mouse cursor.
 * The serial is only issued at purchase, so the preview never shows one.
 */
export function ImpactPassPreview({ title, origin, maker, material, kgDiverted }: ImpactPassPreviewProps) {
  const { translateSync, formatNumber } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--tilt-x", `${(-y * 6).toFixed(2)}deg`);
    ref.current.style.setProperty("--tilt-y", `${(x * 8).toFixed(2)}deg`);
  };
  const reset = () => {
    ref.current?.style.setProperty("--tilt-x", "0deg");
    ref.current?.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div className="pass-stage" onPointerMove={onMove} onPointerLeave={reset}>
      <div ref={ref} className="pass-card relative overflow-hidden rounded-[18px] text-white p-5 shadow-pop">
        <span aria-hidden className="pass-sheen" />
        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-white/95 flex items-center justify-center">
              <Image src="/logo_heritech-removebg-preview.png" alt="" width={24} height={24} className="w-6 h-6 object-contain" />
            </span>
            <span className="text-sm font-medium leading-tight">
              HeriTech
              <span className="block text-xs text-white/65 font-normal">{translateSync("Verified Impact Pass")}</span>
            </span>
          </span>
          <span className="rounded-full border border-white/25 px-2.5 py-1 text-xs text-white/80">{translateSync("Preview")}</span>
        </div>

        <p className="relative mt-5 font-display text-[26px] leading-tight font-semibold">{translateSync(title)}</p>

        <dl className="relative mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-white/60">{translateSync("Origin")}</dt>
            <dd className="truncate">{origin}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/60">{translateSync("Made by")}</dt>
            <dd className="truncate">{translateSync(maker)}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/60">{translateSync("Material")}</dt>
            <dd className="truncate">{translateSync(material)}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/60">{translateSync("Diverted")}</dt>
            <dd className="tabular">{formatNumber(kgDiverted)} kg</dd>
          </div>
        </dl>

        <div className="relative mt-5 pt-4 border-t border-white/15 flex items-center justify-between gap-4">
          <p className="text-xs text-white/70 leading-relaxed">
            {translateSync("Serial and QR code are issued at purchase. Anyone can scan it to check this record.")}
          </p>
          <span className="w-14 h-14 shrink-0 rounded-md bg-white text-pine-900 flex items-center justify-center">
            <QrCode className="w-8 h-8" strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </div>
  );
}

export default ImpactPassPreview;

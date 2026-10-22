"use client";

import React from "react";
import { QrCode } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { PassShell } from "@/components/wallet/PassShell";

interface ImpactPassPreviewProps {
  title: string;
  origin: string;
  maker: string;
  material: string;
  kgDiverted: number;
  /** The piece's photo, the face of the pass. */
  image?: string | null;
}

/**
 * What the buyer receives: the Verified Impact Pass, faced with the piece's own photo.
 * The serial is only issued at purchase, so the preview never shows one.
 */
export function ImpactPassPreview({ title, origin, maker, material, kgDiverted, image }: ImpactPassPreviewProps) {
  const { translateSync, formatNumber } = useTranslation();

  return (
    <PassShell
      image={image}
      title={title}
      ariaLabel={translateSync("Verified Impact Pass preview")}
      badge={<span className="rounded-full bg-pine-900/60 backdrop-blur-sm border border-white/25 px-2.5 py-1 text-xs text-white/85">{translateSync("Preview")}</span>}
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-white/60">{translateSync("Origin")}</dt>
          <dd className="truncate">{origin}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-white/60">{translateSync("Made by")}</dt>
          <dd className="truncate">{translateSync(maker)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-white/60">{translateSync("Material")}</dt>
          <dd className="truncate">{translateSync(material)}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/60">{translateSync("Diverted")}</dt>
          <dd className="tabular">{formatNumber(kgDiverted)} kg</dd>
        </div>
      </dl>

      <div className="mt-4 pt-4 border-t-2 border-dashed border-white/20 flex items-center justify-between gap-4">
        <p className="text-xs text-white/70 leading-relaxed">
          {translateSync("Serial and QR code are issued with the piece. Anyone can scan it to check this record.")}
        </p>
        <span className="w-14 h-14 shrink-0 rounded-md bg-white text-pine-900 flex items-center justify-center">
          <QrCode className="w-8 h-8" strokeWidth={1.5} />
        </span>
      </div>
    </PassShell>
  );
}

export default ImpactPassPreview;

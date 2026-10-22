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
      badge={<span className="rounded-full bg-black/30 backdrop-blur-sm border border-white/20 px-2 py-0.5 text-[11px] font-medium text-white/85">{translateSync("Preview")}</span>}
      meta={`${translateSync(maker)} · ${origin}`}
      footer={
        <>
          <div className="flex items-baseline justify-between gap-2 text-[11.5px] text-white/75 min-w-0">
            <span className="shrink-0">
              <span className="tabular font-semibold text-white">{formatNumber(kgDiverted)} kg</span> {translateSync("diverted")}
            </span>
            <span className="truncate">{translateSync(material)}</span>
          </div>
          <p className="mt-1 font-mono-data text-[12.5px] tracking-[0.14em] text-white/60">HT-••••-••••</p>
        </>
      }
      code={
        <span className="w-[68px] h-[68px] rounded-lg bg-white text-pine-900 flex items-center justify-center shadow-card" title={translateSync("Issued with the piece")}>
          <QrCode className="w-8 h-8" strokeWidth={1.5} />
        </span>
      }
    />
  );
}

export default ImpactPassPreview;

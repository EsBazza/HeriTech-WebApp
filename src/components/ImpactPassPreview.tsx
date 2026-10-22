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
      notchFromBottom={110}
      badge={<span className="rounded-full bg-pine-900/60 backdrop-blur-sm border border-white/25 px-2.5 py-1 text-xs text-white/85">{translateSync("Preview")}</span>}
    >
      <dl className="grid grid-cols-2 gap-1.5 text-[13px]">
        <div className="col-span-2 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md px-3 py-2 min-w-0">
          <dt className="text-[11px] uppercase tracking-wide text-white/60">{translateSync("Origin")}</dt>
          <dd className="truncate font-medium">{origin}</dd>
        </div>
        <div className="col-span-2 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md px-3 py-2 min-w-0">
          <dt className="text-[11px] uppercase tracking-wide text-white/60">{translateSync("Made by")}</dt>
          <dd className="truncate font-medium">{translateSync(maker)}</dd>
        </div>
        <div className="rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md px-3 py-2 min-w-0">
          <dt className="text-[11px] uppercase tracking-wide text-white/60">{translateSync("Material")}</dt>
          <dd className="truncate font-medium">{translateSync(material)}</dd>
        </div>
        <div className="rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md px-3 py-2 min-w-0">
          <dt className="text-[11px] uppercase tracking-wide text-white/60">{translateSync("Diverted")}</dt>
          <dd className="tabular font-medium">{formatNumber(kgDiverted)} kg</dd>
        </div>
      </dl>

      <div className="mt-3 pt-3 border-t-2 border-dashed border-white/25">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md p-2.5">
          <p className="pl-1 text-xs text-white/75 leading-relaxed">
            {translateSync("Serial and QR code are issued with the piece. Anyone can scan it to check this record.")}
          </p>
          <span className="w-12 h-12 shrink-0 rounded-md bg-white text-pine-900 flex items-center justify-center">
            <QrCode className="w-7 h-7" strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </PassShell>
  );
}

export default ImpactPassPreview;

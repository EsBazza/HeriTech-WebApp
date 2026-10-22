"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { QRCodeViewer } from "@/components/qr/QRCodeViewer";
import { AddToWalletButton } from "@/components/wallet/AddToWalletButton";
import { buttonClass, cn } from "@/components/ui";
import { PassShell } from "@/components/wallet/PassShell";

export interface ImpactPassCardProps {
  serial: string;
  /** The public record URL encoded in the QR (as issued by the server). */
  verifyUrl: string;
  title: string;
  maker?: string | null;
  origin?: string | null;
  kgDiverted?: number | null;
  issuedAt?: string | null;
  /** The piece's photo, used as the face of the pass. */
  image?: string | null;
  /** Show Add to Google Wallet (only for the buyer's own passes). */
  wallet?: boolean;
  /** Called when a link inside the card navigates away (e.g. to close a modal). */
  onNavigate?: () => void;
  className?: string;
}

/**
 * A buyer's Verified Impact Pass, styled like the Google Wallet card it
 * becomes: product, maker, origin, a scannable QR that opens the public
 * record, and the serial written out for anyone without a camera.
 */
export function ImpactPassCard({ serial, verifyUrl, title, maker, origin, kgDiverted, issuedAt, image, wallet = true, onNavigate, className }: ImpactPassCardProps) {
  const { translateSync, formatNumber, formatDate } = useTranslation();

  return (
    <div className={cn("@container space-y-3 w-full max-w-[19rem] mx-auto", className)}>
      <PassShell
        image={image}
        title={title}
        ariaLabel={`${translateSync("Verified Impact Pass")} ${serial}`}
        notchFromBottom={130}
        badge={
          <span className="inline-flex items-center gap-1 rounded-full bg-pine-900/60 backdrop-blur-sm border border-white/15 px-2.5 py-1 text-xs text-pine-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            {translateSync("Issued")}
          </span>
        }
      >
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
          {maker && (
            <div className="min-w-0">
              <dt className="text-xs text-white/60">{translateSync("Made by")}</dt>
              <dd className="truncate">{translateSync(maker)}</dd>
            </div>
          )}
          {origin && (
            <div className="min-w-0">
              <dt className="text-xs text-white/60">{translateSync("Origin")}</dt>
              <dd className="truncate">{origin}</dd>
            </div>
          )}
          {kgDiverted != null && (
            <div>
              <dt className="text-xs text-white/60">{translateSync("Diverted")}</dt>
              <dd className="tabular">{formatNumber(kgDiverted)} kg</dd>
            </div>
          )}
          {issuedAt && (
            <div>
              <dt className="text-xs text-white/60">{translateSync("Issued")}</dt>
              <dd>{formatDate(new Date(issuedAt))}</dd>
            </div>
          )}
        </dl>

        <div className="mt-3 flex items-end justify-between gap-3 pt-3 border-t-2 border-dashed border-white/25">
          <div className="min-w-0">
            <p className="text-xs text-white/60">{translateSync("Serial")}</p>
            <p className="font-mono-data text-[15px] tracking-wide break-all">{serial}</p>
            <p className="mt-1 text-xs text-white/65 leading-snug max-w-[11rem]">{translateSync("Scan to open the public record of this piece.")}</p>
          </div>
          <QRCodeViewer value={verifyUrl} size={84} level="M" className="shrink-0" />
        </div>
      </PassShell>

      {/* Side by side only when the card is wide enough; stacked in narrow grids */}
      <div className="grid gap-2">
        {wallet && <AddToWalletButton serial={serial} className="w-full" />}
        <Link href={`/verify/${serial}`} onClick={onNavigate} className={buttonClass("secondary", "lg", "w-full rounded-full")}>
          {translateSync("View public record")}
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default ImpactPassCard;

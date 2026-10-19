"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { QRCodeViewer } from "@/components/qr/QRCodeViewer";
import { AddToWalletButton } from "@/components/wallet/AddToWalletButton";
import { buttonClass, cn } from "@/components/ui";

export interface ImpactPassCardProps {
  serial: string;
  /** The public record URL encoded in the QR (as issued by the server). */
  verifyUrl: string;
  title: string;
  maker?: string | null;
  origin?: string | null;
  kgDiverted?: number | null;
  issuedAt?: string | null;
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
export function ImpactPassCard({ serial, verifyUrl, title, maker, origin, kgDiverted, issuedAt, wallet = true, onNavigate, className }: ImpactPassCardProps) {
  const { translateSync, formatNumber, formatDate } = useTranslation();

  return (
    <div className={cn("@container space-y-3", className)}>
      <article className="pass-card relative overflow-hidden rounded-[18px] text-white shadow-pop" aria-label={`${translateSync("Verified Impact Pass")} ${serial}`}>
        <span aria-hidden className="pass-sheen" />
        <div className="relative p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 shrink-0 rounded-full bg-white/95 flex items-center justify-center">
                <Image src="/logo_heritech-removebg-preview.png" alt="" width={24} height={24} className="w-6 h-6 object-contain" />
              </span>
              <span className="text-sm font-medium leading-tight">
                HeriTech
                <span className="block text-xs text-white/65 font-normal">{translateSync("Verified Impact Pass")}</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-pine-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              {translateSync("Issued")}
            </span>
          </div>

          <p className="font-display text-[24px] leading-tight font-semibold">{translateSync(title)}</p>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
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

          <div className="flex items-end justify-between gap-4 pt-3 border-t border-white/15">
            <div className="min-w-0">
              <p className="text-xs text-white/60">{translateSync("Serial")}</p>
              <p className="font-mono-data text-base tracking-wide">{serial}</p>
              <p className="mt-1 text-xs text-white/65 leading-snug max-w-[11rem]">{translateSync("Scan to open the public record of this piece.")}</p>
            </div>
            <QRCodeViewer value={verifyUrl} size={104} level="M" className="shrink-0" />
          </div>
        </div>
      </article>

      {/* Side by side only when the card is wide enough; stacked in narrow grids */}
      <div className={cn("grid gap-2", wallet && "@md:grid-cols-2")}>
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

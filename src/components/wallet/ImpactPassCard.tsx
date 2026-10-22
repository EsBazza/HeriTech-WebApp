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
        notchFromBottom={146}
        badge={
          <span className="inline-flex items-center gap-1 rounded-full bg-pine-900/60 backdrop-blur-sm border border-white/15 px-2.5 py-1 text-xs text-pine-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            {translateSync("Issued")}
          </span>
        }
      >
        <dl className="grid grid-cols-2 gap-1.5 text-[13px]">
          {maker && (
            <div className="col-span-2 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md px-3 py-2 min-w-0">
              <dt className="text-[11px] uppercase tracking-wide text-white/60">{translateSync("Made by")}</dt>
              <dd className="truncate font-medium">{translateSync(maker)}</dd>
            </div>
          )}
          {origin && (
            <div className="col-span-2 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md px-3 py-2 min-w-0">
              <dt className="text-[11px] uppercase tracking-wide text-white/60">{translateSync("Origin")}</dt>
              <dd className="truncate font-medium">{origin}</dd>
            </div>
          )}
          {kgDiverted != null && (
            <div className="rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md px-3 py-2 min-w-0">
              <dt className="text-[11px] uppercase tracking-wide text-white/60">{translateSync("Diverted")}</dt>
              <dd className="tabular font-medium">{formatNumber(kgDiverted)} kg</dd>
            </div>
          )}
          {issuedAt && (
            <div className="rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md px-3 py-2 min-w-0">
              <dt className="text-[11px] uppercase tracking-wide text-white/60">{translateSync("Issued")}</dt>
              <dd className="truncate font-medium">{formatDate(new Date(issuedAt))}</dd>
            </div>
          )}
        </dl>

        <div className="mt-3 pt-3 border-t-2 border-dashed border-white/25">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md p-2.5">
            <div className="min-w-0 pl-1">
              <p className="text-[11px] uppercase tracking-wide text-white/60">{translateSync("Serial")}</p>
              <p className="font-mono-data text-[15px] tracking-wide break-all">{serial}</p>
              <p className="mt-1 text-xs text-white/70 leading-snug">{translateSync("Scan to open the public record.")}</p>
            </div>
            <QRCodeViewer value={verifyUrl} size={76} level="M" className="shrink-0" />
          </div>
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

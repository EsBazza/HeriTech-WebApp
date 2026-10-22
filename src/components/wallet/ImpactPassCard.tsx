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
    <div className={cn("@container space-y-3 w-full max-w-[23rem] mx-auto", className)}>
      <PassShell
        image={image}
        title={title}
        ariaLabel={`${translateSync("Verified Impact Pass")} ${serial}`}
        badge={
          <span className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/15 px-2 py-0.5 text-[11px] font-medium text-pine-200">
            <ShieldCheck className="w-3 h-3" />
            {translateSync("Issued")}
          </span>
        }
        meta={[maker && translateSync(maker), origin].filter(Boolean).join(" · ")}
        footer={
          <>
            <div className="flex items-baseline justify-between gap-2 text-[11.5px] text-white/75">
              {kgDiverted != null && (
                <span>
                  <span className="tabular font-semibold text-white">{formatNumber(kgDiverted)} kg</span> {translateSync("diverted")}
                </span>
              )}
              {issuedAt && <span className="truncate">{formatDate(new Date(issuedAt))}</span>}
            </div>
            <p className="pass-serial mt-1 font-mono-data text-[12.5px] tracking-[0.14em] text-white/95 truncate">{serial}</p>
          </>
        }
        code={
          <span className="block rounded-lg bg-white p-1 shadow-card">
            <QRCodeViewer value={verifyUrl} size={60} level="M" className="block" />
          </span>
        }
      />

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

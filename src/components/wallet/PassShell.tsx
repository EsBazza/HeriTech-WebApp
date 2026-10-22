"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { useTranslation } from "@/contexts/TranslationContext";
import { cn } from "@/components/ui";

interface PassShellProps {
  /** The piece's own photo: it is the face of the card. Falls back to the pine card. */
  image?: string | null;
  title: string;
  /** Small chip next to the brand, e.g. "Issued" or "Preview". */
  badge: React.ReactNode;
  /** One or two short lines under the title (maker, origin). */
  meta: React.ReactNode;
  /** Bottom-left: figures and the serial. */
  footer: React.ReactNode;
  /** Bottom-right: the QR code (or its placeholder). */
  code: React.ReactNode;
  ariaLabel: string;
  className?: string;
}

/**
 * The Verified Impact Pass as a real card: ID-1 proportions (85.6 × 54 mm, the
 * shape of a bank or transit card), the piece's photo across the whole face,
 * a dark wash on the reading side so the words stay crisp, and the QR on the
 * right. When it appears the photo pulls into focus, lantern light drifts across
 * and the hologram seal is stamped on; on a mouse the card tilts and a foil sheen
 * follows the cursor. Static under reduced motion.
 */
export function PassShell({ image, title, badge, meta, footer, code, ariaLabel, className }: PassShellProps) {
  const { translateSync } = useTranslation();
  const ref = useRef<HTMLElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (e.pointerType !== "mouse" || !el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--tilt-x", `${((0.5 - y) * 8).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${((x - 0.5) * 10).toFixed(2)}deg`);
    el.style.setProperty("--hx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--hy", `${(y * 100).toFixed(1)}%`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div className={cn("pass-stage w-full max-w-[23rem] mx-auto", className)} onPointerMove={onMove} onPointerLeave={reset}>
      <article ref={ref} className={cn("pass-card id-card relative overflow-hidden text-white", image && "pass-photo")} aria-label={ariaLabel}>
        {image && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URLs and demo SVGs, sized by the card */}
            <img src={image} alt="" className="pass-bg" />
            <span aria-hidden className="pass-duotone" />
            <span aria-hidden className="pass-light" />
          </>
        )}
        <span aria-hidden className="pass-scrim" />
        <span aria-hidden className="pass-grain" />
        <span aria-hidden className="pass-holo" />
        <span aria-hidden className="pass-sheen" />
        <span aria-hidden className="pass-edge" />

        <div className="relative h-full px-[5.5%] py-[5%] flex flex-col">
          {/* Brand row */}
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="w-6 h-6 shrink-0 rounded-full bg-white/95 flex items-center justify-center">
                <Image src="/logo_heritech-removebg-preview.png" alt="" width={18} height={18} className="w-[18px] h-[18px] object-contain" />
              </span>
              <span className="text-[13px] font-semibold tracking-wide">HeriTech</span>
            </span>
            {badge}
          </div>

          {/* Reading column on the left, the code on the right */}
          <div className="mt-auto flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[rgb(242_166_90)]">{translateSync("Verified Impact Pass")}</p>
              <p className="pass-title mt-0.5 font-display text-[20px] leading-[1.05] font-semibold line-clamp-2">{translateSync(title)}</p>
              <div className="mt-1 text-[11.5px] leading-snug text-white/75 truncate">{meta}</div>
              <div className="mt-2 pt-2 border-t border-white/15">{footer}</div>
            </div>
            <div className="relative shrink-0">
              <PassSeal className="absolute -left-5 -top-6 z-10" />
              {code}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

/** The round HeriTech hologram seal, stamped on when the pass appears. */
function PassSeal({ className }: { className?: string }) {
  const { translateSync } = useTranslation();
  const text = `${translateSync("Verified")} · HeriTech · ${translateSync("Traced")} · `;
  return (
    <svg viewBox="0 0 100 100" className={cn("pass-seal w-11 h-11 shrink-0", className)} aria-hidden>
      <defs>
        <path id="pass-seal-ring" d="M50 50 m -36 0 a 36 36 0 1 1 72 0 a 36 36 0 1 1 -72 0" />
      </defs>
      <circle cx="50" cy="50" r="47" fill="rgb(196 71 30 / 0.95)" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(255 255 255 / 0.55)" strokeWidth="1" strokeDasharray="2 3" />
      <text fontSize="11" fontWeight="700" letterSpacing="1.6" fill="#fff">
        <textPath href="#pass-seal-ring">{text.toUpperCase()}</textPath>
      </text>
      <path d="M38 51 l8 8 l16 -18" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { useTranslation } from "@/contexts/TranslationContext";
import { cn } from "@/components/ui";

interface PassShellProps {
  /** The piece's own photo: it is the face of the pass. Falls back to the pine card. */
  image?: string | null;
  title: string;
  /** Top-right chip, e.g. "Issued" or "Preview". */
  badge: React.ReactNode;
  /** Details under the title: maker, origin, serial, QR… */
  children: React.ReactNode;
  ariaLabel: string;
  /** Where the ticket notches sit, measured up from the bottom (the dashed tear line). */
  notchFromBottom?: number;
  className?: string;
}

/**
 * The Verified Impact Pass card, cut like a ticket. The piece's own photo fills the
 * card, softened and toned in pine and lantern amber like a silhouette print, with
 * the details over it. When it appears the photo pulls into focus, a band of
 * lantern light drifts across and the seal is stamped on; on a mouse the card tilts,
 * a foil sheen follows the cursor and the piece sharpens. Static under reduced motion.
 */
export function PassShell({ image, title, badge, children, ariaLabel, notchFromBottom = 150, className }: PassShellProps) {
  const { translateSync } = useTranslation();
  const ref = useRef<HTMLElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (e.pointerType !== "mouse" || !el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--tilt-x", `${((0.5 - y) * 7).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${((x - 0.5) * 9).toFixed(2)}deg`);
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
    <div className={cn("pass-stage w-full max-w-[19rem] mx-auto", className)} onPointerMove={onMove} onPointerLeave={reset}>
      <article
        ref={ref}
        className={cn("pass-card ticket relative overflow-hidden rounded-[20px] text-white shadow-pop", image && "pass-photo")}
        style={{ ["--notch-y" as string]: `calc(100% - ${notchFromBottom}px)` }}
        aria-label={ariaLabel}
      >
        {image && (
          <>
            {/* The piece fills the card, softened and toned so the words stay readable */}
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

        <div className="relative p-4 flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 shrink-0 rounded-full bg-white/95 flex items-center justify-center shadow-card">
                <Image src="/logo_heritech-removebg-preview.png" alt="" width={22} height={22} className="w-5 h-5 object-contain" />
              </span>
              <span className="text-[13px] font-medium leading-tight">
                HeriTech
                <span className="block text-xs text-white/70 font-normal">{translateSync("Verified Impact Pass")}</span>
              </span>
            </span>
            {badge}
          </div>

          {/* Room for the piece to show through before the details begin */}
          <div aria-hidden className={image ? "h-20" : "h-2"} />

          <div className="flex items-end justify-between gap-2">
            <p className="pass-title font-display text-[23px] leading-[1.1] font-semibold">{translateSync(title)}</p>
            <PassSeal />
          </div>
          <span aria-hidden className="pass-rule mt-2 block h-px w-14 bg-gradient-to-r from-[rgb(242_166_90)] to-transparent" />

          <div className="mt-3">{children}</div>
        </div>
      </article>
    </div>
  );
}

/** The round HeriTech seal, stamped on when the pass appears. */
function PassSeal({ className }: { className?: string }) {
  const { translateSync } = useTranslation();
  const text = `${translateSync("Verified")} · HeriTech · ${translateSync("Traced")} · `;
  return (
    <svg viewBox="0 0 100 100" className={cn("pass-seal w-14 h-14 shrink-0", className)} aria-hidden>
      <defs>
        <path id="pass-seal-ring" d="M50 50 m -36 0 a 36 36 0 1 1 72 0 a 36 36 0 1 1 -72 0" />
      </defs>
      <circle cx="50" cy="50" r="47" fill="rgb(196 71 30 / 0.92)" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(255 255 255 / 0.55)" strokeWidth="1" strokeDasharray="2 3" />
      <text fontSize="10.5" fontWeight="600" letterSpacing="1.6" fill="#fff">
        <textPath href="#pass-seal-ring">{text.toUpperCase()}</textPath>
      </text>
      <path d="M38 51 l8 8 l16 -18" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
 * The Verified Impact Pass card, cut like a ticket. The piece's photo is the card:
 * a soft blurred wash of its colours behind, and the piece itself in an arched
 * window, toned in pine and lantern amber, that comes into full colour as you
 * look closer (hover, or a moment after it appears on touch screens). On a mouse
 * it tilts and a foil sheen follows the cursor; the seal is stamped on when it
 * first appears. Static under reduced motion.
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
    <div className={cn("pass-stage", className)} onPointerMove={onMove} onPointerLeave={reset}>
      <article
        ref={ref}
        className={cn("pass-card ticket relative overflow-hidden rounded-[22px] text-white shadow-pop", image && "pass-photo")}
        style={{ ["--notch-y" as string]: `calc(100% - ${notchFromBottom}px)` }}
        aria-label={ariaLabel}
      >
        {image && (
          // A soft, blurred wash of the piece's own colours behind everything
          // eslint-disable-next-line @next/next/no-img-element -- data URLs and demo SVGs, sized by the card
          <img src={image} alt="" className="pass-bg" />
        )}
        <span aria-hidden className="pass-scrim" />
        <span aria-hidden className="pass-holo" />
        <span aria-hidden className="pass-sheen" />

        <div className="relative p-5 flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 shrink-0 rounded-full bg-white/95 flex items-center justify-center shadow-card">
                <Image src="/logo_heritech-removebg-preview.png" alt="" width={24} height={24} className="w-6 h-6 object-contain" />
              </span>
              <span className="text-sm font-medium leading-tight">
                HeriTech
                <span className="block text-xs text-white/70 font-normal">{translateSync("Verified Impact Pass")}</span>
              </span>
            </span>
            {badge}
          </div>

          {image ? (
            <>
              {/* The piece in an arched window: lantern-toned until you look closer */}
              <div className="relative mx-auto mt-5 w-[64%] max-w-[15rem]">
                <div className="pass-window arch">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="pass-window-img" />
                  <span aria-hidden className="pass-duotone" />
                  <span aria-hidden className="pass-window-glare" />
                </div>
                <PassSeal className="absolute -right-6 -bottom-4" />
              </div>
              <p className="mt-5 text-center font-display text-[26px] leading-tight font-semibold">{translateSync(title)}</p>
              <span aria-hidden className="mx-auto mt-2 block h-px w-16 bg-gradient-to-r from-transparent via-[rgb(242_166_90)] to-transparent" />
            </>
          ) : (
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="font-display text-[26px] leading-tight font-semibold">{translateSync(title)}</p>
              <PassSeal />
            </div>
          )}

          <div className="mt-4">{children}</div>
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
    <svg viewBox="0 0 100 100" className={cn("pass-seal w-16 h-16 shrink-0", className)} aria-hidden>
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

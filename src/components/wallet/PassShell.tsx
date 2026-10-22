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
  className?: string;
}

/**
 * The Verified Impact Pass card. The product photo fills the card; details sit
 * on a dark glass panel at the foot. On a mouse it tilts and a foil sheen follows
 * the cursor; when it first appears the photo settles into focus, a light sweep
 * passes over and the HeriTech seal is stamped on. Static under reduced motion.
 */
export function PassShell({ image, title, badge, children, ariaLabel, className }: PassShellProps) {
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
      <article ref={ref} className={cn("pass-card relative overflow-hidden rounded-[20px] text-white shadow-pop", image && "pass-photo")} aria-label={ariaLabel}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- data URLs and demo SVGs, sized by the card
          <img src={image} alt="" className="pass-photo-img absolute inset-0 w-full h-full object-cover" />
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
              <span className="text-sm font-medium leading-tight drop-shadow">
                HeriTech
                <span className="block text-xs text-white/75 font-normal">{translateSync("Verified Impact Pass")}</span>
              </span>
            </span>
            {badge}
          </div>

          {/* Leaves the photo visible between the header and the details */}
          <div aria-hidden className={image ? "h-40 sm:h-48" : "h-3"} />

          <div className="flex items-end justify-between gap-3">
            <p className="font-display text-[26px] leading-tight font-semibold drop-shadow-[0_1px_8px_rgb(0_0_0/0.45)]">{translateSync(title)}</p>
            <PassSeal />
          </div>

          <div className="pass-panel mt-3 -mx-5 -mb-5 px-5 pb-5 pt-4">{children}</div>
        </div>
      </article>
    </div>
  );
}

/** The round HeriTech seal, stamped on when the pass appears. */
function PassSeal() {
  const { translateSync } = useTranslation();
  const text = `${translateSync("Verified")} · HeriTech · ${translateSync("Traced")} · `;
  return (
    <svg viewBox="0 0 100 100" className="pass-seal w-16 h-16 shrink-0" aria-hidden>
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

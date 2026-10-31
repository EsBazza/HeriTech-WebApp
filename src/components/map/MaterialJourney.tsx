"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Box } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useInView } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { cn, useMediaQuery } from "@/components/ui";
import type { ProductView } from "@/lib/server/views";

// The 3D map only loads in the browser, and only on product pages.
const Journey3D = dynamic(() => import("./Journey3D").then((m) => m.Journey3D), { ssr: false });

type LatLng = { lat: number; lng: number };

function kmBetween(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 2 * 6_371 * Math.asin(Math.sqrt(h));
}

interface Stop {
  tone: "collect" | "handover" | "workshop";
  when?: string | null;
  title: string;
  detail?: string;
}

/**
 * "Follow the material": the route a piece's material took, told as three stops
 * beside the 3D map of the same route. The stops draw in as the section enters.
 */
export function MaterialJourney({ product }: { product: ProductView }) {
  const { translateSync, translateTemplate, formatDate, formatNumber } = useTranslation();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [show3D, setShow3D] = useState(false);
  const { ref, inView } = useInView<HTMLOListElement>();

  const batch = product.sourceBatch;
  if (!batch) return null;

  const makerName = product.artisan?.fullName || translateSync("the artisan");
  const workshopName = product.artisan?.workshopName || "";
  const country = batch.agreement?.country || product.artisan?.country || "";
  const festival = batch.agreement?.festival || "";
  const material = translateSync(batch.materialType || "material").toLowerCase();
  const collection = { lat: batch.gpsLat, lng: batch.gpsLng };
  const workshop =
    product.artisan?.workshopLat != null && product.artisan?.workshopLng != null
      ? { lat: product.artisan.workshopLat, lng: product.artisan.workshopLng }
      : null;
  const km = workshop ? kmBetween(collection, workshop) : null;
  const date = (iso?: string | null) => (iso ? formatDate(new Date(iso)) : null);
  const officer = batch.scannedByOfficer?.stationName || batch.scannedByOfficer?.fullName;

  const stops: Stop[] = [
    {
      tone: "collect",
      when: date(batch.createdAt),
      title: batch.pickupAddress || (festival ? translateTemplate("Collected after {festival}", { festival: translateSync(festival) }) : translateSync("Collected")),
      detail: [
        translateTemplate("{kg} kg of {material}", { kg: formatNumber(batch.weightKg), material }),
        officer ? translateTemplate("logged by {officer}", { officer: translateSync(officer) }) : translateSync("logged by a local government officer"),
      ].join(", "),
    },
    {
      tone: "handover",
      when: date(batch.claimedAt),
      title: translateTemplate("Picked up by {maker}", { maker: translateSync(makerName) }),
      detail: translateSync("The officer checked the handover code, so custody passed on the record."),
    },
    {
      tone: "workshop",
      title: translateTemplate("Made into this piece at {place}", {
        place: [workshopName, country].filter(Boolean).map((p) => translateSync(p)).join(", ") || translateSync("the workshop"),
      }),
      detail: translateSync(product.title),
    },
  ];

  const summary = km != null
    ? translateTemplate("This {material} travelled {km} km from where it was collected to the workshop that made your piece.", { material, km: km.toFixed(1) })
    : translateSync("Pinned on the map where a local government officer collected it.");

  return (
    <section id="journey" className="journey scroll-mt-24 rounded-lg bg-pine-900 text-white overflow-hidden grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
        <h2 className="font-display text-[32px] sm:text-[38px] leading-[1.05] font-semibold text-white tracking-[-0.01em]">
          {translateSync("Follow the material")}
        </h2>
        <p className="mt-3 text-[16px] leading-relaxed text-white/85 max-w-[44ch]">{summary}</p>

        <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 max-w-[420px]">
          {km != null && (
            <div>
              <dt className="sr-only">{translateSync("Distance")}</dt>
              <dd className="font-display text-[52px] leading-none font-semibold text-glow tabular-nums">
                <CountUp value={km} decimals={1} format={(n) => n.toFixed(1)} />
                <span className="ml-1.5 font-sans text-[17px] font-medium text-white/80">km</span>
              </dd>
              <p className="mt-1.5 text-[14px] text-white/70">{translateSync("collection point to workshop")}</p>
            </div>
          )}
          <div>
            <dt className="sr-only">{translateSync("Weight recovered")}</dt>
            <dd className="font-display text-[52px] leading-none font-semibold tabular-nums">
              <CountUp value={batch.weightKg} decimals={1} format={(n) => formatNumber(Number(n.toFixed(1)))} />
              <span className="ml-1.5 font-sans text-[17px] font-medium text-white/80">kg</span>
            </dd>
            <p className="mt-1.5 text-[14px] text-white/70">{translateTemplate("of {material} recovered", { material })}</p>
          </div>
        </dl>

        {/* The route, stop by stop: the line draws down and a stitch travels along it */}
        <ol ref={ref} data-on={inView} className="journey-route relative mt-9 space-y-6">
          <span aria-hidden className="route-line absolute left-[11px] top-3 bottom-3 w-[2px] bg-white/15 overflow-hidden">
            <span className="journey-line-fill absolute inset-0 bg-lantern" />
            <span className="journey-stitch absolute inset-0">
              <span className="block w-full h-6 bg-glow" />
            </span>
          </span>
          {stops.map((s, i) => (
            <li key={s.tone} className="journey-stop relative grid grid-cols-[24px_1fr] gap-4" style={{ "--i": i } as React.CSSProperties}>
              <span
                aria-hidden
                className={cn(
                  "journey-dot relative mt-1 w-6 h-6 rounded-full flex items-center justify-center",
                  s.tone === "collect" && "bg-lantern",
                  s.tone === "handover" && "bg-pine-700 ring-2 ring-inset ring-white/60",
                  s.tone === "workshop" && "bg-split-lgu"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-pine-900" />
              </span>
              <div className="min-w-0">
                {s.when && <p className="text-[14px] text-white/65">{s.when}</p>}
                <p className="text-[17px] leading-snug font-medium text-white">{s.title}</p>
                {s.detail && <p className="mt-0.5 text-[15px] leading-relaxed text-white/75">{s.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative min-h-[300px] sm:min-h-[380px] lg:min-h-[560px] bg-pine-800">
        {isDesktop || show3D ? (
          <Journey3D
            collection={{ ...collection, label: translateSync("Collected here") }}
            workshop={workshop ? { ...workshop, label: workshopName || makerName } : null}
          />
        ) : (
          // The photorealistic 3D map is heavy on phone data and battery, so it waits for a tap.
          <button
            type="button"
            onClick={() => setShow3D(true)}
            className="journey-poster group absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center cursor-pointer"
          >
            <svg viewBox="0 0 320 120" className="w-full max-w-[300px] h-auto" aria-hidden>
              <path d="M40 92 C 110 10, 210 10, 280 70" fill="none" stroke="rgb(242 166 90 / 0.75)" strokeWidth="2.5" strokeDasharray="3 8" strokeLinecap="round" className="journey-poster-route" />
              <circle cx="40" cy="92" r="9" fill="#c4471e" />
              <circle cx="40" cy="92" r="9" fill="none" stroke="#c4471e" className="journey-ping" />
              <circle cx="280" cy="70" r="9" fill="#8fb09c" />
            </svg>
            <span className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-white text-pine-900 text-[16px] font-medium transition-transform group-active:scale-[0.97]">
              <Box className="w-5 h-5" strokeWidth={1.75} />
              {translateSync("Show the 3D journey")}
            </span>
            <span className="text-[14px] text-white/70">{translateSync("Google Maps 3D, from collection point to workshop")}</span>
          </button>
        )}
      </div>
    </section>
  );
}

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { useTranslation } from "@/contexts/TranslationContext";
import { buttonClass } from "@/components/ui";

interface Stop {
  lat: number;
  lng: number;
  label: string;
}

interface Journey3DProps {
  /** Where the material was collected (the source batch's GPS position). */
  collection: Stop;
  /** The artisan's workshop, when they have chosen to show it. */
  workshop?: Stop | null;
}

type LatLng = google.maps.LatLngLiteral;

function metresBetween(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** Points along a raised arc between two stops, so the route reads clearly over 3D buildings. */
function arc(a: LatLng, b: LatLng, points = 48): google.maps.LatLngAltitudeLiteral[] {
  const peak = Math.min(Math.max(metresBetween(a, b) * 0.15, 150), 4_000);
  return Array.from({ length: points + 1 }, (_, i) => {
    const t = i / points;
    return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t, altitude: Math.sin(Math.PI * t) * peak };
  });
}

/** Where every flight starts: high above the collection point, looking straight down. */
const START_VIEW = (center: google.maps.LatLngAltitudeLiteral) => ({ center, range: 25_000, tilt: 0, heading: 0 });

const supportsWebGL = () => {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
};

/**
 * Google Earth-style flight over a product's journey: the camera arrives at the
 * collection point, circles it, then follows a raised line to the workshop.
 * Loads only when scrolled into view, skips the flight for reduced-motion users,
 * and falls back to a flat Google map when 3D isn't available.
 */
export function Journey3D({ collection, workshop }: Journey3DProps) {
  const { translateSync } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.maps3d.Map3DElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"loading" | "3d" | "2d" | "error">("loading");
  const [playing, setPlaying] = useState(false);
  const runRef = useRef(0);
  const stopRef = useRef<() => void>(() => {});

  // Wait until the section is on screen; 3D tiles are heavy on phones.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const play = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const start = { lat: collection.lat, lng: collection.lng, altitude: 0 };
    const close = { center: start, range: 900, tilt: 62, heading: 25 };
    const overview = workshop
      ? {
          center: { lat: (collection.lat + workshop.lat) / 2, lng: (collection.lng + workshop.lng) / 2, altitude: 0 },
          range: Math.max(metresBetween(collection, workshop) * 2.2, 1_500),
          tilt: 50,
          heading: 0,
        }
      : null;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      Object.assign(map, overview ?? close);
      return;
    }

    // Every run starts from the same raised view, so Replay always visibly moves.
    Object.assign(map, START_VIEW(start));

    // Short steps (about 7 s in total, 9 s with a workshop) so the flight never feels stuck.
    const steps: { run: () => void; ms: number }[] = [
      { run: () => map.flyCameraTo({ endCamera: close, durationMillis: 2_000 }), ms: 2_000 },
      { run: () => map.flyCameraAround({ camera: close, durationMillis: 5_000, rounds: 1 }), ms: 5_000 },
      ...(overview ? [{ run: () => map.flyCameraTo({ endCamera: overview, durationMillis: 2_000 }), ms: 2_000 }] : []),
    ];

    const run = ++runRef.current;
    let next = 0;
    let stepStarted = 0;
    let stepMs = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const advance = () => {
      clearTimeout(timer);
      if (run !== runRef.current) return; // a newer replay took over
      if (next < steps.length) {
        const step = steps[next++];
        stepStarted = Date.now();
        stepMs = step.ms;
        step.run();
        // Google doesn't always report the end of a move, so never wait much longer than the move itself.
        timer = setTimeout(advance, step.ms + 1_000);
      } else {
        map.removeEventListener("gmp-animationend", onAnimationEnd);
        setPlaying(false);
      }
    };
    // While the map is still loading it can report an end straight away; ignore those.
    const onAnimationEnd = () => {
      if (Date.now() - stepStarted >= stepMs * 0.8) advance();
    };
    map.stopCameraAnimation();
    map.addEventListener("gmp-animationend", onAnimationEnd);
    stopRef.current = () => {
      clearTimeout(timer);
      map.removeEventListener("gmp-animationend", onAnimationEnd);
    };
    setPlaying(true);
    advance();
  }, [collection, workshop]);

  useEffect(() => {
    if (!visible || !containerRef.current) return;
    const container = containerRef.current;
    let cancelled = false;

    const flat = async () => {
      const maps = await loadGoogleMaps();
      if (cancelled) return;
      const map = new maps.Map(container, {
        center: collection,
        zoom: 15,
        mapTypeId: "hybrid",
        streetViewControl: false,
        mapTypeControl: false,
        gestureHandling: "cooperative",
      });
      new maps.Marker({ map, position: collection, title: collection.label });
      if (workshop) {
        new maps.Marker({ map, position: workshop, title: workshop.label });
        new maps.Polyline({ map, path: [collection, workshop], strokeColor: "#c2602f", strokeWeight: 4 });
        const bounds = new maps.LatLngBounds();
        bounds.extend(collection);
        bounds.extend(workshop);
        map.fitBounds(bounds, 48);
      }
      setMode("2d");
    };

    (async () => {
      try {
        if (!supportsWebGL()) return await flat();
        await loadGoogleMaps();
        const { Map3DElement, Marker3DElement, Polyline3DElement } = (await google.maps.importLibrary("maps3d")) as google.maps.Maps3DLibrary;
        if (cancelled) return;

        const map = new Map3DElement({
          ...START_VIEW({ lat: collection.lat, lng: collection.lng, altitude: 0 }),
          mode: "SATELLITE",
          gestureHandling: "COOPERATIVE",
        });
        map.style.display = "block";
        map.style.height = "100%";
        map.addEventListener("gmp-error", () => {
          if (cancelled) return;
          map.remove();
          flat().catch(() => setMode("error"));
        });

        map.append(new Marker3DElement({ position: collection, label: collection.label, altitudeMode: "CLAMP_TO_GROUND", extruded: true }));
        if (workshop) {
          map.append(new Marker3DElement({ position: workshop, label: workshop.label, altitudeMode: "CLAMP_TO_GROUND", extruded: true }));
          map.append(
            new Polyline3DElement({
              path: arc(collection, workshop),
              altitudeMode: "RELATIVE_TO_GROUND",
              strokeColor: "#c2602f",
              strokeWidth: 6,
              outerColor: "#ffffff",
              outerWidth: 0.4,
              drawsOccludedSegments: true,
            })
          );
        }

        container.replaceChildren(map);
        mapRef.current = map;
        setMode("3d");
        play();
      } catch {
        if (!cancelled) await flat().catch(() => setMode("error"));
      }
    })();

    const runs = runRef;
    const stopRun = stopRef;
    return () => {
      cancelled = true;
      runs.current++; // invalidates any flight still in progress
      stopRun.current();
      mapRef.current?.stopCameraAnimation();
      mapRef.current = null;
    };
    // Build once per journey; `play` only changes with the stops themselves.
  }, [visible, collection.lat, collection.lng, workshop?.lat, workshop?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2">
      <div className="relative h-[320px] sm:h-[420px] rounded-lg overflow-hidden border border-white/10 bg-pine-800">
        <div ref={containerRef} className="absolute inset-0" />
        {mode === "loading" && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">{translateSync("Loading the 3D view…")}</p>
        )}
        {mode === "error" && (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
            {translateSync("The map couldn't load here. The timeline below still shows every step.")}
          </p>
        )}
        {mode === "3d" && (
          <button type="button" onClick={play} disabled={playing} className={buttonClass("secondary", "sm", "absolute top-3 left-3 shadow-card")}>
            <RotateCcw className="w-3.5 h-3.5" />
            {translateSync(playing ? "Flying…" : "Replay journey")}
          </button>
        )}
      </div>
      <p className="text-xs text-white/60">
        {workshop
          ? translateSync("From the collection point to the artisan's workshop, in Google's photorealistic 3D map.")
          : translateSync("The collection point where this material was recovered, in Google's photorealistic 3D map.")}
      </p>
    </div>
  );
}

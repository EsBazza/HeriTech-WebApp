"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

export type RouteMode = "DRIVING" | "WALKING";

export interface RouteStep {
  instruction: string;
  distance: string;
}

export interface RouteInfo {
  path: google.maps.LatLngLiteral[];
  distance: string;
  duration: string;
  steps: RouteStep[];
}

type LatLng = google.maps.LatLngLiteral;

/** Leaving the drawn route by more than this many metres asks Google for a new one. */
const OFF_ROUTE_METRES = 50;
/** Never ask for a new route more often than this, however noisy the GPS is. */
const MIN_REROUTE_MS = 15_000;

function metresBetween(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

const offRoute = (position: LatLng, path: LatLng[]) => !path.some((point) => metresBetween(position, point) < OFF_ROUTE_METRES);

async function computeRoute(origin: LatLng, destination: LatLng, mode: RouteMode): Promise<RouteInfo> {
  await loadGoogleMaps();
  const { Route } = (await google.maps.importLibrary("routes")) as google.maps.RoutesLibrary;
  const { routes } = await Route.computeRoutes({
    origin,
    destination,
    travelMode: mode,
    fields: ["path", "localizedValues", "legs"],
  });
  const route = routes?.[0];
  if (!route?.path?.length) throw new Error("Google couldn't find a route to this batch.");

  return {
    path: route.path.map((p) => ({ lat: p.lat, lng: p.lng })),
    distance: String(route.localizedValues?.distance ?? ""),
    duration: String(route.localizedValues?.duration ?? ""),
    steps: (route.legs ?? []).flatMap((leg) =>
      leg.steps
        .filter((step) => step.instructions)
        .map((step) => ({ instruction: step.instructions ?? "", distance: step.localizedValues?.distance ?? "" }))
    ),
  };
}

/**
 * Turn-by-turn route from the user's live position to a batch, drawn inside the app.
 * The position is watched while the route is open, and the route is recomputed only
 * when the user strays from it.
 */
export function useRoute(destination: LatLng | null) {
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<RouteMode>("DRIVING");
  const [position, setPosition] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRouteAt = useRef(0);
  const requestId = useRef(0);

  const stop = useCallback(() => {
    setActive(false);
    setRoute(null);
    setError(null);
    setLoading(false);
  }, []);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setError("This browser can't share its location.");
      return;
    }
    setError(null);
    setActive(true);
  }, []);

  // Watch the position while the route is open.
  useEffect(() => {
    if (!active) return;
    setLoading(true);
    const watchId = navigator.geolocation.watchPosition(
      (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => {
        setError(`Couldn't get your location (${e.message}).`);
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [active]);

  // A new destination or travel mode always needs a fresh route.
  useEffect(() => {
    setRoute(null);
    lastRouteAt.current = 0;
  }, [destination?.lat, destination?.lng, mode]);

  // Ask for a route on the first fix, and again when the user leaves it.
  useEffect(() => {
    if (!active || !position || !destination) return;
    const due = !route || (offRoute(position, route.path) && Date.now() - lastRouteAt.current > MIN_REROUTE_MS);
    if (!due) return;

    lastRouteAt.current = Date.now();
    const id = ++requestId.current;
    setLoading(true);
    computeRoute(position, destination, mode)
      .then((next) => {
        if (id !== requestId.current) return;
        setRoute(next);
        setError(null);
      })
      .catch((e: Error) => id === requestId.current && setError(e.message))
      .finally(() => id === requestId.current && setLoading(false));
  }, [active, position, destination, mode, route]);

  return { active, start, stop, mode, setMode, position, route, loading, error };
}

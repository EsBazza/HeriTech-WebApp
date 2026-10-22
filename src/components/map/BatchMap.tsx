"use client";

import React, { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { useTranslation } from "@/contexts/TranslationContext";

export interface MapBatch {
  id: string;
  title: string;
  status: "available" | "reserved" | "claimed";
  gpsLat: number;
  gpsLng: number;
  weightKg: number;
}

// Google Maps needs literal colours; these match the success, lantern and ink-3 tokens in globals.css.
const STATUS_COLOR: Record<MapBatch["status"], string> = {
  available: "#2f6b4f",
  reserved: "#c4471e",
  claimed: "#5f6661",
};

interface BatchMapProps {
  batches: MapBatch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Route drawn from the user to a batch, if one is open. */
  route?: google.maps.LatLngLiteral[] | null;
  /** The user's live position while a route is open. */
  userPosition?: google.maps.LatLngLiteral | null;
  /** Changing this number pans the map back to the user. */
  recenterSignal?: number;
}

/** Google map of every batch, coloured by status. Clicking a pin selects the batch. */
export function BatchMap({ batches, selectedId, onSelect, route, userPosition, recenterSignal }: BatchMapProps) {
  const { translateSync } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef(new Map<string, google.maps.Marker>());
  const onSelectRef = useRef(onSelect);
  const fittedRef = useRef(false);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  onSelectRef.current = onSelect;

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: { lat: 16.4, lng: 110 },
          zoom: 4,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "cooperative",
        });
        setMapReady(true);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync markers with the batch list and fit them in view.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const maps = window.google.maps;
    const markers = markersRef.current;
    const bounds = new maps.LatLngBounds();

    for (const [id, marker] of markers) {
      if (!batches.some((b) => b.id === id)) {
        marker.setMap(null);
        markers.delete(id);
      }
    }

    for (const batch of batches) {
      const position = { lat: batch.gpsLat, lng: batch.gpsLng };
      bounds.extend(position);
      let marker = markers.get(batch.id);
      if (!marker) {
        marker = new maps.Marker({ map, position });
        marker.addListener("click", () => onSelectRef.current(batch.id));
        markers.set(batch.id, marker);
      }
      const selected = batch.id === selectedId;
      marker.setTitle(`${batch.id} · ${batch.title} · ${batch.weightKg} kg`);
      marker.setZIndex(selected ? 10 : 1);
      marker.setIcon({
        path: maps.SymbolPath.CIRCLE,
        scale: selected ? 11 : 8,
        fillColor: STATUS_COLOR[batch.status],
        fillOpacity: 1,
        strokeColor: selected ? "#1b1f1c" : "#ffffff",
        strokeWeight: selected ? 3 : 2,
      });
    }

    // Fit all pins once, when the first batch list arrives.
    if (batches.length > 0 && !fittedRef.current) {
      map.fitBounds(bounds, 48);
      fittedRef.current = true;
    }
  }, [batches, selectedId, mapReady]);

  // Draw the route and fit it in view whenever a new one arrives.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    routeLineRef.current?.setMap(null);
    routeLineRef.current = null;
    if (!route?.length) return;
    const maps = window.google.maps;
    routeLineRef.current = new maps.Polyline({ map, path: route, strokeColor: "#1a73e8", strokeOpacity: 0.9, strokeWeight: 6, zIndex: 5 });
    const bounds = new maps.LatLngBounds();
    route.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, 48);
  }, [route, mapReady]);

  // Live "you are here" dot.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    if (!userPosition) {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      return;
    }
    const maps = window.google.maps;
    userMarkerRef.current ??= new maps.Marker({
      map,
      zIndex: 20,
      title: translateSync("You are here"),
      icon: { path: maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#1a73e8", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3 },
    });
    userMarkerRef.current.setPosition(userPosition);
  }, [userPosition, mapReady, translateSync]);

  useEffect(() => {
    if (recenterSignal && userPosition && mapRef.current) {
      mapRef.current.panTo(userPosition);
      mapRef.current.setZoom(17);
    }
    // Only an explicit recenter request should move the map, not every GPS update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterSignal]);

  // Bring the selected batch into view.
  useEffect(() => {
    const batch = batches.find((b) => b.id === selectedId);
    if (batch && mapReady && mapRef.current) mapRef.current.panTo({ lat: batch.gpsLat, lng: batch.gpsLng });
  }, [selectedId, batches, mapReady]);

  if (error) {
    return (
      <div role="alert" className="h-[260px] sm:h-[380px] rounded-lg border border-line bg-paper-2 flex items-center justify-center p-6 text-center">
        <p className="text-sm text-ink-3">
          {translateSync(error)} {translateSync("The batch list still works.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Shorter on phones so the batch list starts above the fold */}
        <div ref={containerRef} className="h-[260px] sm:h-[380px] w-full rounded-lg border border-line bg-paper-2" />
        {!mapReady && (
          <div className="absolute inset-0 rounded-lg bg-paper-2 animate-pulse flex items-center justify-center" role="status">
            <span className="text-sm text-ink-3">{translateSync("Loading map…")}</span>
          </div>
        )}
      </div>
      <ul className="flex flex-wrap gap-4 text-sm text-ink-3">
        {(["available", "reserved", "claimed"] as const).map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[status] }} aria-hidden />
            {translateSync(status === "available" ? "Available" : status === "reserved" ? "Reserved" : "Picked up")}
          </li>
        ))}
      </ul>
    </div>
  );
}

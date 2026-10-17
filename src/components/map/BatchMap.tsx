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

const STATUS_COLOR: Record<MapBatch["status"], string> = {
  available: "#2f7a52",
  reserved: "#c2602f",
  claimed: "#8a918c",
};

interface BatchMapProps {
  batches: MapBatch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Google map of every batch, coloured by status. Clicking a pin selects the batch. */
export function BatchMap({ batches, selectedId, onSelect }: BatchMapProps) {
  const { translateSync } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef(new Map<string, google.maps.Marker>());
  const onSelectRef = useRef(onSelect);
  const fittedRef = useRef(false);
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

  // Bring the selected batch into view.
  useEffect(() => {
    const batch = batches.find((b) => b.id === selectedId);
    if (batch && mapReady && mapRef.current) mapRef.current.panTo({ lat: batch.gpsLat, lng: batch.gpsLng });
  }, [selectedId, batches, mapReady]);

  if (error) {
    return (
      <div className="h-full min-h-[220px] rounded-lg border border-line bg-paper-2 flex items-center justify-center p-6 text-center">
        <p className="text-sm text-ink-3">
          {translateSync(error)} {translateSync("The batch list still works.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="h-[320px] sm:h-[380px] w-full rounded-lg border border-line bg-paper-2" />
      <ul className="flex flex-wrap gap-4 text-xs text-ink-3">
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

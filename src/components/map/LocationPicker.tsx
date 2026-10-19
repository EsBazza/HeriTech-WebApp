"use client";

import React, { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { useTranslation } from "@/contexts/TranslationContext";

interface LocationPickerProps {
  lat: number;
  lng: number;
  /** Called when the officer drags the pin or taps the map. */
  onMove: (lat: number, lng: number) => void;
}

const round6 = (n: number) => parseFloat(n.toFixed(6));

/** Small Google map with a draggable pin for fine-tuning a GPS position. */
export function LocationPicker({ lat, lng, onMove }: LocationPickerProps) {
  const { translateSync } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onMoveRef = useRef(onMove);
  const [error, setError] = useState<string | null>(null);

  onMoveRef.current = onMove;

  // Create the map and pin once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const position = { lat, lng };
        const map = new maps.Map(containerRef.current, {
          center: position,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
        });
        const marker = new maps.Marker({ map, position, draggable: true, title: translateSync("Drag to the pickup spot") });
        const report = (latLng: google.maps.LatLng | null | undefined) => {
          if (latLng) onMoveRef.current(round6(latLng.lat()), round6(latLng.lng()));
        };
        marker.addListener("dragend", (e: google.maps.MapMouseEvent) => report(e.latLng));
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) marker.setPosition(e.latLng);
          report(e.latLng);
        });
        mapRef.current = map;
        markerRef.current = marker;
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Follow position changes made outside the map (GPS fix, typed coordinates).
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const current = marker.getPosition();
    if (current && round6(current.lat()) === lat && round6(current.lng()) === lng) return;
    marker.setPosition({ lat, lng });
    mapRef.current?.panTo({ lat, lng });
  }, [lat, lng]);

  if (error) {
    return <p className="text-xs text-ink-3">{translateSync(error)}</p>;
  }

  return (
    <div className="space-y-1.5">
      <div ref={containerRef} className="h-48 rounded-md overflow-hidden border border-line bg-paper-2" />
      <p className="text-xs text-ink-3">{translateSync("Drag the pin or tap the map if the GPS position is off.")}</p>
    </div>
  );
}

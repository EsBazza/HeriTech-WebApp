"use client";

let loading: Promise<typeof google.maps> | undefined;

/**
 * Loads the Google Maps JavaScript API once per page. Rejects when no key is
 * configured or Google refuses the key, so callers can show a fallback.
 */
export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window !== "undefined" && window.google?.maps?.Map) return Promise.resolve(window.google.maps);

  loading ??= new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error("Google Maps is not configured."));
      return;
    }

    const w = window as Window & { __heritechMapsReady?: () => void; gm_authFailure?: () => void };
    w.__heritechMapsReady = () => resolve(window.google.maps);
    // Google calls this when the key is invalid or the Maps JavaScript API is not enabled.
    w.gm_authFailure = () => reject(new Error("Google Maps rejected the API key."));

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=__heritechMapsReady`;
    script.async = true;
    script.onerror = () => reject(new Error("Couldn't load Google Maps. Check your connection."));
    document.head.appendChild(script);
  }).catch((error) => {
    loading = undefined; // allow a retry on the next mount
    throw error;
  }) as Promise<typeof google.maps>;

  return loading;
}

/** A Google Maps link with driving directions to a point. */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Turns a GPS position into a short place name such as "Quiapo, Manila",
 * using the Geocoding service. Resolves to null when nothing useful is found.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  await loadGoogleMaps();
  const { Geocoder } = (await google.maps.importLibrary("geocoding")) as google.maps.GeocodingLibrary;
  const { results } = await new Geocoder().geocode({ location: { lat, lng } });
  if (!results.length) return null;

  const find = (type: string) =>
    results.flatMap((r) => r.address_components).find((c) => c.types.includes(type))?.long_name;
  const parts = [
    find("sublocality_level_1") ?? find("sublocality") ?? find("neighborhood"),
    find("locality") ?? find("administrative_area_level_2"),
    find("country"),
  ].filter((p, i, all): p is string => Boolean(p) && all.indexOf(p) === i);
  return parts.length ? parts.join(", ") : results[0].formatted_address;
}

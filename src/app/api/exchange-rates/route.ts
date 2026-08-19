import { NextResponse } from "next/server";

// Currencies needed for all supported languages in HeriTech
const NEEDED_CURRENCIES = [
  "USD", "CNY", "TWD", "JPY", "KRW", "THB", "VND", "IDR",
  "MYR", "PHP", "INR", "BDT", "PKR", "LKR", "NPR",
  "MMK", "KHR", "LAK", "KZT", "KGS", "UZS",
];

// Static fallback rates (USD base) in case external API is unreachable
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, CNY: 7.25, TWD: 32.5, JPY: 149.5, KRW: 1330,
  THB: 36.2, VND: 24500, IDR: 15800, MYR: 4.72, PHP: 56.5,
  INR: 83.5, BDT: 110, PKR: 280, LKR: 325, NPR: 133,
  MMK: 2100, KHR: 4100, LAK: 21000, KZT: 460, KGS: 89, UZS: 12600,
};

// In-memory server-side cache (1 hour TTL)
let cachedRates: Record<string, number> | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const now = Date.now();

  // Return cached rates if still valid
  if (cachedRates && now < cacheExpiresAt) {
    return NextResponse.json(
      { success: true, rates: cachedRates, source: "cache" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 }, // Next.js fetch cache: 1 hour
    });

    if (!res.ok) {
      throw new Error(`Exchange rate API responded with ${res.status}`);
    }

    const data = await res.json();

    if (data.result !== "success" || !data.rates) {
      throw new Error("Unexpected response format from exchange rate API");
    }

    // Filter to only currencies we need
    const filteredRates: Record<string, number> = {};
    for (const code of NEEDED_CURRENCIES) {
      if (data.rates[code] !== undefined) {
        filteredRates[code] = data.rates[code];
      } else {
        // Use fallback for any missing currency
        filteredRates[code] = FALLBACK_RATES[code] ?? 1;
      }
    }

    // Update server-side cache
    cachedRates = filteredRates;
    cacheExpiresAt = now + CACHE_TTL_MS;

    return NextResponse.json(
      {
        success: true,
        rates: filteredRates,
        source: "live",
        nextUpdateAt: new Date(cacheExpiresAt).toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.warn("[exchange-rates] Failed to fetch live rates, using fallback:", err);

    // Use static fallback
    const fallback: Record<string, number> = {};
    for (const code of NEEDED_CURRENCIES) {
      fallback[code] = FALLBACK_RATES[code] ?? 1;
    }

    return NextResponse.json(
      { success: true, rates: fallback, source: "fallback" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  }
}

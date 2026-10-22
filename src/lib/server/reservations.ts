import type { MaterialBatchDoc } from "@/lib/firebase/types";

/** An artisan has this long to pick a batch up before it goes back on the map. */
export const RESERVATION_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * True when a reservation has run out. Expiry is checked whenever a batch is read
 * or reserved, so no scheduled job is needed. Batches without a reservation time
 * (older records) never expire on their own; the holder or an admin releases them.
 */
export function isReservationExpired(batch: Pick<MaterialBatchDoc, "status" | "reservedAt">, now = Date.now()): boolean {
  if (batch.status !== "reserved" || !batch.reservedAt) return false;
  const reservedAt = new Date(batch.reservedAt).getTime();
  return Number.isFinite(reservedAt) && now - reservedAt > RESERVATION_TTL_MS;
}

/** The batch as everyone should see it: an expired reservation is available again. */
export function withExpiry<T extends MaterialBatchDoc>(batch: T, now = Date.now()): T {
  if (!isReservationExpired(batch, now)) return batch;
  return { ...batch, status: "available", reservedByArtisanId: null, reservedAt: null };
}

import { createHash } from "crypto";

export function generateHarvestTxHash(params: {
  batchId: string;
  gpsLat: number;
  gpsLng: number;
  weightKg: number;
  officerId: string;
  timestamp: string | Date;
}): string {
  const ts = params.timestamp instanceof Date ? params.timestamp.toISOString() : params.timestamp;
  const rawPayload = `${params.batchId}:${params.gpsLat.toFixed(4)},${params.gpsLng.toFixed(4)}:${params.weightKg}:${params.officerId}:${ts}`;
  return createHash("sha256").update(rawPayload).digest("hex");
}

export type HarvestIntegrity = "match" | "changed" | "unknown";

/**
 * Re-derives a batch's hash from its stored fields and compares it with the hash
 * saved on the batch and the copy saved on the pass when it was sold. "changed"
 * means where, when, how much or by whom was edited after logging; "unknown"
 * means the record lacks a field the hash needs.
 */
export function checkHarvestIntegrity(
  batch: { id: string; gpsLat: number; gpsLng: number; weightKg: number; scannedByOfficerId: string | null; createdAt: string; txHash: string } | null,
  passHash: string | null | undefined
): HarvestIntegrity {
  if (!batch || !batch.scannedByOfficerId || !batch.txHash || !passHash) return "unknown";
  const recomputed = generateHarvestTxHash({
    batchId: batch.id,
    gpsLat: batch.gpsLat,
    gpsLng: batch.gpsLng,
    weightKg: batch.weightKg,
    officerId: batch.scannedByOfficerId,
    timestamp: batch.createdAt,
  });
  return recomputed === batch.txHash && batch.txHash === passHash ? "match" : "changed";
}

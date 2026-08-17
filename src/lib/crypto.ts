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

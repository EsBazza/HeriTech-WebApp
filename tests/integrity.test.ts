import { describe, expect, it } from "vitest";
import { checkHarvestIntegrity, generateHarvestTxHash } from "@/lib/crypto";

const record = {
  id: "HT-2026-0101",
  gpsLat: 15.0286,
  gpsLng: 120.6898,
  weightKg: 18.5,
  scannedByOfficerId: "usr_lgu_01",
  createdAt: "2026-07-16T10:00:00.000Z",
};
const txHash = generateHarvestTxHash({ ...record, batchId: record.id, officerId: record.scannedByOfficerId, timestamp: record.createdAt });

describe("harvest integrity check", () => {
  it("matches an untouched record", () => {
    expect(checkHarvestIntegrity({ ...record, txHash }, txHash)).toBe("match");
  });

  it("flags an edited weight, place or time", () => {
    expect(checkHarvestIntegrity({ ...record, weightKg: 25, txHash }, txHash)).toBe("changed");
    expect(checkHarvestIntegrity({ ...record, gpsLat: 15.5, txHash }, txHash)).toBe("changed");
    expect(checkHarvestIntegrity({ ...record, createdAt: "2026-07-17T10:00:00.000Z", txHash }, txHash)).toBe("changed");
  });

  it("flags a pass whose copy of the hash differs", () => {
    expect(checkHarvestIntegrity({ ...record, txHash }, "0".repeat(64))).toBe("changed");
  });

  it("says unknown when the record can't be checked", () => {
    expect(checkHarvestIntegrity(null, txHash)).toBe("unknown");
    expect(checkHarvestIntegrity({ ...record, scannedByOfficerId: null, txHash }, txHash)).toBe("unknown");
    expect(checkHarvestIntegrity({ ...record, txHash }, null)).toBe("unknown");
  });
});

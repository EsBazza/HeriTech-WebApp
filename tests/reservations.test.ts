import { describe, expect, it } from "vitest";
import type { MaterialBatchDoc } from "@/lib/firebase/types";
import { RESERVATION_TTL_MS, isReservationExpired, withExpiry } from "@/lib/server/reservations";

const now = Date.parse("2026-10-22T12:00:00.000Z");
const batch = (status: MaterialBatchDoc["status"], reservedAt: string | null) =>
  ({ id: "HT-2026-1001", status, reservedAt, reservedByArtisanId: status === "reserved" ? "usr_art_05" : null }) as MaterialBatchDoc;

describe("reservation expiry", () => {
  it("keeps a reservation for 48 hours", () => {
    expect(RESERVATION_TTL_MS).toBe(48 * 60 * 60 * 1000);
    expect(isReservationExpired(batch("reserved", new Date(now - RESERVATION_TTL_MS + 60_000).toISOString()), now)).toBe(false);
    expect(isReservationExpired(batch("reserved", new Date(now - RESERVATION_TTL_MS - 60_000).toISOString()), now)).toBe(true);
  });

  it("never expires batches that aren't reserved, or have no reservation time", () => {
    const old = new Date(now - 10 * RESERVATION_TTL_MS).toISOString();
    expect(isReservationExpired(batch("available", old), now)).toBe(false);
    expect(isReservationExpired(batch("claimed", old), now)).toBe(false);
    expect(isReservationExpired(batch("reserved", null), now)).toBe(false);
  });

  it("shows an expired reservation as available again", () => {
    const expired = withExpiry(batch("reserved", new Date(now - 3 * RESERVATION_TTL_MS).toISOString()), now);
    expect(expired).toMatchObject({ status: "available", reservedByArtisanId: null, reservedAt: null });
    const live = batch("reserved", new Date(now - 1000).toISOString());
    expect(withExpiry(live, now)).toBe(live);
  });
});

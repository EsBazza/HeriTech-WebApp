import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHandoverToken, verifyHandoverToken } from "@/lib/server/handoverToken";

describe("handover tokens", () => {
  beforeEach(() => {
    vi.stubEnv("HANDOVER_TOKEN_SECRET", "test-secret-that-is-at-least-32-characters-long");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("round-trips the batch and artisan", () => {
    const { token } = createHandoverToken("HT-2026-1001", "usr_art_05");
    expect(verifyHandoverToken(token)).toEqual({ batchId: "HT-2026-1001", artisanId: "usr_art_05" });
  });

  it("rejects a token whose payload was changed", () => {
    const { token } = createHandoverToken("HT-2026-1001", "usr_art_05");
    const [prefix, , signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ b: "HT-2026-1001", a: "usr_attacker", e: 9999999999 })).toString("base64url");
    expect(() => verifyHandoverToken(`${prefix}.${forged}.${signature}`)).toThrow(/invalid or has been altered/);
  });

  it("rejects a token signed with another secret", () => {
    const { token } = createHandoverToken("HT-2026-1001", "usr_art_05");
    vi.stubEnv("HANDOVER_TOKEN_SECRET", "a-different-secret-that-is-also-32-characters");
    expect(() => verifyHandoverToken(token)).toThrow(/invalid or has been altered/);
  });

  it("expires after 30 minutes", () => {
    vi.useFakeTimers();
    const { token } = createHandoverToken("HT-2026-1001", "usr_art_05");
    vi.advanceTimersByTime(31 * 60 * 1000);
    expect(() => verifyHandoverToken(token)).toThrow(/expired/);
  });

  it("rejects text that is not a handover code", () => {
    expect(() => verifyHandoverToken("usr_art_01")).toThrow(/not a HeriTech handover code/);
  });

  it("refuses to sign without a strong secret", () => {
    vi.stubEnv("HANDOVER_TOKEN_SECRET", "short");
    expect(() => createHandoverToken("b", "a")).toThrow(/not configured/);
  });
});

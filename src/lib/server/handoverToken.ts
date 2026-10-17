import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { HttpError, badRequest } from "./http";

const PREFIX = "HT1";
const TTL_SECONDS = 30 * 60;

function secret(): string {
  const value = process.env.HANDOVER_TOKEN_SECRET;
  if (!value || value.length < 32) {
    console.error("[handover] HANDOVER_TOKEN_SECRET is missing or shorter than 32 characters.");
    throw new HttpError(503, "QR handover is not configured on this server.");
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/**
 * A short-lived token proving that `artisanId` holds the reservation on `batchId`.
 * The artisan shows it as a QR code; the LGU officer submits it to release custody.
 */
export function createHandoverToken(batchId: string, artisanId: string): { token: string; expiresAt: string } {
  const expires = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ b: batchId, a: artisanId, e: expires })).toString("base64url");
  return {
    token: `${PREFIX}.${payload}.${sign(payload)}`,
    expiresAt: new Date(expires * 1000).toISOString(),
  };
}

export function verifyHandoverToken(token: string): { batchId: string; artisanId: string } {
  const [prefix, payload, signature] = token.trim().split(".");
  if (prefix !== PREFIX || !payload || !signature) throw badRequest("That is not a HeriTech handover code.");

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    throw badRequest("This handover code is invalid or has been altered.");
  }

  const { b, a, e } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { b: string; a: string; e: number };
  if (e * 1000 < Date.now()) throw badRequest("This handover code has expired. Ask the artisan to refresh it.");
  return { batchId: b, artisanId: a };
}

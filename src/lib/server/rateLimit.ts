import "server-only";
import { HttpError } from "./http";

/**
 * Fixed-window rate limiter kept in memory. On Vercel every serverless instance
 * has its own memory, so this caps abuse per instance rather than globally. It
 * still stops a single client from hammering the paid Gemini and Translate APIs.
 * Swap in a shared store (e.g. Upstash Redis) if traffic grows.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(request: Request, bucket: string, limit: number, windowMs: number, userId?: string) {
  const now = Date.now();
  const key = `${bucket}:${userId ?? clientKey(request)}`;
  const entry = windows.get(key);

  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 10_000) {
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    }
    return;
  }

  entry.count += 1;
  if (entry.count > limit) {
    const seconds = Math.ceil((entry.resetAt - now) / 1000);
    throw new HttpError(429, `Too many requests. Try again in ${seconds}s.`);
  }
}

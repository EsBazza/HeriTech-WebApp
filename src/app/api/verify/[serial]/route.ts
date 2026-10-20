import { ok, route } from "@/lib/server/http";
import { passRecord } from "@/lib/server/passRecord";

export type { PassRecord } from "@/lib/server/passRecord";

/**
 * GET /api/verify/:serial — the public impact record behind a pass QR code.
 * Shows the maker, origin batch and money split. The buyer stays anonymous.
 */
export const GET = route(async (_request: Request, { params }: { params: Promise<{ serial: string }> }) => {
  const { serial } = await params;
  return ok(await passRecord(serial), { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
});

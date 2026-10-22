import sharp from "sharp";
import { db } from "@/lib/server/firestore";
import { isPassSerial } from "@/lib/server/ids";
import { appUrl, notFound, route } from "@/lib/server/http";
import { loadProductImage } from "@/lib/server/passArt";

/**
 * GET /api/wallet/before/:serial — the source batch photo shown as the "before"
 * image on a Wallet pass. Public, because Google fetches it without credentials;
 * batch photos are already public on the material map and contain no people.
 */
export const GET = route(async (request: Request, { params }: { params: Promise<{ serial: string }> }) => {
  const { serial } = await params;
  if (!isPassSerial(serial)) throw notFound("No impact pass with that serial.");
  const pass = (await db.passes().doc(serial.toUpperCase()).get()).data();
  if (!pass) throw notFound("No impact pass with that serial.");
  const order = (await db.orders().doc(pass.orderId).get()).data();
  const batch = order ? (await db.batches().doc(order.sourceBatchId).get()).data() : undefined;
  const image = batch?.imageUrl ? await loadProductImage(batch.imageUrl, appUrl(request)) : null;
  if (!image) throw notFound("This pass has no collection photo.");

  const jpg = await sharp(image, { density: 144 }).rotate().resize(1032, 516, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
  return new Response(new Uint8Array(jpg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400, s-maxage=604800" },
  });
});

import { db } from "@/lib/server/firestore";
import { appUrl, notFound, route } from "@/lib/server/http";
import { heroBanner, loadProductImage } from "@/lib/server/passArt";

/**
 * GET /api/wallet/hero/:serial — the blurred product banner shown on a Wallet pass.
 * Public, because Google fetches it without credentials; it only reveals the
 * product photo, which is already public on the product page.
 */
export const GET = route(async (request: Request, { params }: { params: Promise<{ serial: string }> }) => {
  const { serial } = await params;
  const pass = (await db.passes().doc(serial.toUpperCase()).get()).data();
  if (!pass) throw notFound("No impact pass with that serial.");
  const order = (await db.orders().doc(pass.orderId).get()).data();
  const product = order ? (await db.products().doc(order.productId).get()).data() : undefined;
  const source = product?.images[0];
  const image = source ? await loadProductImage(source, appUrl(request)) : null;
  if (!image) throw notFound("This pass has no product photo.");

  const png = await heroBanner(image);
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400, s-maxage=604800" },
  });
});

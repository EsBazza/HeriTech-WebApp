import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { isPassSerial } from "@/lib/server/ids";
import { appUrl, forbidden, notFound, ok, route } from "@/lib/server/http";
import { withProductRelations } from "@/lib/server/views";
import { loadProductImage, passBackground } from "@/lib/server/passArt";
import { impactPassSaveUrl } from "@/lib/server/wallet";

/**
 * GET /api/wallet/:serial — a Save to Google Wallet link for the caller's own pass.
 * Only the buyer of the order (or an admin) can add it to their wallet.
 */
export const GET = route(async (request: Request, { params }: { params: Promise<{ serial: string }> }) => {
  const user = await requireUser(request);
  const { serial } = await params;

  if (!isPassSerial(serial)) throw notFound("No impact pass with that serial.");
  const pass = (await db.passes().doc(serial.toUpperCase()).get()).data();
  if (!pass) throw notFound("No impact pass with that serial.");
  const order = (await db.orders().doc(pass.orderId).get()).data();
  if (!order) throw notFound("The order behind this pass could not be found.");
  if (order.buyerId !== user.id && user.role !== "admin") throw forbidden("Only the buyer can add this pass to their wallet.");

  const [productSnap, buyerSnap] = await Promise.all([db.products().doc(order.productId).get(), db.users().doc(order.buyerId).get()]);
  const product = productSnap.data();
  if (!product) throw notFound("The piece behind this pass could not be found.");
  const base = appUrl(request);
  const [[view], image] = await Promise.all([
    withProductRelations([product]),
    product.images[0] ? loadProductImage(product.images[0], base) : Promise.resolve(null),
  ]);
  const backgroundColor = image ? await passBackground(image).catch(() => null) : null;

  const saveUrl = impactPassSaveUrl(
    {
      serial: pass.serial,
      productId: product.id,
      artisanId: product.artisanId,
      verifyUrl: `${base}/verify/${pass.serial}`,
      ownerName: buyerSnap.data()?.fullName || null,
      productTitle: product.title,
      makerName: view.artisan?.workshopName || view.artisan?.fullName || null,
      festival: view.sourceBatch?.agreement?.festival ?? null,
      country: view.sourceBatch?.agreement?.country ?? null,
      kgDiverted: product.kgDiverted * order.quantity,
      amountPaid: order.amountPaid,
      issuedAt: pass.issuedAt,
      backgroundColor,
      hasHeroImage: Boolean(image),
      hasBeforeImage: Boolean(view.sourceBatch?.imageUrl),
      freeClaim: order.paymentMode === "free_claim",
    },
    base
  );

  return ok({ saveUrl });
});

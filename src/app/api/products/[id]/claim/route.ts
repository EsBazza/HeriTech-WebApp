import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { BoothClaimDoc, OrderDoc, WalletPassDoc } from "@/lib/firebase/types";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { appUrl, badRequest, conflict, notFound, ok, route } from "@/lib/server/http";
import { passSerial } from "@/lib/server/ids";
import { addSystemMessage } from "@/lib/server/messages";
import { rateLimit } from "@/lib/server/rateLimit";

type Context = { params: Promise<{ id: string }> };

/** GET /api/products/:id/claim — the signed-in user's booth claim, if they have one (from any free piece). */
export const GET = route(async (request: Request) => {
  const user = await requireUser(request);
  const claim = (await db.boothClaims().doc(user.id).get()).data();
  return ok(claim ? { serial: claim.serial, productId: claim.productId, createdAt: claim.createdAt } : null);
});

/**
 * POST /api/products/:id/claim — claims a free showcase piece. One claim per
 * account across all free pieces. Like a purchase it creates an order (with no
 * money), an impact pass and a note from the maker, but it doesn't count toward
 * HeriTech Circle rewards.
 */
export const POST = route(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  rateLimit(request, "claim", 10, 60_000, user.id);
  const { id } = await params;
  const baseUrl = appUrl(request);

  const result = await adminDb().runTransaction(async (tx) => {
    const productRef = db.products().doc(id);
    const claimRef = db.boothClaims().doc(user.id);
    const [productSnap, claimSnap] = await Promise.all([tx.get(productRef), tx.get(claimRef)]);
    const product = productSnap.data();
    const existing = claimSnap.data();

    if (!product || product.archived) throw notFound("This piece is no longer available.");
    if (!product.freeClaim) throw badRequest("This piece isn't free to claim.");
    if (existing) throw conflict(`You've already claimed your free piece. Your Impact Pass is ${existing.serial}.`);
    if (product.artisanId === user.id) throw badRequest("You can't claim your own piece.");
    if (product.stock < 1) throw conflict("All of these have been claimed.");

    const batch = (await tx.get(db.batches().doc(product.sourceBatchId))).data();
    if (!batch) throw conflict(`The source batch for "${product.title}" is missing.`);
    const maker = (await tx.get(db.users().doc(product.artisanId))).data();

    const createdAt = new Date().toISOString();
    const orderRef = db.orders().doc();
    const order: OrderDoc = {
      id: orderRef.id,
      productId: product.id,
      artisanId: product.artisanId,
      buyerId: user.id,
      sourceBatchId: batch.id,
      quantity: 1,
      unitPrice: 0,
      amountPaid: 0,
      artisanPayout: 0,
      lguShare: 0,
      charityMaintenanceShare: 0,
      paymentMode: "free_claim",
      shippingAddress: null,
      status: "completed",
      createdAt,
    };

    const serial = passSerial();
    const pass: WalletPassDoc = {
      id: serial,
      orderId: order.id,
      serial,
      qrPayload: `${baseUrl}/verify/${serial}`,
      harvestHash: batch.txHash,
      issuedAt: createdAt,
    };

    const claim: BoothClaimDoc = {
      id: user.id,
      productId: product.id,
      orderId: order.id,
      serial,
      createdAt,
      tokenGivenAt: null,
      tokenGivenBy: null,
    };

    tx.create(orderRef, order);
    tx.create(db.passes().doc(serial), pass);
    tx.create(claimRef, claim);
    tx.update(productRef, { stock: FieldValue.increment(-1) });
    addSystemMessage(tx, {
      senderId: product.artisanId,
      receiverId: user.id,
      content: `Thanks for visiting HeriTech. "${product.title}" was made by ${maker?.workshopName || maker?.fullName || "a local artisan"} from festival material. Show your Impact Pass ${serial} at the booth to collect it.`,
      contextType: "order",
      contextId: order.id,
    });

    return { serial, qrPayload: pass.qrPayload, orderId: order.id };
  });

  return ok(result, { status: 201, message: "Claimed. Show your Impact Pass at the booth to collect your piece." });
});

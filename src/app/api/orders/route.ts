import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { OrderDoc, WalletPassDoc } from "@/lib/firebase/types";
import { calculateEscrowSplit } from "@/lib/escrow";
import { requireUser } from "@/lib/server/auth";
import { db, getMany } from "@/lib/server/firestore";
import { badRequest, conflict, fields, ok, parseBody, route } from "@/lib/server/http";
import { passSerial } from "@/lib/server/ids";
import { addSystemMessage } from "@/lib/server/messages";
import { newestFirst, withProductRelations } from "@/lib/server/views";

const schema = z.object({
  items: z
    .array(z.object({ productId: fields.id, quantity: z.coerce.number().int().min(1).max(20).default(1) }))
    .min(1, "Your cart is empty.")
    .max(20)
    .refine((items) => new Set(items.map((i) => i.productId)).size === items.length, "Each product may appear only once."),
  shippingAddress: z.object({
    fullName: fields.text(120),
    streetAddress: fields.text(200),
    city: fields.text(80),
    country: fields.text(80),
    postalCode: z.string().trim().max(20).default(""),
  }),
});

function appUrl(request: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
}

/**
 * POST /api/orders — checkout. Payment is simulated: no money moves.
 * Stock is checked and decremented atomically, and each line gets its own
 * order, impact pass and artisan notification.
 */
export const POST = route(async (request: Request) => {
  const buyer = await requireUser(request);
  const { items, shippingAddress } = await parseBody(request, schema);
  const baseUrl = appUrl(request);

  const result = await adminDb().runTransaction(async (tx) => {
    const productRefs = items.map((item) => db.products().doc(item.productId));
    const productSnaps = await tx.getAll(...productRefs);
    const products = productSnaps.map((snap, i) => {
      const product = snap.data();
      if (!product || product.archived) throw badRequest(`"${items[i].productId}" is no longer for sale.`);
      if (product.stock < items[i].quantity) throw conflict(`Only ${product.stock} of "${product.title}" left in stock.`);
      if (product.artisanId === buyer.id) throw badRequest("You can't buy your own listing.");
      return product;
    });

    const batchSnaps = await tx.getAll(...products.map((p) => db.batches().doc(p.sourceBatchId)));
    const createdAt = new Date().toISOString();
    const orders: OrderDoc[] = [];
    const passes: WalletPassDoc[] = [];

    products.forEach((product, i) => {
      const quantity = items[i].quantity;
      const batch = batchSnaps[i].data();
      if (!batch) throw conflict(`The source batch for "${product.title}" is missing.`);

      const split = calculateEscrowSplit(product.price * quantity);
      const orderRef = db.orders().doc();
      const order: OrderDoc = {
        id: orderRef.id,
        productId: product.id,
        artisanId: product.artisanId,
        buyerId: buyer.id,
        sourceBatchId: batch.id,
        quantity,
        unitPrice: product.price,
        amountPaid: split.totalAmount,
        artisanPayout: split.artisanPayout,
        lguShare: split.lguShare,
        charityMaintenanceShare: split.charityMaintenanceShare,
        paymentMode: "simulated",
        shippingAddress,
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

      tx.create(orderRef, order);
      tx.create(db.passes().doc(serial), pass);
      tx.update(productRefs[i], { stock: FieldValue.increment(-quantity) });
      addSystemMessage(tx, {
        senderId: buyer.id,
        receiverId: product.artisanId,
        content: `New order for ${quantity} × "${product.title}" (${split.totalAmount.toFixed(2)} USD, your share ${split.artisanPayout.toFixed(2)} USD). Ship to ${shippingAddress.city}, ${shippingAddress.country}.`,
        contextType: "order",
        contextId: order.id,
      });

      orders.push(order);
      passes.push(pass);
    });

    return { orders, passes };
  });

  return ok(
    {
      orders: result.orders,
      passes: result.passes.map((p) => ({ serial: p.serial, qrPayload: p.qrPayload, orderId: p.orderId })),
      totalPaid: Math.round(result.orders.reduce((sum, o) => sum + o.amountPaid, 0) * 100) / 100,
      paymentMode: "simulated" as const,
    },
    { status: 201, message: "Order placed. This was a demo payment, so no money was charged." }
  );
});

/** GET /api/orders — the signed-in buyer's 30 most recent orders with their impact passes. */
export const GET = route(async (request: Request) => {
  const buyer = await requireUser(request);
  const orders = (await db.orders().where("buyerId", "==", buyer.id).get()).docs.map((d) => d.data()).sort(newestFirst).slice(0, 30);
  if (orders.length === 0) return ok([]);

  const [passSnap, products] = await Promise.all([
    db.passes().where("orderId", "in", orders.map((o) => o.id)).get(),
    getMany(db.products(), orders.map((o) => o.productId)),
  ]);
  const passByOrder = new Map(passSnap.docs.map((d) => [d.data().orderId, d.data()]));
  // Maker and origin, so the buyer's pass cards tell the whole story
  const views = new Map((await withProductRelations([...products.values()])).map((v) => [v.id, v]));

  return ok(
    orders.map((order) => {
      const product = products.get(order.productId);
      const view = views.get(order.productId);
      const origin = [view?.sourceBatch?.agreement?.festival, view?.sourceBatch?.agreement?.country].filter(Boolean).join(", ") || null;
      return {
        ...order,
        product: product
          ? {
              id: product.id,
              title: product.title,
              image: product.images[0] ?? null,
              kgDiverted: product.kgDiverted,
              maker: view?.artisan?.workshopName || view?.artisan?.fullName || null,
              origin,
            }
          : null,
        pass: passByOrder.get(order.id) ?? null,
      };
    })
  );
});

/**
 * Seeds a DEMO Firestore project with the fictional showcase dataset.
 * Refuses to run unless NEXT_PUBLIC_DEMO_MODE=true, so fictional people,
 * products and orders can never end up in the real project.
 *
 *   npm run seed            upsert the seed documents (safe to re-run)
 *   npm run seed -- --reset also delete every batch, product, order, pass and
 *                           message first
 */
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { adminDb } from "../src/lib/firebase/admin-core";
import { calculateEscrowSplit } from "../src/lib/escrow";
import {
  SEED_AGREEMENTS,
  SEED_MATERIAL_BATCHES,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_USERS,
  SEED_WALLET_PASSES,
} from "./seed-data";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const RESET = process.argv.includes("--reset");
const RESET_COLLECTIONS = ["material_batches", "products", "orders", "wallet_passes", "messages", "counters", "agreements"];

const ts = (iso: string) => Timestamp.fromDate(new Date(iso));

async function deleteCollection(firestore: Firestore, name: string) {
  const docs = await firestore.collection(name).listDocuments();
  for (let i = 0; i < docs.length; i += 400) {
    const batch = firestore.batch();
    docs.slice(i, i + 400).forEach((doc) => batch.delete(doc));
    await batch.commit();
  }
  console.log(`  cleared ${name} (${docs.length})`);
}

async function main() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    throw new Error("The seed data is fictional. Only load it into a demo project (set NEXT_PUBLIC_DEMO_MODE=true).");
  }
  const firestore = adminDb();

  if (RESET) {
    console.log("Resetting demo data…");
    for (const name of RESET_COLLECTIONS) await deleteCollection(firestore, name);
  }

  const writer = firestore.bulkWriter();
  const put = (collection: string, id: string, data: Record<string, unknown>) =>
    writer.set(firestore.collection(collection).doc(id), data);

  for (const { id, ...user } of SEED_USERS) {
    put("users", id, {
      workshopName: null,
      stationName: null,
      application: null,
      ...user,
      isDemo: true,
      createdAt: ts(user.createdAt),
    });
  }

  for (const { id, ...agreement } of SEED_AGREEMENTS) {
    put("agreements", id, { ...agreement, createdById: null, signedAt: ts(agreement.signedAt) });
  }

  for (const { id, ...batch } of SEED_MATERIAL_BATCHES) {
    put("material_batches", id, { ...batch, createdAt: ts(batch.createdAt) });
  }

  for (const { id, ...product } of SEED_PRODUCTS) {
    put("products", id, { ...product, createdAt: ts(product.createdAt) });
  }

  for (const { id, ...order } of SEED_ORDERS) {
    const product = SEED_PRODUCTS.find((p) => p.id === order.productId);
    if (!product) throw new Error(`Seed order ${id} points at missing product ${order.productId}`);
    put("orders", id, {
      ...order,
      ...calculateEscrowSplit(order.amountPaid),
      amountPaid: order.amountPaid,
      artisanId: product.artisanId,
      sourceBatchId: product.sourceBatchId,
      quantity: 1,
      unitPrice: product.price,
      paymentMode: "simulated",
      shippingAddress: null,
      createdAt: ts(order.createdAt),
    });
  }

  for (const { id: legacyId, ...pass } of SEED_WALLET_PASSES) {
    // Passes are keyed by serial so lookups are a single document read.
    writer.delete(firestore.collection("wallet_passes").doc(legacyId));
    put("wallet_passes", pass.serial, { ...pass, qrPayload: `${APP_URL}/verify/${pass.serial}`, issuedAt: ts(pass.issuedAt) });
  }

  // Live ids continue after the seeded ones (RA-2026-005, HT-2026-0101…0502).
  put("counters", "agreements-2026", { value: SEED_AGREEMENTS.length });
  put("counters", "batches-2026", { value: 1000 });

  await writer.close();
  console.log(
    `Seeded ${SEED_USERS.length} users, ${SEED_AGREEMENTS.length} agreements, ${SEED_MATERIAL_BATCHES.length} batches, ` +
      `${SEED_PRODUCTS.length} products, ${SEED_ORDERS.length} orders and ${SEED_WALLET_PASSES.length} passes.`
  );
}

main().catch((error) => {
  console.error("Seeding failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

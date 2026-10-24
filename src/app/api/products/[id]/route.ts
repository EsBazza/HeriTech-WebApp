import { adminDb } from "@/lib/firebase/admin";
import type { ProductDoc, UserDoc } from "@/lib/firebase/types";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { forbidden, notFound, ok, parseBody, route } from "@/lib/server/http";
import { storeImage } from "@/lib/server/images";
import { assertKgBudget, batchListings } from "@/lib/server/kgBudget";
import { productUpdateSchema } from "@/lib/server/productInput";
import { withProductRelations } from "@/lib/server/views";

type Context = { params: Promise<{ id: string }> };

async function loadOwnedProduct(id: string, user: UserDoc): Promise<ProductDoc> {
  const product = (await db.products().doc(id).get()).data();
  if (!product || product.archived) throw notFound("Product not found.");
  if (product.artisanId !== user.id && user.role !== "admin") throw forbidden("You can only change your own listings.");
  return product;
}

/** GET /api/products/:id — one listing with its artisan and source batch. */
export const GET = route(async (_request: Request, { params }: Context) => {
  const { id } = await params;
  const product = (await db.products().doc(id).get()).data();
  if (!product || product.archived) throw notFound("This piece is no longer listed.");
  const [view] = await withProductRelations([product]);
  return ok(view);
});

/** PATCH /api/products/:id — the owning artisan edits a listing. */
export const PATCH = route(async (request: Request, { params }: Context) => {
  const user = await requireUser(request, ["artisan"]);
  const { id } = await params;
  await loadOwnedProduct(id, user);
  const input = await parseBody(request, productUpdateSchema);
  if (input.freeClaim !== undefined && user.role !== "admin") throw forbidden("Only an admin can make a piece free to claim.");

  const updates: Partial<ProductDoc> = { ...input };
  if (input.images) updates.images = await Promise.all(input.images.map((img) => storeImage(img, "products")));
  const ref = db.products().doc(id);

  const saved = await adminDb().runTransaction(async (tx) => {
    // Re-read inside the transaction so a sale made meanwhile is counted.
    const current = (await tx.get(ref)).data();
    if (!current || current.archived) throw notFound("Product not found.");

    if (input.kgDiverted !== undefined || input.stock !== undefined) {
      const batch = (await tx.get(db.batches().doc(current.sourceBatchId))).data();
      if (batch) {
        const listings = await batchListings(batch.id, tx);
        const before = listings.find((l) => l.id === id) ?? { kgDiverted: current.kgDiverted, stock: current.stock, sold: 0 };
        assertKgBudget({
          batchId: batch.id,
          batchWeightKg: batch.weightKg,
          others: listings.filter((l) => l.id !== id),
          before,
          after: { kgDiverted: input.kgDiverted ?? current.kgDiverted, stock: input.stock ?? current.stock, sold: before.sold },
        });
      }
    }

    tx.update(ref, updates);
    return { ...current, ...updates };
  });

  const [view] = await withProductRelations([saved]);
  return ok(view, { message: "Listing updated." });
});

/**
 * DELETE /api/products/:id — removes a listing from the marketplace.
 * The document is archived, not deleted, so impact passes for past sales still verify.
 */
export const DELETE = route(async (request: Request, { params }: Context) => {
  const user = await requireUser(request, ["artisan"]);
  const { id } = await params;
  await loadOwnedProduct(id, user);
  await db.products().doc(id).update({ archived: true, stock: 0 });
  return ok({ id }, { message: "Listing removed from the marketplace." });
});

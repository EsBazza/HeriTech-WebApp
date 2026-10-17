import "server-only";
import type { AgreementDoc, MaterialBatchDoc, ProductDoc, PublicUser } from "@/lib/firebase/types";
import { toPublicUser } from "./auth";
import { db, getMany } from "./firestore";

export interface BatchView extends MaterialBatchDoc {
  agreement: AgreementDoc | null;
  scannedByOfficer: PublicUser | null;
  reservedByArtisan: PublicUser | null;
  claimedByArtisan: PublicUser | null;
}

export interface ProductView extends ProductDoc {
  artisan: PublicUser | null;
  sourceBatch: BatchView | null;
}

async function publicUsers(ids: Iterable<string | null | undefined>): Promise<Map<string, PublicUser>> {
  const users = await getMany(db.users(), ids);
  return new Map([...users].map(([id, user]) => [id, toPublicUser(user)]));
}

/** Attaches agreement and officer/artisan profiles to batches. */
export async function withBatchRelations(batches: MaterialBatchDoc[]): Promise<BatchView[]> {
  const [agreements, users] = await Promise.all([
    getMany(db.agreements(), batches.map((b) => b.agreementId)),
    publicUsers(batches.flatMap((b) => [b.scannedByOfficerId, b.reservedByArtisanId, b.claimedByArtisanId])),
  ]);
  const pick = (id: string | null) => (id ? users.get(id) ?? null : null);

  return batches.map((batch) => ({
    ...batch,
    agreement: batch.agreementId ? agreements.get(batch.agreementId) ?? null : null,
    scannedByOfficer: pick(batch.scannedByOfficerId),
    reservedByArtisan: pick(batch.reservedByArtisanId),
    claimedByArtisan: pick(batch.claimedByArtisanId),
  }));
}

/** Attaches the artisan profile and full source batch to products. */
export async function withProductRelations(products: ProductDoc[]): Promise<ProductView[]> {
  const [artisans, batches] = await Promise.all([
    publicUsers(products.map((p) => p.artisanId)),
    getMany(db.batches(), products.map((p) => p.sourceBatchId)),
  ]);
  const batchViews = new Map((await withBatchRelations([...batches.values()])).map((b) => [b.id, b]));

  return products.map((product) => ({
    ...product,
    artisan: artisans.get(product.artisanId) ?? null,
    sourceBatch: batchViews.get(product.sourceBatchId) ?? null,
  }));
}

export const newestFirst = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

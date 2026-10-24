import "server-only";
import type { Query, QuerySnapshot, Transaction } from "firebase-admin/firestore";
import { db } from "./firestore";
import { conflict } from "./http";

/**
 * Every piece's impact pass says how many kilograms of festival material went into
 * it, so the listings made from one batch may never promise more than the batch
 * weighed. A listing promises `kgDiverted` for each piece it will ever have: what is
 * still in stock plus what has already been sold or claimed.
 */
export interface ListingKg {
  id: string;
  kgDiverted: number;
  stock: number;
  sold: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const promisedKg = (listing: Pick<ListingKg, "kgDiverted" | "stock" | "sold">) => round2(listing.kgDiverted * (listing.stock + listing.sold));

/**
 * Why a new or edited listing would promise more material than its batch has left,
 * or null when it fits. An edit that doesn't raise the listing's own total is always
 * allowed, so listings saved before this check can still be corrected.
 */
export function kgBudgetProblem({
  batchId,
  batchWeightKg,
  others,
  before,
  after,
}: {
  batchId: string;
  batchWeightKg: number;
  /** The batch's other listings. */
  others: Pick<ListingKg, "kgDiverted" | "stock" | "sold">[];
  /** This listing as saved now; absent for a new listing. */
  before?: Pick<ListingKg, "kgDiverted" | "stock" | "sold">;
  after: Pick<ListingKg, "kgDiverted" | "stock" | "sold">;
}): string | null {
  const wanted = promisedKg(after);
  if (wanted <= (before ? promisedKg(before) : 0) + 1e-9) return null;

  const left = round2(Math.max(batchWeightKg - others.reduce((sum, l) => sum + promisedKg(l), 0), 0));
  if (wanted <= left + 1e-9) return null;

  const pieces = after.stock + after.sold;
  const soldNote = after.sold ? ` (including ${after.sold} already sold)` : "";
  return `Batch ${batchId} weighs ${batchWeightKg} kg and ${left} kg of it is left for this listing. ${pieces} pieces${soldNote} × ${after.kgDiverted} kg = ${wanted} kg. Lower the kg per piece or the stock.`;
}

/** The batch's listings with how many pieces each has sold, read inside `tx` when given. */
export async function batchListings(batchId: string, tx?: Transaction): Promise<ListingKg[]> {
  const read = <T>(query: Query<T>): Promise<QuerySnapshot<T>> => (tx ? tx.get(query) : query.get());
  const products = (await read(db.products().where("sourceBatchId", "==", batchId))).docs.map((d) => d.data());
  if (products.length === 0) return [];

  const sold = new Map<string, number>();
  const ids = products.map((p) => p.id);
  // Firestore's "in" filter takes at most 30 values.
  for (let i = 0; i < ids.length; i += 30) {
    const orders = await read(db.orders().where("productId", "in", ids.slice(i, i + 30)));
    for (const doc of orders.docs) {
      const order = doc.data();
      sold.set(order.productId, (sold.get(order.productId) ?? 0) + (order.quantity ?? 1));
    }
  }
  return products.map((p) => ({ id: p.id, kgDiverted: p.kgDiverted, stock: p.stock, sold: sold.get(p.id) ?? 0 }));
}

/** Throws a 409 explaining the numbers when a listing would overdraw its batch. */
export function assertKgBudget(args: Parameters<typeof kgBudgetProblem>[0]) {
  const problem = kgBudgetProblem(args);
  if (problem) throw conflict(problem);
}

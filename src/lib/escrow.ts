/**
 * HeriTech fixed 60 / 20 / 15 / 5 disbursement split.
 * - 60% to the artisan or cooperative
 * - 20% to the LGU for collection and logistics
 * - 15% to the HeriTech developers who build and run the app
 * - 5% to an NGO or tree-planting group
 *
 * Every screen and API reads the percentages from SPLIT so they cannot drift apart.
 */
export const SPLIT = { artisan: 60, lgu: 20, developers: 15, ngo: 5 } as const;

export const SPLIT_LABEL = `${SPLIT.artisan}/${SPLIT.lgu}/${SPLIT.developers}/${SPLIT.ngo}`;

export interface EscrowSplit {
  /** What the buyer pays: the list price minus any loyalty discount. */
  totalAmount: number;
  artisanPayout: number;
  lguShare: number;
  developerShare: number;
  ngoShare: number;
  /** Loyalty discount taken off the list price; it always comes out of the developers' share. */
  discount: number;
}

/**
 * Splits a price in whole cents so the four parts always add up to what the buyer pays.
 * Any rounding remainder goes to the developers' share.
 *
 * A loyalty discount never touches the artisan, the LGU or the NGO: all three are worked
 * out from the full list price, and the discount is capped at the developers' share.
 */
export function calculateEscrowSplit(listPrice: number, { discountPercent = 0 }: { discountPercent?: number } = {}): EscrowSplit {
  const listCents = Math.round(listPrice * 100);
  const artisanCents = Math.round((listCents * SPLIT.artisan) / 100);
  const lguCents = Math.round((listCents * SPLIT.lgu) / 100);
  const ngoCents = Math.round((listCents * SPLIT.ngo) / 100);
  const remainderCents = listCents - artisanCents - lguCents - ngoCents;
  const discountCents = Math.min(Math.round((listCents * discountPercent) / 100), remainderCents);

  return {
    totalAmount: (listCents - discountCents) / 100,
    artisanPayout: artisanCents / 100,
    lguShare: lguCents / 100,
    developerShare: (remainderCents - discountCents) / 100,
    ngoShare: ngoCents / 100,
    discount: discountCents / 100,
  };
}

/** The money fields stored on an order. Orders from before the 60/20/15/5 split have no developer or NGO share. */
export interface StoredSplit {
  amountPaid?: number;
  discount?: number;
  paymentMode?: string;
  artisanPayout?: number;
  lguShare?: number;
  developerShare?: number;
  ngoShare?: number;
}

/**
 * An order's split under the current SPLIT. Orders recorded before the developer and NGO
 * shares existed are worked out again from what was paid, the same way checkout does now.
 */
export function orderSplit(order: StoredSplit): Pick<EscrowSplit, "artisanPayout" | "lguShare" | "developerShare" | "ngoShare"> {
  if (order.developerShare != null && order.ngoShare != null) {
    return { artisanPayout: order.artisanPayout ?? 0, lguShare: order.lguShare ?? 0, developerShare: order.developerShare, ngoShare: order.ngoShare };
  }
  if (order.paymentMode === "free_claim" || !order.amountPaid) return { artisanPayout: 0, lguShare: 0, developerShare: 0, ngoShare: 0 };
  const discount = order.discount ?? 0;
  const full = calculateEscrowSplit(order.amountPaid + discount);
  return {
    artisanPayout: full.artisanPayout,
    lguShare: full.lguShare,
    developerShare: Math.round((full.developerShare - discount) * 100) / 100,
    ngoShare: full.ngoShare,
  };
}

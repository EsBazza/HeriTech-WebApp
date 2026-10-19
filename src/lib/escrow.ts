/**
 * HeriTech fixed 70 / 25 / 5 disbursement split.
 * - 70% to the artisan or cooperative
 * - 25% to the LGU for collection and logistics
 * - 5% to charity and HeriTech app maintenance
 *
 * Every screen and API reads the percentages from SPLIT so they cannot drift apart.
 */
export const SPLIT = { artisan: 70, lgu: 25, charityMaintenance: 5 } as const;

export const SPLIT_LABEL = `${SPLIT.artisan}/${SPLIT.lgu}/${SPLIT.charityMaintenance}`;

export interface EscrowSplit {
  /** What the buyer pays: the list price minus any loyalty discount. */
  totalAmount: number;
  artisanPayout: number;
  lguShare: number;
  charityMaintenanceShare: number;
  /** Loyalty discount taken off the list price; it always comes out of the charity & maintenance share. */
  discount: number;
}

/**
 * Splits a price in whole cents so the three parts always add up to what the buyer pays.
 * Any rounding remainder goes to the charity & maintenance share.
 *
 * A loyalty discount never touches the artisan or LGU: both are worked out from the
 * full list price, and the discount is capped at the charity & maintenance share.
 */
export function calculateEscrowSplit(listPrice: number, { discountPercent = 0 }: { discountPercent?: number } = {}): EscrowSplit {
  const listCents = Math.round(listPrice * 100);
  const artisanCents = Math.round((listCents * SPLIT.artisan) / 100);
  const lguCents = Math.round((listCents * SPLIT.lgu) / 100);
  const remainderCents = listCents - artisanCents - lguCents;
  const discountCents = Math.min(Math.round((listCents * discountPercent) / 100), remainderCents);

  return {
    totalAmount: (listCents - discountCents) / 100,
    artisanPayout: artisanCents / 100,
    lguShare: lguCents / 100,
    charityMaintenanceShare: (remainderCents - discountCents) / 100,
    discount: discountCents / 100,
  };
}

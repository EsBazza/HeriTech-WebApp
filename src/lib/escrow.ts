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
  totalAmount: number;
  artisanPayout: number;
  lguShare: number;
  charityMaintenanceShare: number;
}

/**
 * Splits a price in whole cents so the three parts always add up to the total.
 * Any rounding remainder goes to the charity & maintenance share.
 */
export function calculateEscrowSplit(totalPrice: number): EscrowSplit {
  const totalCents = Math.round(totalPrice * 100);
  const artisanCents = Math.round((totalCents * SPLIT.artisan) / 100);
  const lguCents = Math.round((totalCents * SPLIT.lgu) / 100);
  const charityCents = totalCents - artisanCents - lguCents;

  return {
    totalAmount: totalCents / 100,
    artisanPayout: artisanCents / 100,
    lguShare: lguCents / 100,
    charityMaintenanceShare: charityCents / 100,
  };
}

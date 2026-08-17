/**
 * HeriTech Fixed 70/20/10 Financial Escrow Engine
 * - 70% -> Direct Artisan Payout (Fair-trade floor price)
 * - 20% -> LGU Logistics + Platform Operations
 * - 10% -> Verified Environmental NGO Trust Fund
 */
export interface EscrowSplit {
  totalAmount: number;
  artisanPayout: number;     // 70%
  platformFee: number;       // 20%
  ngoContribution: number;   // 10%
  percentages: {
    artisan: number;
    platform: number;
    ngo: number;
  };
}

export function calculateEscrowSplit(totalPrice: number): EscrowSplit {
  const roundedPrice = Math.round(totalPrice * 100) / 100;
  
  // Calculate exact splits with 2 decimal precision
  const artisanPayout = Math.round(roundedPrice * 0.70 * 100) / 100;
  const platformFee = Math.round(roundedPrice * 0.20 * 100) / 100;
  // Ensure the remainder matches the total exactly
  const ngoContribution = Math.round((roundedPrice - artisanPayout - platformFee) * 100) / 100;

  return {
    totalAmount: roundedPrice,
    artisanPayout,
    platformFee,
    ngoContribution,
    percentages: {
      artisan: 70,
      platform: 20,
      ngo: 10,
    },
  };
}

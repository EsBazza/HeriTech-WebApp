/**
 * HeriTech Circle loyalty rules, shared by checkout, the profile page and the
 * Google Wallet loyalty card.
 *
 * Collecting 5 Impact Passes or spending $100, whichever comes first, unlocks a
 * one-time 5% discount on the next order. Progress then starts again. The
 * discount comes out of the charity & maintenance share (see calculateEscrowSplit),
 * so artisans and LGUs are always paid in full.
 */
export const LOYALTY = { passesForReward: 5, spendForReward: 100, discountPercent: 5 } as const;

export interface LoyaltyState {
  passesTowardReward: number;
  spendTowardReward: number;
  rewardAvailable: boolean;
  rewardsEarned: number;
  rewardsRedeemed: number;
  /** Lifetime kilograms of festival material diverted by this buyer's purchases; never resets. */
  kgDiverted: number;
}

export const EMPTY_LOYALTY: LoyaltyState = {
  passesTowardReward: 0,
  spendTowardReward: 0,
  rewardAvailable: false,
  rewardsEarned: 0,
  rewardsRedeemed: 0,
  kgDiverted: 0,
};

const roundCents = (n: number) => Math.round(n * 100) / 100;

/**
 * Applies one checkout: spends an available reward if it was used, then counts the
 * new passes and spend. Reaching either goal while no reward is waiting unlocks the
 * next one and resets progress.
 */
export function recordPurchase(
  state: LoyaltyState,
  { passes, spend, redeemed, kg = 0 }: { passes: number; spend: number; redeemed: boolean; kg?: number }
): LoyaltyState {
  const next: LoyaltyState = {
    ...state,
    rewardAvailable: redeemed ? false : state.rewardAvailable,
    rewardsRedeemed: state.rewardsRedeemed + (redeemed ? 1 : 0),
    passesTowardReward: state.passesTowardReward + passes,
    spendTowardReward: roundCents(state.spendTowardReward + spend),
    kgDiverted: Math.round(((state.kgDiverted ?? 0) + kg) * 100) / 100,
  };
  const reached = next.passesTowardReward >= LOYALTY.passesForReward || next.spendTowardReward >= LOYALTY.spendForReward;
  if (reached && !next.rewardAvailable) {
    return { ...next, rewardAvailable: true, rewardsEarned: next.rewardsEarned + 1, passesTowardReward: 0, spendTowardReward: 0 };
  }
  return next;
}

/** Plain-language progress line, e.g. "2 more passes or $38.00 more until 5% off". */
export function progressSummary(state: LoyaltyState): string {
  if (state.rewardAvailable) return `${LOYALTY.discountPercent}% off your next order is ready`;
  const passesLeft = Math.max(LOYALTY.passesForReward - state.passesTowardReward, 0);
  const spendLeft = Math.max(LOYALTY.spendForReward - state.spendTowardReward, 0);
  return `${passesLeft} more ${passesLeft === 1 ? "pass" : "passes"} or $${spendLeft.toFixed(2)} more until ${LOYALTY.discountPercent}% off`;
}

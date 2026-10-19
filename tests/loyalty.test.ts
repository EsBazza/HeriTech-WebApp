import { describe, expect, it } from "vitest";
import { EMPTY_LOYALTY, LOYALTY, progressSummary, recordPurchase } from "@/lib/loyalty";

describe("HeriTech Circle loyalty", () => {
  it("uses 5 passes or $100 for a one-time 5% reward", () => {
    expect(LOYALTY).toEqual({ passesForReward: 5, spendForReward: 100, discountPercent: 5 });
  });

  it("unlocks a reward at 5 passes and starts progress again", () => {
    let state = EMPTY_LOYALTY;
    for (let i = 0; i < 4; i++) state = recordPurchase(state, { passes: 1, spend: 10, redeemed: false });
    expect(state.rewardAvailable).toBe(false);
    state = recordPurchase(state, { passes: 1, spend: 10, redeemed: false });
    expect(state).toMatchObject({ rewardAvailable: true, rewardsEarned: 1, passesTowardReward: 0, spendTowardReward: 0 });
  });

  it("unlocks a reward at $100 spent, whichever comes first", () => {
    const state = recordPurchase(EMPTY_LOYALTY, { passes: 2, spend: 100, redeemed: false });
    expect(state).toMatchObject({ rewardAvailable: true, rewardsEarned: 1 });
  });

  it("keeps counting while a reward waits, without stacking a second one", () => {
    const ready = recordPurchase(EMPTY_LOYALTY, { passes: 5, spend: 50, redeemed: false });
    const state = recordPurchase(ready, { passes: 5, spend: 120, redeemed: false });
    expect(state).toMatchObject({ rewardAvailable: true, rewardsEarned: 1, passesTowardReward: 5, spendTowardReward: 120 });
  });

  it("spends the reward on the next order and can unlock the next one from it", () => {
    const ready = recordPurchase(EMPTY_LOYALTY, { passes: 5, spend: 50, redeemed: false });
    const used = recordPurchase(ready, { passes: 1, spend: 19, redeemed: true });
    expect(used).toMatchObject({ rewardAvailable: false, rewardsRedeemed: 1, passesTowardReward: 1, spendTowardReward: 19 });
    const bigOrder = recordPurchase(ready, { passes: 6, spend: 150, redeemed: true });
    expect(bigOrder).toMatchObject({ rewardAvailable: true, rewardsEarned: 2, rewardsRedeemed: 1, passesTowardReward: 0 });
  });

  it("describes progress in plain language", () => {
    expect(progressSummary(recordPurchase(EMPTY_LOYALTY, { passes: 3, spend: 62, redeemed: false }))).toBe("2 more passes or $38.00 more until 5% off");
    expect(progressSummary({ ...EMPTY_LOYALTY, rewardAvailable: true })).toBe("5% off your next order is ready");
  });
});

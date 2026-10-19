import { EMPTY_LOYALTY, LOYALTY, progressSummary } from "@/lib/loyalty";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { appUrl, ok, route } from "@/lib/server/http";
import { loyaltyCardSaveUrl, walletConfigured } from "@/lib/server/wallet";

/**
 * GET /api/loyalty — the signed-in buyer's HeriTech Circle progress, the rules,
 * and a Save to Google Wallet link for their loyalty card when Wallet is set up.
 */
export const GET = route(async (request: Request) => {
  const user = await requireUser(request);
  const doc = (await db.loyalty().doc(user.id).get()).data();
  const state = {
    passesTowardReward: doc?.passesTowardReward ?? EMPTY_LOYALTY.passesTowardReward,
    spendTowardReward: doc?.spendTowardReward ?? EMPTY_LOYALTY.spendTowardReward,
    rewardAvailable: doc?.rewardAvailable ?? EMPTY_LOYALTY.rewardAvailable,
    rewardsEarned: doc?.rewardsEarned ?? EMPTY_LOYALTY.rewardsEarned,
    rewardsRedeemed: doc?.rewardsRedeemed ?? EMPTY_LOYALTY.rewardsRedeemed,
    kgDiverted: doc?.kgDiverted ?? EMPTY_LOYALTY.kgDiverted,
  };

  return ok({
    ...state,
    rules: LOYALTY,
    summary: progressSummary(state),
    saveUrl: walletConfigured() ? loyaltyCardSaveUrl({ userId: user.id, name: user.fullName, state }, appUrl(request)) : null,
  });
});

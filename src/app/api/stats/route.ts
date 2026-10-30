import { db } from "@/lib/server/firestore";
import { ok, route } from "@/lib/server/http";
import { materialTotals, orderTotals } from "@/lib/server/stats";

/** Public totals for the homepage and impact record. */
async function publicStats() {
  const [orders, materials, artisans] = await Promise.all([
    orderTotals(),
    materialTotals(),
    db.users().where("role", "==", "artisan").where("artisanVerified", "==", true).count().get(),
  ]);

  return {
      totalKgCollected: materials.totalKgCollected,
      totalBatches: materials.batchCount,
      totalOrders: orders.orderCount,
      totalPassesIssued: materials.passCount,
      verifiedArtisansCount: artisans.data().count,
      escrowSplitSummary: {
        totalGrossVolume: orders.grossVolume,
        artisanPayout: orders.artisanPayoutTotal,
        lguShare: orders.lguShareTotal,
        developerShare: orders.developerShareTotal,
        ngoShare: orders.ngoShareTotal,
      },
      festivals: materials.festivals,
      leaderboard: materials.leaderboard,
    };
}

export type PublicStats = Awaited<ReturnType<typeof publicStats>>;

/** GET /api/stats — public totals for the homepage and impact record. */
export const GET = route(async () =>
  ok(await publicStats(), { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } })
);

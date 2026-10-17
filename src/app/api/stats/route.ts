import { db } from "@/lib/server/firestore";
import { ok, route } from "@/lib/server/http";
import { materialTotals, orderTotals } from "@/lib/server/stats";

/** GET /api/stats — public totals for the homepage and impact ledger. */
export const GET = route(async () => {
  const [orders, materials, artisans] = await Promise.all([
    orderTotals(),
    materialTotals(),
    db.users().where("role", "==", "artisan").where("artisanVerified", "==", true).count().get(),
  ]);

  return ok(
    {
      totalKgCollected: materials.totalKgCollected,
      totalBatches: materials.batchCount,
      totalOrders: orders.orderCount,
      totalPassesIssued: materials.passCount,
      verifiedArtisansCount: artisans.data().count,
      escrowSplitSummary: {
        totalGrossVolume: orders.grossVolume,
        artisanPayout: orders.artisanPayoutTotal,
        lguShare: orders.lguShareTotal,
        charityMaintenance: orders.charityMaintenanceTotal,
      },
      festivals: materials.festivals,
      leaderboard: materials.leaderboard,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
});

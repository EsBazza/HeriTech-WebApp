import { SPLIT } from "@/lib/escrow";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { ok, route } from "@/lib/server/http";
import { materialTotals, orderTotals } from "@/lib/server/stats";

/** KPIs and chart data for the admin dashboard. */
async function adminStats() {
  const [orders, materials, roleSnap] = await Promise.all([
    orderTotals(),
    materialTotals(),
    db.users().select("role", "verificationStatus").get(),
  ]);

  const users = roleSnap.docs.map((d) => d.data() as { role: string; verificationStatus: string });
  const countRole = (role: string) => users.filter((u) => u.role === role).length;

  return {
    kpis: {
      ...orders,
      totalKgCollected: materials.totalKgCollected,
      totalKgClaimed: materials.totalKgClaimed,
      totalBatches: materials.batchCount,
      totalOrders: orders.orderCount,
      totalPasses: materials.passCount,
      totalUsers: users.length,
      pendingApplicationsCount: users.filter((u) => u.verificationStatus.startsWith("pending_")).length,
    },
    escrowSplitDistribution: [
      { name: `Artisan payout (${SPLIT.artisan}%)`, value: orders.artisanPayoutTotal },
      { name: `Platform (${SPLIT.platform}%)`, value: orders.platformShareTotal },
      { name: `Local government (${SPLIT.lgu}%)`, value: orders.lguShareTotal },
      { name: `NGOs & tree planting (${SPLIT.ngo}%)`, value: orders.ngoShareTotal },
    ],
    festivals: materials.festivals.map((f) => ({
      name: f.festival,
      country: f.country,
      allocated: f.allocatedKg,
      collected: f.collectedKg,
      rate: f.quotaProgress,
    })),
    materialDistribution: materials.materialDistribution,
    roleCounts: {
      buyers: countRole("buyer"),
      artisans: countRole("artisan"),
      lgu: countRole("lgu"),
      admins: countRole("admin"),
    },
  };
}

export type AdminStats = Awaited<ReturnType<typeof adminStats>>;

/** GET /api/admin/stats — KPIs and chart data for the admin dashboard. */
export const GET = route(async (request: Request) => {
  await requireUser(request, ["admin"]);
  return ok(await adminStats());
});

import "server-only";
import { orderSplit, type StoredSplit } from "@/lib/escrow";
import { db, getMany } from "./firestore";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Money totals across all completed orders. They are added up here rather than with
 * Firestore aggregation so orders from before the 60/20/15/5 split count under the new
 * split too (see orderSplit), and no composite index is needed.
 * Free pieces claimed at the booth are $0 orders: they add nothing to the sums and
 * are counted separately, so `orderCount` is sales only.
 */
export async function orderTotals() {
  const snap = await db
    .orders()
    .where("status", "==", "completed")
    .select("amountPaid", "discount", "paymentMode", "artisanPayout", "lguShare", "developerShare", "ngoShare")
    .get();
  const t = { gross: 0, artisan: 0, lgu: 0, developers: 0, ngo: 0 };
  let freeClaimCount = 0;
  for (const doc of snap.docs) {
    const order = doc.data() as StoredSplit;
    if (order.paymentMode === "free_claim") freeClaimCount++;
    const split = orderSplit(order);
    t.gross += order.amountPaid ?? 0;
    t.artisan += split.artisanPayout;
    t.lgu += split.lguShare;
    t.developers += split.developerShare;
    t.ngo += split.ngoShare;
  }
  return {
    orderCount: Math.max(snap.size - freeClaimCount, 0),
    freeClaimCount,
    grossVolume: round2(t.gross),
    artisanPayoutTotal: round2(t.artisan),
    lguShareTotal: round2(t.lgu),
    developerShareTotal: round2(t.developers),
    ngoShareTotal: round2(t.ngo),
  };
}

type BatchSummary = {
  weightKg: number;
  status: string;
  materialType: string;
  scannedByOfficerId: string | null;
  claimedByArtisanId: string | null;
};

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  role: "artisan" | "lgu";
  country: string | null;
  kgDiverted: number;
  batches: number;
}

/**
 * Ranks artisans by kilograms they picked up and LGU officers by kilograms they
 * logged. Buyers are left out so purchases stay private.
 */
async function leaderboard(batches: BatchSummary[], limit = 20): Promise<LeaderboardEntry[]> {
  const totals = new Map<string, { role: "artisan" | "lgu"; kg: number; batches: number }>();
  const add = (id: string | null, role: "artisan" | "lgu", kg: number) => {
    if (!id) return;
    const entry = totals.get(`${role}:${id}`) ?? { role, kg: 0, batches: 0 };
    entry.kg += kg;
    entry.batches += 1;
    totals.set(`${role}:${id}`, entry);
  };
  for (const b of batches) {
    add(b.scannedByOfficerId, "lgu", b.weightKg);
    if (b.status === "claimed") add(b.claimedByArtisanId, "artisan", b.weightKg);
  }

  const users = await getMany(db.users(), [...totals.keys()].map((key) => key.split(":")[1]));
  return [...totals]
    .map(([key, t]) => {
      const user = users.get(key.split(":")[1]);
      const label = t.role === "artisan" ? user?.workshopName : user?.stationName;
      return { id: key, name: label || user?.fullName || "HeriTech member", role: t.role, country: user?.country ?? null, kgDiverted: round2(t.kg), batches: t.batches };
    })
    .sort((a, b) => b.kgDiverted - a.kgDiverted)
    .slice(0, limit)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

/** Batch weights, agreement quota progress and the public leaderboard. */
export async function materialTotals() {
  const [batchSnap, agreementSnap, passCount] = await Promise.all([
    db.batches().select("weightKg", "status", "materialType", "scannedByOfficerId", "claimedByArtisanId").get(),
    db.agreements().get(),
    db.passes().count().get(),
  ]);

  const batches = batchSnap.docs.map((d) => d.data() as unknown as BatchSummary);
  const byMaterial = new Map<string, number>();
  for (const b of batches) byMaterial.set(b.materialType, (byMaterial.get(b.materialType) ?? 0) + b.weightKg);

  return {
    batchCount: batches.length,
    totalKgCollected: round2(batches.reduce((sum, b) => sum + b.weightKg, 0)),
    totalKgClaimed: round2(batches.filter((b) => b.status === "claimed").reduce((sum, b) => sum + b.weightKg, 0)),
    passCount: passCount.data().count,
    materialDistribution: [...byMaterial].map(([type, weight]) => ({ type, weight: Math.round(weight * 10) / 10 })),
    leaderboard: await leaderboard(batches),
    festivals: agreementSnap.docs.map((d) => {
      const a = d.data();
      return {
        festival: a.festival,
        country: a.country,
        allocatedKg: a.allocatedKg,
        collectedKg: a.collectedKg,
        quotaProgress: a.allocatedKg > 0 ? Math.round((a.collectedKg / a.allocatedKg) * 100) : 0,
      };
    }),
  };
}

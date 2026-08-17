import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats - Comprehensive data for the Admin Dashboard charts and KPIs
export async function GET() {
  try {
    const [
      totalUsers,
      users,
      pendingApplications,
      totalBatches,
      batches,
      totalOrders,
      orders,
      agreements,
      totalPasses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({ select: { role: true, verificationStatus: true, country: true } }),
      prisma.user.count({
        where: { verificationStatus: { in: ["pending_artisan", "pending_lgu"] } },
      }),
      prisma.materialBatch.count(),
      prisma.materialBatch.findMany({
        select: {
          id: true,
          weightKg: true,
          status: true,
          materialType: true,
          condition: true,
          createdAt: true,
        },
      }),
      prisma.order.count(),
      prisma.order.findMany({
        select: {
          amountPaid: true,
          artisanPayout: true,
          platformFee: true,
          ngoContribution: true,
          createdAt: true,
        },
      }),
      prisma.agreement.findMany({
        include: {
          batches: { select: { weightKg: true, status: true } },
        },
      }),
      prisma.walletPass.count(),
    ]);

    // Financial Totals
    const grossVolume = orders.reduce((sum, o) => sum + o.amountPaid, 0);
    const artisanPayoutTotal = orders.reduce((sum, o) => sum + o.artisanPayout, 0);
    const platformFeeTotal = orders.reduce((sum, o) => sum + o.platformFee, 0);
    const ngoFundTotal = orders.reduce((sum, o) => sum + o.ngoContribution, 0);

    // Total kilograms collected
    const totalKgCollected = batches.reduce((sum, b) => sum + b.weightKg, 0);
    const totalKgClaimed = batches
      .filter((b) => b.status === "claimed")
      .reduce((sum, b) => sum + b.weightKg, 0);

    // User breakdown
    const roleCounts = {
      buyers: users.filter((u) => u.role === "buyer").length,
      artisans: users.filter((u) => u.role === "artisan").length,
      lgu: users.filter((u) => u.role === "lgu").length,
      admins: users.filter((u) => u.role === "admin").length,
    };

    // Material type breakdown
    const materialTypeDist: Record<string, number> = {};
    batches.forEach((b) => {
      materialTypeDist[b.materialType] = (materialTypeDist[b.materialType] || 0) + b.weightKg;
    });

    // Festival quota progress for charts
    const festivalData = agreements.map((a) => ({
      name: a.festival,
      country: a.country,
      allocated: a.allocatedKg,
      collected: a.collectedKg,
      rate: Math.round((a.collectedKg / a.allocatedKg) * 100),
    }));

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          grossVolume: Math.round(grossVolume * 100) / 100,
          artisanPayoutTotal: Math.round(artisanPayoutTotal * 100) / 100,
          platformFeeTotal: Math.round(platformFeeTotal * 100) / 100,
          ngoFundTotal: Math.round(ngoFundTotal * 100) / 100,
          totalKgCollected: Math.round(totalKgCollected * 100) / 100,
          totalKgClaimed: Math.round(totalKgClaimed * 100) / 100,
          totalBatches,
          totalOrders,
          totalPasses,
          totalUsers,
          pendingApplicationsCount: pendingApplications,
        },
        escrowSplitDistribution: [
          { name: "Artisan Direct Payout (70%)", value: artisanPayoutTotal, color: "#2563EB" },
          { name: "LGU & Platform Ops (20%)", value: platformFeeTotal, color: "#10B981" },
          { name: "NGO Clean-up Fund (10%)", value: ngoFundTotal, color: "#F59E0B" },
        ],
        festivals: festivalData,
        materialDistribution: Object.entries(materialTypeDist).map(([type, weight]) => ({
          type,
          weight: Math.round(weight * 10) / 10,
        })),
        roleCounts,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate admin statistics" },
      { status: 500 }
    );
  }
}

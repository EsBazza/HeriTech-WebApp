import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/stats - High-level system telemetry for the public Impact Dashboard
export async function GET() {
  try {
    const [
      totalBatches,
      batches,
      totalOrders,
      orders,
      totalArtisans,
      agreements,
      totalPasses,
    ] = await Promise.all([
      prisma.materialBatch.count(),
      prisma.materialBatch.findMany({ select: { weightKg: true, status: true, materialType: true } }),
      prisma.order.count(),
      prisma.order.findMany({
        select: {
          amountPaid: true,
          artisanPayout: true,
          platformFee: true,
          ngoContribution: true,
        },
      }),
      prisma.user.count({ where: { role: "artisan", artisanVerified: true } }),
      prisma.agreement.findMany({
        select: {
          id: true,
          festival: true,
          country: true,
          allocatedKg: true,
          collectedKg: true,
        },
      }),
      prisma.walletPass.count(),
    ]);

    const totalKgCollected = batches.reduce((sum, b) => sum + b.weightKg, 0);
    const totalRevenue = orders.reduce((sum, o) => sum + o.amountPaid, 0);
    const totalArtisanPayout = orders.reduce((sum, o) => sum + o.artisanPayout, 0);
    const totalPlatformFee = orders.reduce((sum, o) => sum + o.platformFee, 0);
    const totalNgoFunds = orders.reduce((sum, o) => sum + o.ngoContribution, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalKgCollected: Math.round(totalKgCollected * 100) / 100,
        totalBatches,
        totalOrders,
        totalPassesIssued: totalPasses,
        verifiedArtisansCount: totalArtisans,
        escrowSplitSummary: {
          totalGrossVolume: Math.round(totalRevenue * 100) / 100,
          artisanPayout70: Math.round(totalArtisanPayout * 100) / 100,
          lguPlatformFee20: Math.round(totalPlatformFee * 100) / 100,
          ngoTrustFund10: Math.round(totalNgoFunds * 100) / 100,
        },
        festivals: agreements.map((a) => ({
          festival: a.festival,
          country: a.country,
          allocatedKg: a.allocatedKg,
          collectedKg: a.collectedKg,
          quotaProgress: Math.round((a.collectedKg / a.allocatedKg) * 100),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error calculating stats" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  try {
    const { serial } = await params;

    const pass = await prisma.walletPass.findUnique({
      where: { serial },
      include: {
        order: {
          include: {
            buyer: {
              select: { fullName: true, country: true },
            },
            product: {
              include: {
                artisan: {
                  select: {
                    fullName: true,
                    workshopName: true,
                    country: true,
                    artisanVerified: true,
                  },
                },
                sourceBatch: {
                  include: {
                    agreement: true,
                    scannedByOfficer: {
                      select: { fullName: true, stationName: true, country: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pass) {
      return NextResponse.json(
        { success: false, error: "Verified Impact Pass not found" },
        { status: 404 }
      );
    }

    const { order } = pass;
    const { product } = order;
    const { sourceBatch } = product;

    return NextResponse.json({
      success: true,
      verified: true,
      data: {
        serial: pass.serial,
        issuedAt: pass.issuedAt,
        tamperEvidentHarvestHash: pass.harvestHash || sourceBatch.txHash,
        product: {
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          kgDiverted: product.kgDiverted,
        },
        escrowAudit: {
          totalAmount: order.amountPaid,
          artisanPayout: order.artisanPayout,       // 70%
          platformFee: order.platformFee,           // 20%
          ngoContribution: order.ngoContribution,   // 10%
          ngoFundName: product.ngoFundName,
        },
        maker: {
          name: product.artisan.fullName,
          workshop: product.artisan.workshopName,
          country: product.artisan.country,
          verified: product.artisan.artisanVerified,
        },
        originHarvest: {
          batchId: sourceBatch.id,
          materialType: sourceBatch.materialType,
          condition: sourceBatch.condition,
          weightKg: sourceBatch.weightKg,
          festival: sourceBatch.agreement?.festival,
          country: sourceBatch.agreement?.country,
          gpsCoordinates: {
            lat: sourceBatch.gpsLat,
            lng: sourceBatch.gpsLng,
          },
          harvestLoggedAt: sourceBatch.createdAt,
          loggedByOfficer: sourceBatch.scannedByOfficer?.fullName,
          municipalityStation: sourceBatch.scannedByOfficer?.stationName,
        },
      },
    });
  } catch (error) {
    console.error("Failed to verify impact pass:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error verifying impact pass" },
      { status: 500 }
    );
  }
}

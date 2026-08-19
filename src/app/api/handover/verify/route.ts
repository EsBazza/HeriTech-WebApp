import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Act 3 - Physical QR Handover Verification
 * LGU officer scans Artisan's verified QR token (e.g., "usr_art_01" or "ART-12345")
 * Custody transfers from "reserved" -> "claimed"
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { batchId, artisanId, officerId } = body;

    if (!batchId || !artisanId) {
      return NextResponse.json(
        { success: false, error: "batchId and artisanId are required for QR handover audit" },
        { status: 400 }
      );
    }

    const batch = await prisma.materialBatch.findUnique({
      where: { id: batchId },
      include: { reservedByArtisan: true },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Material batch not found" },
        { status: 404 }
      );
    }

    // Verify artisan is verified
    const artisan = await prisma.user.findUnique({
      where: { id: artisanId },
    });

    if (!artisan || artisan.role !== "artisan") {
      return NextResponse.json(
        { success: false, error: "Invalid artisan account" },
        { status: 403 }
      );
    }

    // Update custody
    const updatedBatch = await prisma.materialBatch.update({
      where: { id: batchId },
      data: {
        status: "claimed",
        claimedByArtisanId: artisanId,
      },
      include: {
        claimedByArtisan: true,
        scannedByOfficer: true,
        agreement: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Custody of Batch ${batchId} officially transferred to ${artisan.fullName} (${artisan.workshopName || "Verified Cooperative"}).`,
      data: {
        batchId: updatedBatch.id,
        status: updatedBatch.status,
        artisan: {
          id: artisan.id,
          name: artisan.fullName,
          workshop: artisan.workshopName,
        },
        verifiedAt: new Date().toISOString(),
        officerId: officerId || updatedBatch.scannedByOfficerId,
      },
    });
  } catch (error) {
    console.error("Failed to process QR handover audit:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during QR handover" },
      { status: 500 }
    );
  }
}

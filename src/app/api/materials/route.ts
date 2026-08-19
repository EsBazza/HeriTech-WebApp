import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateHarvestTxHash } from "@/lib/crypto";

// GET /api/materials - List all batches with optional filtering by status or festival
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const materialType = searchParams.get("materialType");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (materialType) where.materialType = materialType;

    const batches = await prisma.materialBatch.findMany({
      where,
      include: {
        agreement: true,
        scannedByOfficer: {
          select: { id: true, fullName: true, stationName: true, country: true },
        },
        reservedByArtisan: {
          select: { id: true, fullName: true, workshopName: true },
        },
        claimedByArtisan: {
          select: { id: true, fullName: true, workshopName: true },
        },
        products: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    console.error("Failed to fetch materials:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching materials" },
      { status: 500 }
    );
  }
}

// POST /api/materials - Log a new batch (LGU Field Officer)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      materialType,
      weightKg,
      condition,
      gpsLat = 16.4023,
      gpsLng = 120.5960,
      imageUrl,
      agreementId,
      officerId,
      aiInferredMaterial,
      aiInferredCondition,
      aiConfidence,
    } = body;

    if (!title || !materialType || !weightKg || !condition) {
      return NextResponse.json(
        { success: false, error: "Missing required harvest telemetry fields" },
        { status: 400 }
      );
    }

    // Auto-generate batch ID
    const batchCount = await prisma.materialBatch.count();
    const batchId = `HT-2026-${String(batchCount + 101).padStart(4, "0")}`;
    const timestamp = new Date();

    // Verify if agreement exists in DB to prevent foreign key errors
    let validAgreementId: string | null = null;
    if (agreementId) {
      const agreementExists = await prisma.agreement.findUnique({
        where: { id: agreementId },
      });
      if (agreementExists) {
        validAgreementId = agreementId;
      }
    }

    // If no agreement matched, fallback to default Baguio Panagbenga agreement if available
    if (!validAgreementId) {
      const fallbackAgr = await prisma.agreement.findFirst();
      if (fallbackAgr) {
        validAgreementId = fallbackAgr.id;
      }
    }

    // Verify if officer user exists in DB to prevent foreign key errors
    let validOfficerId: string | null = null;
    if (officerId) {
      const userExists = await prisma.user.findUnique({
        where: { id: officerId },
      });
      if (userExists) {
        validOfficerId = officerId;
      }
    }

    // Generate SHA-256 tamper-evident origin hash
    const txHash = generateHarvestTxHash({
      batchId,
      gpsLat: Number(gpsLat),
      gpsLng: Number(gpsLng),
      weightKg: Number(weightKg),
      officerId: validOfficerId || "system_officer",
      timestamp,
    });

    // Provide clean preview image URL if large payload
    const finalImageUrl = imageUrl && imageUrl.startsWith("data:")
      ? imageUrl
      : imageUrl || "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800";

    const newBatch = await prisma.materialBatch.create({
      data: {
        id: batchId,
        title,
        materialType,
        weightKg: Number(weightKg),
        condition,
        gpsLat: Number(gpsLat),
        gpsLng: Number(gpsLng),
        imageUrl: finalImageUrl,
        agreementId: validAgreementId,
        scannedByOfficerId: validOfficerId,
        txHash,
        aiInferredMaterial: aiInferredMaterial || null,
        aiInferredCondition: aiInferredCondition || null,
        aiConfidence: aiConfidence ? Number(aiConfidence) : null,
        createdAt: timestamp,
      },
      include: {
        agreement: true,
        scannedByOfficer: true,
      },
    });

    // Update agreement collectedKg if valid
    if (validAgreementId) {
      try {
        await prisma.agreement.update({
          where: { id: validAgreementId },
          data: { collectedKg: { increment: Number(weightKg) } },
        });
      } catch (e) {
        console.warn("Could not increment agreement collectedKg:", e);
      }
    }

    return NextResponse.json({ success: true, data: newBatch }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create material batch:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log material batch" },
      { status: 500 }
    );
  }
}

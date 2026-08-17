import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { artisanId } = body;

    if (!artisanId) {
      return NextResponse.json(
        { success: false, error: "artisanId is required to reserve a batch" },
        { status: 400 }
      );
    }

    // Verify batch exists and is available
    const batch = await prisma.materialBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Material batch not found" },
        { status: 404 }
      );
    }

    if (batch.status !== "available") {
      return NextResponse.json(
        { success: false, error: `Batch is currently ${batch.status} and cannot be reserved` },
        { status: 400 }
      );
    }

    const updatedBatch = await prisma.materialBatch.update({
      where: { id },
      data: {
        status: "reserved",
        reservedByArtisanId: artisanId,
      },
      include: {
        reservedByArtisan: true,
        agreement: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Batch ${id} reserved successfully for artisan. Proceed to on-site QR handover (Act 3).`,
      data: updatedBatch,
    });
  } catch (error) {
    console.error("Failed to reserve batch:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error reserving batch" },
      { status: 500 }
    );
  }
}

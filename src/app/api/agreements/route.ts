import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/agreements - List all municipal agreements and quota fulfillment
export async function GET() {
  try {
    const agreements = await prisma.agreement.findMany({
      include: {
        batches: {
          select: {
            id: true,
            title: true,
            weightKg: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { signedAt: "desc" },
    });

    return NextResponse.json({ success: true, count: agreements.length, data: agreements });
  } catch (error) {
    console.error("Failed to fetch agreements:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching agreements" },
      { status: 500 }
    );
  }
}

// POST /api/agreements - Create a new Step 0 Municipal Consent Agreement
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, organizerName, festival, country, allocatedKg } = body;

    if (!title || !organizerName || !festival || !country || !allocatedKg) {
      return NextResponse.json(
        { success: false, error: "Missing required agreement fields" },
        { status: 400 }
      );
    }

    const count = await prisma.agreement.count();
    const id = `RA-2026-${String(count + 1).padStart(3, "0")}`;

    const agreement = await prisma.agreement.create({
      data: {
        id,
        title,
        organizerName,
        festival,
        country,
        allocatedKg: Number(allocatedKg),
        collectedKg: 0,
        status: "active",
      },
    });

    return NextResponse.json({ success: true, data: agreement }, { status: 201 });
  } catch (error) {
    console.error("Failed to create agreement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create agreement" },
      { status: 500 }
    );
  }
}

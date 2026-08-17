import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/user/apply - Submit role upgrade verification application
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, workshopName, craftTypology, stationName, country, bio, notes } = body;

    if (!userId || !type || (type !== "artisan" && type !== "lgu")) {
      return NextResponse.json(
        { success: false, error: "Invalid application payload. Type must be 'artisan' or 'lgu'." },
        { status: 400 }
      );
    }

    const applicationPayload = {
      appliedAt: new Date().toISOString(),
      type,
      workshopName: workshopName || null,
      craftTypology: craftTypology || null,
      stationName: stationName || null,
      country: country || null,
      bio: bio || null,
      notes: notes || null,
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: type === "artisan" ? "pending_artisan" : "pending_lgu",
        workshopName: workshopName || undefined,
        stationName: stationName || undefined,
        country: country || undefined,
        applicationNotes: JSON.stringify(applicationPayload),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Your application to become a verified ${type.toUpperCase()} has been submitted for Admin review.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Application submission error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit verification application" },
      { status: 500 }
    );
  }
}

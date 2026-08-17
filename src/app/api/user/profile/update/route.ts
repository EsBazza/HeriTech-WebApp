import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, fullName, avatarUrl, country, workshopName, stationName } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName || undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        country: country || undefined,
        workshopName: workshopName !== undefined ? workshopName : undefined,
        stationName: stationName !== undefined ? stationName : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/applications - List all pending, approved, or rejected applications
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) {
      where.verificationStatus = status;
    } else {
      where.verificationStatus = {
        in: ["pending_artisan", "pending_lgu", "approved", "rejected"],
      };
    }

    const applications = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const parsed = applications.map((u) => ({
      ...u,
      applicationDetails: u.applicationNotes ? JSON.parse(u.applicationNotes) : null,
    }));

    return NextResponse.json({ success: true, count: parsed.length, data: parsed });
  } catch (error) {
    console.error("Admin applications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch verification applications" },
      { status: 500 }
    );
  }
}

// POST /api/admin/applications - Approve or Reject an applicant
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, action, adminNotes } = body; // action: 'approve' | 'reject'

    if (!userId || !action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { success: false, error: "Invalid review action. Must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Target user not found" },
        { status: 404 }
      );
    }

    let newRole = user.role;
    let isArtisanVerified = user.artisanVerified;
    let newStatus = action === "approve" ? "approved" : "rejected";

    if (action === "approve") {
      if (user.verificationStatus === "pending_artisan") {
        newRole = "artisan";
        isArtisanVerified = true;
      } else if (user.verificationStatus === "pending_lgu") {
        newRole = "lgu";
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        artisanVerified: isArtisanVerified,
        verificationStatus: newStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.fullName} (${user.email}) has been ${action === "approve" ? "APPROVED" : "REJECTED"} as ${newRole.toUpperCase()}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Admin application review error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process application review" },
      { status: 500 }
    );
  }
}

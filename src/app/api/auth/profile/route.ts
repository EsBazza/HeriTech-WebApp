import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/auth/profile - Sync authenticated Google user with Prisma database
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName, avatarUrl } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required for authentication sync" },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // First-time Google OAuth login -> Default to 'buyer' role
      user = await prisma.user.create({
        data: {
          email,
          fullName: fullName || email.split("@")[0],
          avatarUrl: avatarUrl || null,
          role: "buyer", // Default role
          verificationStatus: "none",
        },
      });
    } else {
      // Update existing user with latest Google avatar / name if provided
      user = await prisma.user.update({
        where: { email },
        data: {
          fullName: fullName || user.fullName,
          avatarUrl: avatarUrl || user.avatarUrl,
        },
      });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Auth profile sync error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error syncing profile" },
      { status: 500 }
    );
  }
}

// GET /api/auth/profile?email=xxx - Fetch user profile and permissions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        products: { take: 5, orderBy: { createdAt: "desc" } },
        orders: { take: 5, orderBy: { createdAt: "desc" } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

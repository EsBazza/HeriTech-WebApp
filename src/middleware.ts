import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { userRole, UserRole } from "@/lib/roleGuard";

// Define route access rules
// Public routes accessible to everyone (guest, buyer, artisan, lgu, admin)
// Routes requiring specific roles:
// - /map: artisan, lgu, admin
// - /studio: artisan, admin
// - /scanner: lgu, admin
// - /admin: admin
// - /agreements: lgu, admin
// - /handover: artisan, lgu, admin

interface RouteRule {
  prefix: string;
  allowedRoles: UserRole[];
}

const ROUTE_RULES: RouteRule[] = [
  { prefix: "/admin", allowedRoles: ["admin"] },
  { prefix: "/scanner", allowedRoles: ["lgu", "admin"] },
  { prefix: "/studio", allowedRoles: ["artisan", "admin"] },
  { prefix: "/map", allowedRoles: ["artisan", "lgu", "admin"] },
  { prefix: "/agreements", allowedRoles: ["lgu", "admin"] },
  { prefix: "/handover", allowedRoles: ["artisan", "lgu", "admin"] },
];

export async function middleware(request: NextRequest) {
  // Let Next.js route to the page where client-side AccessGuard renders the dedicated access restriction view directly on that URL
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, logos
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

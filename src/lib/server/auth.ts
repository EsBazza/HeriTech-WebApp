import "server-only";
import { adminAuth } from "@/lib/firebase/admin";
import type { PublicUser, UserDoc, UserRole } from "@/lib/firebase/types";
import { db } from "./firestore";
import { forbidden, unauthorized } from "./http";

export interface VerifiedToken {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

/** Verifies the `Authorization: Bearer <Firebase ID token>` header, if present. */
export async function verifyRequestToken(request: Request): Promise<VerifiedToken | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;

  try {
    const decoded = await adminAuth().verifyIdToken(match[1]);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: typeof decoded.name === "string" ? decoded.name : null,
      picture: decoded.picture ?? null,
    };
  } catch {
    throw unauthorized("Your session has expired. Sign in again.");
  }
}

/** The signed-in user's profile, or null for guests. */
export async function getCurrentUser(request: Request): Promise<UserDoc | null> {
  const token = await verifyRequestToken(request);
  if (!token) return null;
  const snap = await db.users().doc(token.uid).get();
  return snap.data() ?? null;
}

/**
 * Requires a signed-in user and, optionally, one of the given roles.
 * Admins pass every role check.
 */
export async function requireUser(request: Request, roles?: readonly UserRole[]): Promise<UserDoc> {
  const user = await getCurrentUser(request);
  if (!user) throw unauthorized();
  if (roles && user.role !== "admin" && !roles.includes(user.role)) {
    throw forbidden(`This needs a ${roles.join(" or ")} account.`);
  }
  return user;
}

export function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    country: user.country,
    workshopName: user.workshopName,
    stationName: user.stationName,
    artisanVerified: user.artisanVerified,
  };
}

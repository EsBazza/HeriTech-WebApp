import { adminDb } from "@/lib/firebase/admin";
import type { UserDoc } from "@/lib/firebase/types";
import { getCurrentUser, verifyRequestToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { notFound, ok, route, unauthorized } from "@/lib/server/http";

/**
 * POST /api/auth/profile
 * Called after Firebase sign-in. Creates the user's profile on first sign-in
 * (always as a buyer). Name and avatar come from the verified token and only
 * fill empty fields, so edits made on the profile page are kept.
 */
export const POST = route(async (request: Request) => {
  const token = await verifyRequestToken(request);
  if (!token) throw unauthorized();

  const ref = db.users().doc(token.uid);
  const user = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.data();

    if (existing) {
      const updates: Partial<UserDoc> = {};
      if (token.name && !existing.fullName) updates.fullName = token.name;
      if (token.picture && !existing.avatarUrl) updates.avatarUrl = token.picture;
      if (Object.keys(updates).length) tx.update(ref, updates);
      return { ...existing, ...updates };
    }

    if (!token.email) throw unauthorized("Your Google account has no email address.");
    const created: UserDoc = {
      id: token.uid,
      email: token.email,
      role: "buyer",
      fullName: token.name || token.email.split("@")[0],
      avatarUrl: token.picture,
      country: null,
      workshopName: null,
      stationName: null,
      artisanVerified: false,
      verificationStatus: "none",
      application: null,
      preferredLanguage: "en",
      createdAt: new Date().toISOString(),
    };
    tx.create(ref, created);
    return created;
  });

  return ok(user);
});

/** GET /api/auth/profile — the signed-in user's own profile. */
export const GET = route(async (request: Request) => {
  const user = await getCurrentUser(request);
  if (!user) throw notFound("No profile yet. Sign in to create one.");
  return ok(user);
});

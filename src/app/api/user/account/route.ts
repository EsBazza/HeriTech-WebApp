import type { DocumentReference, WriteBatch } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { forbidden, ok, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";

/** Stand-in owner for orders kept after their buyer deleted their account. */
const DELETED_USER_ID = "deleted-user";

/** Applies writes in Firestore's 500-per-batch limit. */
async function inBatches<T>(items: T[], write: (batch: WriteBatch, item: T) => void) {
  for (let i = 0; i < items.length; i += 400) {
    const batch = adminDb().batch();
    items.slice(i, i + 400).forEach((item) => write(batch, item));
    await batch.commit();
  }
}

/**
 * DELETE /api/user/account — permanently deletes the signed-in user's account
 * (Google Play requires this in the app). Removed: the profile, sign-in,
 * messages, HeriTech Circle progress and booth claim. Kept without anything
 * that identifies the person: orders and impact passes, because each pass is
 * a public record of a real sale; shipping details are wiped from them. An
 * artisan's listings leave the shop and their reservations are released.
 */
export const DELETE = route(async (request: Request) => {
  const user = await requireUser(request);
  rateLimit(request, "delete-account", 3, 60_000, user.id);
  if (user.isDemo) throw forbidden("Demo accounts are shared and can't be deleted.");
  if (user.role === "admin") throw forbidden("Admin accounts can't delete themselves. Ask another admin to change your role first.");

  const [messages, orders, products, reserved] = await Promise.all([
    db.messages().where("participants", "array-contains", user.id).get(),
    db.orders().where("buyerId", "==", user.id).get(),
    db.products().where("artisanId", "==", user.id).get(),
    db.batches().where("reservedByArtisanId", "==", user.id).get(),
  ]);

  await inBatches(messages.docs, (batch, doc) => batch.delete(doc.ref));
  await inBatches(orders.docs, (batch, doc) => batch.update(doc.ref, { buyerId: DELETED_USER_ID, shippingAddress: null }));
  await inBatches(products.docs, (batch, doc) => batch.update(doc.ref, { archived: true, stock: 0 }));
  await inBatches(
    reserved.docs.filter((d) => d.data().status === "reserved"),
    (batch, doc) => batch.update(doc.ref, { status: "available", reservedByArtisanId: null, reservedAt: null })
  );
  await inBatches<DocumentReference>([db.loyalty().doc(user.id), db.boothClaims().doc(user.id), db.users().doc(user.id)], (batch, ref) =>
    batch.delete(ref)
  );

  try {
    await adminAuth().deleteUser(user.id);
  } catch (error) {
    // Already gone from Firebase Auth is fine; anything else is worth knowing about.
    if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
  }

  return ok({ deleted: true }, { message: "Your account has been deleted." });
});

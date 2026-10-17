import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { verifyHandoverToken } from "@/lib/server/handoverToken";
import { conflict, notFound, ok, parseBody, route } from "@/lib/server/http";

const schema = z.object({ token: z.string().trim().min(10).max(1000) });

/**
 * POST /api/handover/verify — an LGU officer submits the artisan's QR code.
 * Custody moves from "reserved" to "claimed" only if the code is genuine,
 * unexpired, and issued to the artisan who holds the reservation.
 */
export const POST = route(async (request: Request) => {
  const officer = await requireUser(request, ["lgu"]);
  const { token } = await parseBody(request, schema);
  const { batchId, artisanId } = verifyHandoverToken(token);
  const ref = db.batches().doc(batchId);

  const artisan = await adminDb().runTransaction(async (tx) => {
    const [batchSnap, artisanSnap] = await Promise.all([tx.get(ref), tx.get(db.users().doc(artisanId))]);
    const batch = batchSnap.data();
    const artisan = artisanSnap.data();
    if (!batch) throw notFound("Material batch not found.");
    if (batch.status !== "reserved") throw conflict(`Batch ${batchId} is ${batch.status}, not awaiting pickup.`);
    if (batch.reservedByArtisanId !== artisanId) throw conflict("This code belongs to an artisan who no longer holds the reservation.");
    if (!artisan || artisan.role !== "artisan") throw conflict("The artisan's account is no longer verified.");

    tx.update(ref, {
      status: "claimed",
      claimedByArtisanId: artisanId,
      claimedAt: FieldValue.serverTimestamp(),
      claimVerifiedById: officer.id,
    });
    return artisan;
  });

  return ok(
    {
      batchId,
      status: "claimed",
      artisan: { id: artisan.id, name: artisan.fullName, workshop: artisan.workshopName },
      verifiedAt: new Date().toISOString(),
      officerId: officer.id,
    },
    { message: `Custody of batch ${batchId} passed to ${artisan.fullName}${artisan.workshopName ? ` (${artisan.workshopName})` : ""}.` }
  );
});

import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { conflict, forbidden, notFound, ok, route } from "@/lib/server/http";
import { addSystemMessage } from "@/lib/server/messages";
import { withBatchRelations } from "@/lib/server/views";

/**
 * POST /api/materials/:id/release — puts a reserved batch back on the map.
 * The artisan holding the reservation can cancel it, and an admin can release
 * any reservation. The logging officer is told the pickup is off.
 */
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request, ["artisan"]);
  const { id } = await params;
  const ref = db.batches().doc(id);

  await adminDb().runTransaction(async (tx) => {
    const batch = (await tx.get(ref)).data();
    if (!batch) throw notFound("Material batch not found.");
    if (batch.status !== "reserved") throw conflict(`Batch ${id} is ${batch.status}, not reserved.`);
    const holder = batch.reservedByArtisanId;
    if (holder !== user.id && user.role !== "admin") throw forbidden("Only the artisan holding this reservation can cancel it.");

    tx.update(ref, { status: "available", reservedByArtisanId: null, reservedAt: null });

    if (holder && holder !== user.id) {
      addSystemMessage(tx, {
        senderId: user.id,
        receiverId: holder,
        content: `An admin released your reservation on batch ${id}, so it is back on the material map. Reserve it again if you still need it.`,
        contextType: "batch_reservation",
        contextId: id,
      });
    }
    if (batch.scannedByOfficerId && batch.scannedByOfficerId !== user.id) {
      addSystemMessage(tx, {
        senderId: user.id,
        receiverId: batch.scannedByOfficerId,
        content:
          holder === user.id
            ? `${user.fullName} cancelled the reservation on batch ${id}. It is available on the material map again.`
            : `An admin released the reservation on batch ${id}. It is available on the material map again.`,
        contextType: "batch_reservation",
        contextId: id,
      });
    }
  });

  const [view] = await withBatchRelations([(await ref.get()).data()!]);
  return ok(view, { message: `Batch ${id} is available again.` });
});

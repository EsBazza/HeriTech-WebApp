import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { conflict, notFound, ok, route } from "@/lib/server/http";
import { addSystemMessage } from "@/lib/server/messages";
import { withBatchRelations } from "@/lib/server/views";

/**
 * POST /api/materials/:id/reserve — an artisan reserves an available batch.
 * The logging officer gets a system message to arrange the QR handover.
 */
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const artisan = await requireUser(request, ["artisan"]);
  const { id } = await params;
  const ref = db.batches().doc(id);

  await adminDb().runTransaction(async (tx) => {
    const batch = (await tx.get(ref)).data();
    if (!batch) throw notFound("Material batch not found.");
    if (batch.status !== "available") throw conflict(`Batch ${id} is already ${batch.status}.`);

    tx.update(ref, { status: "reserved", reservedByArtisanId: artisan.id, reservedAt: FieldValue.serverTimestamp() });

    if (batch.scannedByOfficerId) {
      addSystemMessage(tx, {
        senderId: artisan.id,
        receiverId: batch.scannedByOfficerId,
        content: `${artisan.fullName}${artisan.workshopName ? ` (${artisan.workshopName})` : ""} reserved batch ${id}: ${batch.weightKg} kg of ${batch.materialType}. Please arrange a pickup time for the QR handover.`,
        contextType: "batch_reservation",
        contextId: id,
      });
    }
  });

  const [view] = await withBatchRelations([(await ref.get()).data()!]);
  return ok(view, { message: `Batch ${id} is reserved for you. Open the handover to show your QR code at pickup.` });
});

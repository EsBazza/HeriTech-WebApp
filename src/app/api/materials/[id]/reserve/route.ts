import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { conflict, forbidden, notFound, ok, route } from "@/lib/server/http";
import { addSystemMessage } from "@/lib/server/messages";
import { isReservationExpired, withExpiry } from "@/lib/server/reservations";
import { withBatchRelations } from "@/lib/server/views";

/**
 * POST /api/materials/:id/reserve — an artisan reserves an available batch.
 * The logging officer gets a system message to arrange the QR handover.
 * Only artisans reserve: the pickup has to be completed by an artisan, so an
 * admin reservation could never be handed over.
 */
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const artisan = await requireUser(request, ["artisan"]);
  if (artisan.role !== "artisan") throw forbidden("Only artisans can reserve batches. Admins can release a reservation instead.");
  const { id } = await params;
  const ref = db.batches().doc(id);

  await adminDb().runTransaction(async (tx) => {
    const batch = (await tx.get(ref)).data();
    if (!batch) throw notFound("Material batch not found.");
    const free = batch.status === "available" || isReservationExpired(batch);
    if (!free) throw conflict(`Batch ${id} is already ${batch.status}.`);

    tx.update(ref, { status: "reserved", reservedByArtisanId: artisan.id, reservedAt: FieldValue.serverTimestamp() });

    if (batch.scannedByOfficerId) {
      addSystemMessage(tx, {
        senderId: artisan.id,
        receiverId: batch.scannedByOfficerId,
        content: `${artisan.fullName}${artisan.workshopName ? ` (${artisan.workshopName})` : ""} reserved batch ${id}: ${batch.weightKg} kg of ${batch.materialType}. Please arrange a pickup time for the QR handover within 48 hours.`,
        contextType: "batch_reservation",
        contextId: id,
      });
    }
  });

  const [view] = await withBatchRelations([withExpiry((await ref.get()).data()!)]);
  return ok(view, { message: `Batch ${id} is reserved for you for 48 hours. Open the handover to show your QR code at pickup.` });
});

import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { createHandoverToken } from "@/lib/server/handoverToken";
import { conflict, fields, forbidden, notFound, ok, parseBody, route } from "@/lib/server/http";

const schema = z.object({ batchId: fields.id });

/** POST /api/handover/token — the reserving artisan gets a signed QR code for pickup. */
export const POST = route(async (request: Request) => {
  const artisan = await requireUser(request, ["artisan"]);
  const { batchId } = await parseBody(request, schema);

  const batch = (await db.batches().doc(batchId).get()).data();
  if (!batch) throw notFound("Material batch not found.");
  if (batch.status !== "reserved") throw conflict(`Batch ${batchId} is ${batch.status}, not awaiting pickup.`);
  if (batch.reservedByArtisanId !== artisan.id) throw forbidden("This batch is reserved by another artisan.");

  return ok({ batchId, ...createHandoverToken(batchId, artisan.id) });
});

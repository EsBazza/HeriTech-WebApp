import { z } from "zod";
import { FieldValue, type Query } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { MaterialBatchDoc } from "@/lib/firebase/types";
import { generateHarvestTxHash } from "@/lib/crypto";
import { getCurrentUser, requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { badRequest, fields, ok, parseBody, route, unauthorized } from "@/lib/server/http";
import { nextSequence } from "@/lib/server/ids";
import { storeImage } from "@/lib/server/images";
import { newestFirst, withBatchRelations } from "@/lib/server/views";

const STATUSES = ["available", "reserved", "claimed"] as const;

/**
 * GET /api/materials?status=&materialType=&mine=scanned|claimed|reserved
 * Batches with their agreement and people attached, newest first.
 * `mine` limits the list to the signed-in user's own batches.
 */
export const GET = route(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  let query: Query<MaterialBatchDoc> = db.batches();

  const status = params.get("status");
  if (status && (STATUSES as readonly string[]).includes(status)) query = query.where("status", "==", status);
  const materialType = params.get("materialType");
  if (materialType) query = query.where("materialType", "==", materialType);

  const mine = params.get("mine");
  if (mine) {
    const user = await getCurrentUser(request);
    if (!user) throw unauthorized();
    const field = { scanned: "scannedByOfficerId", claimed: "claimedByArtisanId", reserved: "reservedByArtisanId" }[mine];
    if (!field) throw badRequest("mine must be scanned, claimed or reserved.");
    query = query.where(field, "==", user.id);
  }

  const batches = (await query.get()).docs.map((d) => d.data()).sort(newestFirst);
  return ok(await withBatchRelations(batches));
});

const schema = z.object({
  title: fields.text(200),
  materialType: fields.text(200),
  weightKg: fields.kg,
  condition: fields.text(300),
  gpsLat: z.coerce.number().min(-90).max(90),
  gpsLng: z.coerce.number().min(-180).max(180),
  pickupAddress: fields.optionalText(200),
  weightSource: z.enum(["scale", "ai_estimate"]).default("scale"),
  imageUrl: z.string().min(1).max(8_000_000),
  agreementId: fields.id,
  aiInferredMaterial: fields.optionalText(2000),
  aiInferredCondition: fields.optionalText(300),
  aiConfidence: z.coerce.number().min(0).max(1).optional(),
  alsoContains: z.array(fields.text(60)).max(2).default([]),
});

/** POST /api/materials — an LGU officer logs a new batch against an active agreement. */
export const POST = route(async (request: Request) => {
  const officer = await requireUser(request, ["lgu"]);
  const input = await parseBody(request, schema);
  const imageUrl = await storeImage(input.imageUrl, "batches");

  const batch = await adminDb().runTransaction(async (tx) => {
    const agreementRef = db.agreements().doc(input.agreementId);
    const agreement = (await tx.get(agreementRef)).data();
    if (!agreement) throw badRequest("That release agreement does not exist.");
    if (agreement.status !== "active") throw badRequest("That release agreement is closed.");

    const year = new Date().getFullYear();
    // Seeded batches use 0101–0999, so live batches start at 1001.
    const seq = await nextSequence(tx, `batches-${year}`, 1001);
    const id = `HT-${year}-${String(seq).padStart(4, "0")}`;
    const createdAt = new Date().toISOString();

    const doc: MaterialBatchDoc = {
      id,
      title: input.title,
      materialType: input.materialType,
      weightKg: input.weightKg,
      condition: input.condition,
      status: "available",
      gpsLat: input.gpsLat,
      gpsLng: input.gpsLng,
      pickupAddress: input.pickupAddress,
      weightSource: input.weightSource,
      imageUrl,
      agreementId: agreement.id,
      scannedByOfficerId: officer.id,
      reservedByArtisanId: null,
      claimedByArtisanId: null,
      txHash: generateHarvestTxHash({
        batchId: id,
        gpsLat: input.gpsLat,
        gpsLng: input.gpsLng,
        weightKg: input.weightKg,
        officerId: officer.id,
        timestamp: createdAt,
      }),
      aiInferredMaterial: input.aiInferredMaterial,
      aiInferredCondition: input.aiInferredCondition,
      aiConfidence: input.aiConfidence ?? null,
      alsoContains: input.alsoContains,
      createdAt,
    };

    tx.create(db.batches().doc(id), doc);
    tx.update(agreementRef, { collectedKg: FieldValue.increment(input.weightKg) });
    return doc;
  });

  const [view] = await withBatchRelations([batch]);
  return ok(view, { status: 201 });
});

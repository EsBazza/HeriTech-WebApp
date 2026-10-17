import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import type { AgreementDoc } from "@/lib/firebase/types";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { fields, ok, parseBody, route } from "@/lib/server/http";
import { nextSequence } from "@/lib/server/ids";

/** GET /api/agreements — release agreements with the batches logged against each. */
export const GET = route(async (request: Request) => {
  await requireUser(request, ["lgu"]);

  const [agreementSnap, batchSnap] = await Promise.all([
    db.agreements().orderBy("signedAt", "desc").get(),
    db.batches().select("agreementId", "title", "weightKg", "status", "createdAt").get(),
  ]);

  const batchesByAgreement = new Map<string, unknown[]>();
  for (const doc of batchSnap.docs) {
    const batch = { id: doc.id, ...(doc.data() as object) } as { agreementId?: string };
    if (!batch.agreementId) continue;
    batchesByAgreement.set(batch.agreementId, [...(batchesByAgreement.get(batch.agreementId) ?? []), batch]);
  }

  return ok(agreementSnap.docs.map((d) => ({ ...d.data(), batches: batchesByAgreement.get(d.id) ?? [] })));
});

const schema = z.object({
  title: fields.text(200),
  organizerName: fields.text(200),
  festival: fields.text(120),
  country: fields.text(80),
  allocatedKg: fields.kg,
});

/** POST /api/agreements — record a new municipal material release agreement. */
export const POST = route(async (request: Request) => {
  const user = await requireUser(request, ["lgu"]);
  const input = await parseBody(request, schema);

  const agreement = await adminDb().runTransaction(async (tx) => {
    const year = new Date().getFullYear();
    const seq = await nextSequence(tx, `agreements-${year}`, 1);
    const doc: AgreementDoc = {
      ...input,
      id: `RA-${year}-${String(seq).padStart(3, "0")}`,
      collectedKg: 0,
      status: "active",
      signedAt: new Date().toISOString(),
      createdById: user.id,
    };
    tx.create(db.agreements().doc(doc.id), doc);
    return doc;
  });

  return ok({ ...agreement, batches: [] }, { status: 201 });
});

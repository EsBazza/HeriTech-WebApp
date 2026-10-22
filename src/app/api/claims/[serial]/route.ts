import { adminDb } from "@/lib/firebase/admin";
import type { BoothClaimDoc } from "@/lib/firebase/types";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { conflict, notFound, ok, route } from "@/lib/server/http";
import { isPassSerial } from "@/lib/server/ids";

type Context = { params: Promise<{ serial: string }> };

export interface BoothClaimStatus {
  serial: string;
  productTitle: string | null;
  claimedAt: string;
  tokenGivenAt: string | null;
  tokenGivenBy: string | null;
}

async function findClaim(serial: string): Promise<BoothClaimDoc> {
  if (!isPassSerial(serial)) throw notFound("No booth claim for that pass.");
  const snap = await db.boothClaims().where("serial", "==", serial.toUpperCase()).limit(1).get();
  const claim = snap.docs[0]?.data();
  if (!claim) throw notFound("This pass wasn't claimed at the booth.");
  return claim;
}

async function toStatus(claim: BoothClaimDoc): Promise<BoothClaimStatus> {
  const [product, staff] = await Promise.all([
    db.products().doc(claim.productId).get(),
    claim.tokenGivenBy ? db.users().doc(claim.tokenGivenBy).get() : null,
  ]);
  return {
    serial: claim.serial,
    productTitle: product.data()?.title ?? null,
    claimedAt: claim.createdAt,
    tokenGivenAt: claim.tokenGivenAt,
    tokenGivenBy: staff?.data()?.fullName ?? null,
  };
}

/** GET /api/claims/:serial — booth staff (admins) check whether this pass's piece was handed over. */
export const GET = route(async (request: Request, { params }: Context) => {
  await requireUser(request, ["admin"]);
  const { serial } = await params;
  return ok(await toStatus(await findClaim(serial)));
});

/** POST /api/claims/:serial — booth staff record that the piece was handed over. Works once per pass. */
export const POST = route(async (request: Request, { params }: Context) => {
  const staff = await requireUser(request, ["admin"]);
  const { serial } = await params;
  const found = await findClaim(serial);

  const claim = await adminDb().runTransaction(async (tx) => {
    const ref = db.boothClaims().doc(found.id);
    const current = (await tx.get(ref)).data();
    if (!current) throw notFound("This pass wasn't claimed at the booth.");
    if (current.tokenGivenAt) throw conflict("This piece was already handed over.");
    const updates = { tokenGivenAt: new Date().toISOString(), tokenGivenBy: staff.id };
    tx.update(ref, updates);
    return { ...current, ...updates };
  });

  return ok(await toStatus(claim), { message: "Marked as handed over." });
});

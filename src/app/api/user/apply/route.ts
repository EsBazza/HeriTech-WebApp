import { z } from "zod";
import type { RoleApplication } from "@/lib/firebase/types";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { conflict, fields, ok, parseBody, route } from "@/lib/server/http";

const schema = z.object({
  type: z.enum(["artisan", "lgu"]),
  workshopName: fields.optionalText(160),
  craftTypology: fields.optionalText(160),
  stationName: fields.optionalText(160),
  country: fields.optionalText(80),
  bio: fields.optionalText(1000),
  notes: fields.optionalText(1000),
});

/** POST /api/user/apply — ask an admin to verify you as an artisan or LGU officer. */
export const POST = route(async (request: Request) => {
  const user = await requireUser(request);
  const input = await parseBody(request, schema);

  if (user.role === input.type) throw conflict(`You are already verified as ${input.type === "lgu" ? "an LGU officer" : "an artisan"}.`);
  if (user.verificationStatus === "pending_artisan" || user.verificationStatus === "pending_lgu") {
    throw conflict("You already have an application waiting for review.");
  }

  const application: RoleApplication = { ...input, appliedAt: new Date().toISOString() };
  const updates = {
    verificationStatus: input.type === "artisan" ? ("pending_artisan" as const) : ("pending_lgu" as const),
    application,
    ...(input.workshopName ? { workshopName: input.workshopName } : {}),
    ...(input.stationName ? { stationName: input.stationName } : {}),
    ...(input.country ? { country: input.country } : {}),
  };
  await db.users().doc(user.id).update(updates);

  return ok(
    { ...user, ...updates },
    { message: `Your ${input.type === "lgu" ? "LGU officer" : "artisan"} application was sent for admin review.` }
  );
});

import { z } from "zod";
import type { UserDoc } from "@/lib/firebase/types";
import { DEMO_MODE } from "@/lib/demo";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { badRequest, fields, forbidden, notFound, ok, parseBody, route } from "@/lib/server/http";

const REVIEWABLE = ["pending_artisan", "pending_lgu", "approved", "rejected"] as const;

/** GET /api/admin/applications?status= — role applications, newest first. */
export const GET = route(async (request: Request) => {
  await requireUser(request, ["admin"]);
  const status = new URL(request.url).searchParams.get("status");
  const statuses = status && (REVIEWABLE as readonly string[]).includes(status) ? [status] : [...REVIEWABLE];

  const snap = await db.users().where("verificationStatus", "in", statuses).get();
  const applicants = snap.docs.map((d) => ({ ...d.data(), applicationDetails: d.data().application }));
  applicants.sort((a, b) => (b.application?.appliedAt ?? b.createdAt).localeCompare(a.application?.appliedAt ?? a.createdAt));
  return ok(applicants);
});

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), userId: fields.id }),
  z.object({ action: z.literal("reject"), userId: fields.id }),
  z.object({ action: z.literal("change_role"), userId: fields.id, targetRole: z.enum(["buyer", "artisan", "lgu", "admin"]) }),
]);

/** POST /api/admin/applications — approve, reject, or directly change a user's role. */
export const POST = route(async (request: Request) => {
  const admin = await requireUser(request, ["admin"]);
  const input = await parseBody(request, schema);

  const ref = db.users().doc(input.userId);
  const target = (await ref.get()).data();
  if (!target) throw notFound("User not found.");

  let updates: Partial<UserDoc>;
  if (input.action === "change_role") {
    if (target.id === admin.id && input.targetRole !== "admin") {
      throw badRequest("You can't remove your own admin role. Ask another admin.");
    }
    // Anyone can sign in as the demo admin, so on the demo site only showcase accounts can be made admins.
    if (DEMO_MODE && input.targetRole === "admin" && !target.isDemo) {
      throw forbidden("On the demo site, real accounts can't be made admins.");
    }
    updates = {
      role: input.targetRole,
      artisanVerified: input.targetRole === "artisan",
      // A direct role change settles any open application.
      verificationStatus: input.targetRole === "buyer" ? "none" : "approved",
    };
  } else if (input.action === "approve") {
    if (target.verificationStatus !== "pending_artisan" && target.verificationStatus !== "pending_lgu") {
      throw badRequest("This user has no pending application.");
    }
    const role = target.verificationStatus === "pending_artisan" ? "artisan" : "lgu";
    updates = { role, artisanVerified: role === "artisan", verificationStatus: "approved" };
  } else {
    updates = { verificationStatus: "rejected" };
  }

  await ref.update(updates);
  const updated = { ...target, ...updates };
  const verb = input.action === "change_role" ? `is now ${updated.role}` : input.action === "approve" ? `was approved as ${updated.role}` : "was rejected";
  return ok(updated, { message: `${target.fullName} (${target.email}) ${verb}.` });
});

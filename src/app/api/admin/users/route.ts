import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { ok, route } from "@/lib/server/http";
import { newestFirst } from "@/lib/server/views";

/** GET /api/admin/users — every account, newest first, for role management. */
export const GET = route(async (request: Request) => {
  await requireUser(request, ["admin"]);
  const snap = await db.users().get();
  return ok(snap.docs.map((d) => d.data()).sort(newestFirst));
});

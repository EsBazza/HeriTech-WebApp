import { z } from "zod";
import { DEMO_ACCOUNTS, DEMO_MODE } from "@/lib/demo";
import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/server/firestore";
import { notFound, ok, parseBody, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";

const schema = z.object({ role: z.enum(["buyer", "artisan", "lgu", "admin"]) });

/**
 * POST /api/auth/demo — only when NEXT_PUBLIC_DEMO_MODE=true.
 * Returns a Firebase custom token for the seeded showcase account of a role.
 * The client signs in with it, so every later request is authenticated normally.
 */
export const POST = route(async (request: Request) => {
  if (!DEMO_MODE) throw notFound();
  rateLimit(request, "demo-login", 20, 60_000);

  const { role } = await parseBody(request, schema);
  const uid = DEMO_ACCOUNTS[role];
  const account = (await db.users().doc(uid).get()).data();
  if (!account?.isDemo) throw notFound("Demo accounts are not seeded. Run `npm run seed`.");

  const token = await adminAuth().createCustomToken(uid);
  return ok({ token });
});

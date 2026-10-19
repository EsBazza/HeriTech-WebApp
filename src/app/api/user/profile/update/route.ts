import { z } from "zod";
import type { UserDoc } from "@/lib/firebase/types";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { fields, ok, parseBody, route } from "@/lib/server/http";

// Role and verification fields are deliberately absent: only admins change those.
const schema = z.object({
  fullName: fields.text(120).optional(),
  avatarUrl: z.union([z.string().url().startsWith("https://").max(2048), z.literal("")]).optional(),
  country: fields.optionalText(80),
  workshopName: fields.optionalText(160),
  stationName: fields.optionalText(160),
  // An artisan's workshop pin for the 3D journey on product pages; null removes it.
  workshopLocation: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .nullable()
    .optional(),
  preferredLanguage: z.string().min(2).max(10).optional(),
});

/** POST /api/user/profile/update — edit your own profile details. */
export const POST = route(async (request: Request) => {
  const user = await requireUser(request);
  const input = await parseBody(request, schema);

  const updates: Partial<UserDoc> = {};
  if (input.fullName) updates.fullName = input.fullName;
  if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl || null;
  if (input.preferredLanguage) updates.preferredLanguage = input.preferredLanguage;
  if (input.country) updates.country = input.country;
  if (user.role === "artisan" && input.workshopName) updates.workshopName = input.workshopName;
  if (user.role === "artisan" && input.workshopLocation !== undefined) {
    updates.workshopLat = input.workshopLocation?.lat ?? null;
    updates.workshopLng = input.workshopLocation?.lng ?? null;
  }
  if (user.role === "lgu" && input.stationName) updates.stationName = input.stationName;

  if (Object.keys(updates).length) await db.users().doc(user.id).update(updates);
  return ok({ ...user, ...updates }, { message: "Profile updated." });
});

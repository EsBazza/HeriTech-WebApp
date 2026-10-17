import { z } from "zod";
import type { MessageDoc } from "@/lib/firebase/types";
import { requireUser, toPublicUser } from "@/lib/server/auth";
import { db, getMany } from "@/lib/server/firestore";
import { badRequest, fields, notFound, ok, parseBody, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";

async function withPeople(messages: MessageDoc[]) {
  const users = await getMany(db.users(), messages.flatMap((m) => m.participants));
  const person = (id: string) => {
    const user = users.get(id);
    return user ? toPublicUser(user) : null;
  };
  return messages.map((m) => ({ ...m, sender: person(m.senderId), receiver: person(m.receiverId) }));
}

/** GET /api/messages — the signed-in user's messages, oldest first. */
export const GET = route(async (request: Request) => {
  const user = await requireUser(request);
  const snap = await db.messages().where("participants", "array-contains", user.id).get();
  const messages = snap.docs.map((d) => d.data()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return ok(await withPeople(messages));
});

const schema = z.object({
  receiverId: fields.id,
  content: fields.text(2000),
  contextType: z.enum(["order", "batch_reservation", "general"]).default("general"),
  contextId: z.string().trim().max(128).optional(),
});

/** POST /api/messages — send a message as the signed-in user. */
export const POST = route(async (request: Request) => {
  const sender = await requireUser(request);
  rateLimit(request, "messages", 30, 60_000, sender.id);
  const input = await parseBody(request, schema);

  if (input.receiverId === sender.id) throw badRequest("You can't message yourself.");
  const receiver = await db.users().doc(input.receiverId).get();
  if (!receiver.exists) throw notFound("That person doesn't have a HeriTech account.");

  const ref = db.messages().doc();
  const message: MessageDoc = {
    id: ref.id,
    senderId: sender.id,
    receiverId: input.receiverId,
    participants: [sender.id, input.receiverId],
    content: input.content,
    contextType: input.contextType,
    contextId: input.contextId ?? null,
    isSystem: false,
    createdAt: new Date().toISOString(),
  };
  await ref.create(message);

  const [view] = await withPeople([message]);
  return ok(view, { status: 201 });
});

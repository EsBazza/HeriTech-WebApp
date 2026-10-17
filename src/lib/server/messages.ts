import "server-only";
import type { Transaction } from "firebase-admin/firestore";
import type { MessageContextType, MessageDoc } from "@/lib/firebase/types";
import { db } from "./firestore";

/** Queues a server-authored system message inside an existing transaction. */
export function addSystemMessage(
  tx: Transaction,
  message: { senderId: string; receiverId: string; content: string; contextType: MessageContextType; contextId: string }
) {
  const ref = db.messages().doc();
  const doc: MessageDoc = {
    ...message,
    id: ref.id,
    participants: [message.senderId, message.receiverId],
    isSystem: true,
    createdAt: new Date().toISOString(),
  };
  tx.create(ref, doc);
}

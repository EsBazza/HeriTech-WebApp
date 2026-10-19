import "server-only";
import {
  Timestamp,
  type CollectionReference,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type {
  AgreementDoc,
  LoyaltyDoc,
  MaterialBatchDoc,
  MessageDoc,
  OrderDoc,
  ProductDoc,
  UserDoc,
  WalletPassDoc,
} from "@/lib/firebase/types";

/** Records written before the Firestore rewrite stored lists as JSON text. */
function asList(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value ? [value] : [];
  }
}

/**
 * Stores the listed fields as Firestore Timestamps and returns them as ISO strings,
 * so the rest of the app only ever sees plain JSON-safe values.
 */
function converter<T extends { id: string }>(
  dateFields: readonly (keyof T & string)[],
  listFields: readonly (keyof T & string)[] = []
): FirestoreDataConverter<T> {
  return {
    toFirestore(model) {
      const { id: _id, ...data } = model as DocumentData;
      for (const field of dateFields) {
        const value = data[field];
        if (typeof value === "string") data[field] = Timestamp.fromDate(new Date(value));
      }
      return data;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot) {
      const data = snapshot.data();
      for (const field of dateFields) {
        const value = data[field];
        if (value instanceof Timestamp) data[field] = value.toDate().toISOString();
      }
      for (const field of listFields) data[field] = asList(data[field]);
      return { ...data, id: snapshot.id } as T;
    },
  };
}

function collection<T extends { id: string }>(
  name: string,
  dateFields: readonly (keyof T & string)[],
  listFields: readonly (keyof T & string)[] = []
) {
  return (): CollectionReference<T> => adminDb().collection(name).withConverter(converter<T>(dateFields, listFields));
}

export const db = {
  users: collection<UserDoc>("users", ["createdAt"]),
  agreements: collection<AgreementDoc>("agreements", ["signedAt"]),
  batches: collection<MaterialBatchDoc>("material_batches", ["createdAt", "reservedAt", "claimedAt"]),
  products: collection<ProductDoc>("products", ["createdAt"], ["images", "materialTags"]),
  orders: collection<OrderDoc>("orders", ["createdAt"]),
  passes: collection<WalletPassDoc>("wallet_passes", ["issuedAt"]),
  messages: collection<MessageDoc>("messages", ["createdAt"]),
  loyalty: collection<LoyaltyDoc>("loyalty", ["updatedAt"]),
  /** Untyped counters used to hand out sequential, human-readable ids. */
  counters: () => adminDb().collection("counters"),
};

/** Reads many documents by id in one round trip and returns them keyed by id. */
export async function getMany<T extends { id: string }>(
  ref: CollectionReference<T>,
  ids: Iterable<string | null | undefined>
): Promise<Map<string, T>> {
  const unique = [...new Set([...ids].filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();
  const snapshots = await adminDb().getAll(...unique.map((id) => ref.doc(id)));
  const found = new Map<string, T>();
  for (const snap of snapshots) {
    const data = snap.data() as T | undefined;
    if (data) found.set(snap.id, data);
  }
  return found;
}

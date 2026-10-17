import { adminDb } from "./admin";
import type { 
  UserDocument, 
  AgreementDocument, 
  MaterialBatchDocument, 
  ProductDocument, 
  OrderDocument, 
  WalletPassDocument, 
  MessageDocument 
} from "./types";

/**
 * Cloud Firestore Collection Names
 * Mapped directly from Prisma schema models:
 * - User -> "users"
 * - Agreement -> "agreements"
 * - MaterialBatch -> "material_batches"
 * - Product -> "products"
 * - Order -> "orders"
 * - WalletPass -> "wallet_passes"
 * - Message -> "messages"
 * - Translation -> "translations"
 * - TranslationStats -> "translation_stats"
 */
export const COLLECTIONS = {
  USERS: "users",
  AGREEMENTS: "agreements",
  MATERIAL_BATCHES: "material_batches",
  PRODUCTS: "products",
  ORDERS: "orders",
  WALLET_PASSES: "wallet_passes",
  MESSAGES: "messages",
  TRANSLATIONS: "translations",
  TRANSLATION_STATS: "translation_stats",
} as const;

/**
 * Check if Firebase Admin Firestore is active and ready
 */
export function isFirestoreReady(): boolean {
  return adminDb !== null;
}

// -------------------------------------------------------------
// USER SERVICES
// -------------------------------------------------------------
export async function getFirestoreUser(id: string): Promise<UserDocument | null> {
  if (!adminDb) return null;
  const doc = await adminDb.collection(COLLECTIONS.USERS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<UserDocument, "id">) };
}

export async function getFirestoreUserByEmail(email: string): Promise<UserDocument | null> {
  if (!adminDb) return null;
  const snapshot = await adminDb.collection(COLLECTIONS.USERS).where("email", "==", email).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<UserDocument, "id">) };
}

export async function saveFirestoreUser(user: Partial<UserDocument> & { id: string }): Promise<void> {
  if (!adminDb) return;
  await adminDb.collection(COLLECTIONS.USERS).doc(user.id).set(user, { merge: true });
}

// -------------------------------------------------------------
// PRODUCT SERVICES
// -------------------------------------------------------------
export async function getFirestoreProducts(options?: { artisanId?: string }): Promise<ProductDocument[]> {
  if (!adminDb) return [];
  let query: any = adminDb.collection(COLLECTIONS.PRODUCTS);
  if (options?.artisanId) {
    query = query.where("artisanId", "==", options.artisanId);
  }
  const snapshot = await query.get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as Omit<ProductDocument, "id">) }));
}

export async function getFirestoreProduct(id: string): Promise<ProductDocument | null> {
  if (!adminDb) return null;
  const doc = await adminDb.collection(COLLECTIONS.PRODUCTS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<ProductDocument, "id">) };
}

export async function createFirestoreProduct(product: Omit<ProductDocument, "id"> & { id?: string }): Promise<ProductDocument> {
  if (!adminDb) throw new Error("Firebase Admin DB not initialized");
  const docRef = product.id 
    ? adminDb.collection(COLLECTIONS.PRODUCTS).doc(product.id) 
    : adminDb.collection(COLLECTIONS.PRODUCTS).doc();
  const newProduct: ProductDocument = {
    ...product,
    id: docRef.id,
    createdAt: product.createdAt || new Date().toISOString()
  };
  await docRef.set(newProduct);
  return newProduct;
}

// -------------------------------------------------------------
// MATERIAL BATCH SERVICES
// -------------------------------------------------------------
export async function getFirestoreBatches(options?: { status?: string; materialType?: string }): Promise<MaterialBatchDocument[]> {
  if (!adminDb) return [];
  let query: any = adminDb.collection(COLLECTIONS.MATERIAL_BATCHES);
  if (options?.status) {
    query = query.where("status", "==", options.status);
  }
  if (options?.materialType) {
    query = query.where("materialType", "==", options.materialType);
  }
  const snapshot = await query.get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as Omit<MaterialBatchDocument, "id">) }));
}

export async function getFirestoreBatch(id: string): Promise<MaterialBatchDocument | null> {
  if (!adminDb) return null;
  const doc = await adminDb.collection(COLLECTIONS.MATERIAL_BATCHES).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<MaterialBatchDocument, "id">) };
}

export async function updateFirestoreBatch(id: string, data: Partial<MaterialBatchDocument>): Promise<void> {
  if (!adminDb) return;
  await adminDb.collection(COLLECTIONS.MATERIAL_BATCHES).doc(id).set(data, { merge: true });
}

// -------------------------------------------------------------
// ORDER SERVICES
// -------------------------------------------------------------
export async function getFirestoreOrders(options?: { buyerId?: string; status?: string }): Promise<OrderDocument[]> {
  if (!adminDb) return [];
  let query: any = adminDb.collection(COLLECTIONS.ORDERS);
  if (options?.buyerId) {
    query = query.where("buyerId", "==", options.buyerId);
  }
  if (options?.status) {
    query = query.where("status", "==", options.status);
  }
  const snapshot = await query.get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as Omit<OrderDocument, "id">) }));
}

export async function createFirestoreOrder(order: Omit<OrderDocument, "id"> & { id?: string }): Promise<OrderDocument> {
  if (!adminDb) throw new Error("Firebase Admin DB not initialized");
  const docRef = order.id 
    ? adminDb.collection(COLLECTIONS.ORDERS).doc(order.id) 
    : adminDb.collection(COLLECTIONS.ORDERS).doc();
  const newOrder: OrderDocument = {
    ...order,
    id: docRef.id,
    createdAt: order.createdAt || new Date().toISOString()
  };
  await docRef.set(newOrder);
  return newOrder;
}

// -------------------------------------------------------------
// AGREEMENT SERVICES
// -------------------------------------------------------------
export async function getFirestoreAgreements(): Promise<AgreementDocument[]> {
  if (!adminDb) return [];
  const snapshot = await adminDb.collection(COLLECTIONS.AGREEMENTS).get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as Omit<AgreementDocument, "id">) }));
}

// -------------------------------------------------------------
// WALLET PASS SERVICES
// -------------------------------------------------------------
export async function getFirestoreWalletPassBySerial(serial: string): Promise<WalletPassDocument | null> {
  if (!adminDb) return null;
  const snapshot = await adminDb.collection(COLLECTIONS.WALLET_PASSES).where("serial", "==", serial).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<WalletPassDocument, "id">) };
}

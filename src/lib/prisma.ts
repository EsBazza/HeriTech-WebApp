import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { adminDb } from "./firebase/admin";
import { 
  SEED_USERS, 
  SEED_AGREEMENTS, 
  SEED_MATERIAL_BATCHES, 
  SEED_PRODUCTS, 
  SEED_ORDERS, 
  SEED_WALLET_PASSES 
} from "./seedData";

// In-Memory Database Store for fallback if Firestore is not yet configured
const fallbackStore: Record<string, any[]> = {
  users: [...SEED_USERS],
  agreements: [...SEED_AGREEMENTS],
  materialBatches: [...SEED_MATERIAL_BATCHES],
  products: [...SEED_PRODUCTS],
  orders: [...SEED_ORDERS],
  walletPasses: [...SEED_WALLET_PASSES],
  messages: [],
  user: [...SEED_USERS],
  agreement: [...SEED_AGREEMENTS],
  materialBatch: [...SEED_MATERIAL_BATCHES],
  product: [...SEED_PRODUCTS],
  order: [...SEED_ORDERS],
  walletPass: [...SEED_WALLET_PASSES],
  message: [],
};

// Relation field -> store that holds the related records
const RELATION_STORE: Record<string, string> = {
  agreement: "agreement",
  artisan: "user",
  buyer: "user",
  claimedByArtisan: "user",
  reservedByArtisan: "user",
  scannedByOfficer: "user",
  sourceBatch: "materialBatch",
  product: "product",
  order: "order",
  walletPass: "walletPass",
  products: "product",
  orders: "order",
};

/**
 * Mimics Prisma's `include` / `select` for relations so API routes get the
 * same nested shape from the in-memory store as from a real database.
 * Forward relations resolve via `<field>Id`; reverse ones via `<model>Id`.
 */
function resolveInclude(item: any, include: any, modelKey: string, depth = 0): any {
  if (!item || !include || typeof include !== "object" || depth > 4) return item;
  const out = { ...item };
  for (const [field, spec] of Object.entries(include)) {
    if (!spec) continue;
    const storeKey = RELATION_STORE[field];
    if (!storeKey) continue;
    const store = fallbackStore[storeKey] || [];
    const nested = typeof spec === "object" ? (spec as any).include || (spec as any).select : undefined;
    const fk = item[`${field}Id`];
    let related: any;
    if (fk !== undefined) {
      related = store.find((r: any) => r.id === fk) || null;
    } else {
      const matches = store.filter((r: any) => r[`${modelKey}Id`] === item.id);
      related = field.endsWith("s") ? matches : matches[0] || null;
    }
    if (Array.isArray(related)) {
      out[field] = related.map((r: any) => resolveInclude(r, nested, storeKey, depth + 1));
    } else if (related) {
      out[field] = resolveInclude(related, nested, storeKey, depth + 1);
    } else if (out[field] === undefined) {
      out[field] = null;
    }
  }
  return out;
}

const COLLECTION_MAP: Record<string, string> = {
  user: "users",
  users: "users",
  agreement: "agreements",
  agreements: "agreements",
  materialBatch: "material_batches",
  materialBatches: "material_batches",
  product: "products",
  products: "products",
  order: "orders",
  orders: "orders",
  walletPass: "wallet_passes",
  walletPasses: "wallet_passes",
  message: "messages",
  messages: "messages",
  translation: "translations",
  translations: "translations",
  translationStats: "translation_stats",
  translation_stats: "translation_stats",
};

function createModelHandler(modelKey: string) {
  const collectionName = COLLECTION_MAP[modelKey] || modelKey;

  return new Proxy({}, {
    get(target, prop: string) {
      const storeList = fallbackStore[modelKey] || [];

      return async (options: any = {}) => {
        const withRelations = (r: any) => resolveInclude(r, options.include || options.select, modelKey);

        // 1. If adminDb is available, query Firestore directly
        if (adminDb) {
          try {
            const colRef = adminDb.collection(collectionName);

            // AGGREGATE
            if (prop === "aggregate") {
              const snapshot = await colRef.get();
              const items = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
              const sumObj: Record<string, number> = {};
              if (options._sum) {
                for (const field of Object.keys(options._sum)) {
                  sumObj[field] = items.reduce((acc: number, item: any) => acc + (Number(item[field]) || 0), 0);
                }
              }
              return { _sum: sumObj, _count: items.length, _avg: {}, _min: {}, _max: {} };
            }

            // FIND MANY
            if (prop === "findMany") {
              let query: any = colRef;
              if (options.where) {
                for (const [key, value] of Object.entries(options.where)) {
                  if (value !== undefined && value !== null && typeof value !== "object") {
                    query = query.where(key, "==", value);
                  }
                }
              }
              const snapshot = await query.get();
              if (snapshot.empty && storeList.length > 0) {
                // If firestore is empty, fall back to seed data
                let res = [...storeList];
                if (options.where) {
                  for (const [key, value] of Object.entries(options.where)) {
                    if (value !== undefined) res = res.filter((item: any) => item[key] === value);
                  }
                }
                return res;
              }
              return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            }

            // FIND UNIQUE / FIND FIRST
            if (prop === "findUnique" || prop === "findFirst") {
              if (options.where?.id) {
                const doc = await colRef.doc(options.where.id).get();
                if (doc.exists) {
                  return { id: doc.id, ...doc.data() };
                }
              } else if (options.where) {
                let query: any = colRef;
                for (const [key, value] of Object.entries(options.where)) {
                  if (value !== undefined && value !== null) {
                    query = query.where(key, "==", value);
                  }
                }
                const snapshot = await query.limit(1).get();
                if (!snapshot.empty) {
                  const doc = snapshot.docs[0];
                  return { id: doc.id, ...doc.data() };
                }
              }
              // Fallback
              if (options.where?.id) {
                return storeList.find((item: any) => item.id === options.where.id) || null;
              }
              if (options.where?.email) {
                return storeList.find((item: any) => item.email === options.where.email) || null;
              }
              if (options.where?.serial) {
                return storeList.find((item: any) => item.serial === options.where.serial) || null;
              }
              return null;
            }

            // COUNT
            if (prop === "count") {
              let query: any = colRef;
              if (options.where) {
                for (const [key, value] of Object.entries(options.where)) {
                  if (value !== undefined && value !== null) {
                    query = query.where(key, "==", value);
                  }
                }
              }
              const snapshot = await query.get();
              return snapshot.size || storeList.length;
            }

            // CREATE
            if (prop === "create") {
              const docId = options.data?.id || `id_${Date.now()}`;
              const newItem = {
                ...options.data,
                id: docId,
                createdAt: options.data?.createdAt || new Date().toISOString(),
              };
              await colRef.doc(docId).set(newItem);
              storeList.push(newItem);
              return newItem;
            }

            // UPDATE
            if (prop === "update") {
              const docId = options.where?.id;
              if (docId) {
                await colRef.doc(docId).set(options.data, { merge: true });
                const idx = storeList.findIndex((item: any) => item.id === docId);
                if (idx !== -1) {
                  storeList[idx] = { ...storeList[idx], ...options.data };
                  return storeList[idx];
                }
                return { id: docId, ...options.data };
              }
              return options.data || {};
            }

            // DELETE
            if (prop === "delete" || prop === "deleteMany") {
              if (options.where?.id) {
                await colRef.doc(options.where.id).delete();
              }
              return { count: 1 };
            }

          } catch (err) {
            console.warn(`[Firestore Bridge] Warning for collection ${collectionName}.${prop}:`, err);
            // On Firestore error, safely fall through to fallbackStore
          }
        }

        // 2. In-Memory fallback store
        if (prop === "aggregate") {
          const sumObj: Record<string, number> = {};
          if (options._sum) {
            for (const field of Object.keys(options._sum)) {
              sumObj[field] = storeList.reduce((acc: number, item: any) => acc + (Number(item[field]) || 0), 0);
            }
          }
          return { _sum: sumObj, _count: storeList.length, _avg: {}, _min: {}, _max: {} };
        }

        if (prop === "findMany") {
          let res = [...storeList];
          if (options.where) {
            if (options.where.role) res = res.filter((item: any) => item.role === options.where.role);
            if (options.where.artisanVerified !== undefined) res = res.filter((item: any) => item.artisanVerified === options.where.artisanVerified);
            if (options.where.artisanId) res = res.filter((item: any) => item.artisanId === options.where.artisanId);
            if (options.where.status) res = res.filter((item: any) => item.status === options.where.status);
            if (options.where.buyerId) res = res.filter((item: any) => item.buyerId === options.where.buyerId);
          }
          return res.map(withRelations);
        }

        if (prop === "findUnique" || prop === "findFirst") {
          if (options.where) {
            const w = options.where;
            const hit = w.id
              ? storeList.find((item: any) => item.id === w.id)
              : w.email
              ? storeList.find((item: any) => item.email === w.email)
              : w.serial
              ? storeList.find((item: any) => item.serial === w.serial)
              : w.orderId
              ? storeList.find((item: any) => item.orderId === w.orderId)
              : storeList[0];
            return hit ? withRelations(hit) : null;
          }
          return storeList[0] ? withRelations(storeList[0]) : null;
        }

        if (prop === "count") {
          let res = [...storeList];
          if (options.where) {
            if (options.where.role) res = res.filter((item: any) => item.role === options.where.role);
            if (options.where.artisanVerified !== undefined) res = res.filter((item: any) => item.artisanVerified === options.where.artisanVerified);
            if (options.where.status) res = res.filter((item: any) => item.status === options.where.status);
          }
          return res.length;
        }

        if (prop === "create") {
          const newItem = { id: options.data?.id || `id_${Date.now()}`, ...options.data, createdAt: new Date().toISOString() };
          storeList.push(newItem);
          return withRelations(newItem);
        }

        if (prop === "update") {
          const idx = storeList.findIndex((item: any) => item.id === options.where?.id);
          if (idx !== -1) {
            storeList[idx] = { ...storeList[idx], ...options.data };
            return withRelations(storeList[idx]);
          }
          return options.data || {};
        }

        if (prop === "delete" || prop === "deleteMany") {
          return { count: 1 };
        }

        return Array.isArray(storeList) ? storeList : [];
      };
    }
  });
}

export const prisma = (new Proxy({}, {
  get(target, prop: string) {
    if (prop === "$disconnect" || prop === "$connect") {
      return async () => {};
    }
    return createModelHandler(prop);
  }
}) as unknown) as PrismaClient;

export default prisma;

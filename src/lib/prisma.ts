import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { 
  SEED_USERS, 
  SEED_AGREEMENTS, 
  SEED_MATERIAL_BATCHES, 
  SEED_PRODUCTS, 
  SEED_ORDERS, 
  SEED_WALLET_PASSES 
} from "./seedData";

// In-Memory Database Store for transition to Firebase
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

function createModelHandler(modelKey: string) {
  return new Proxy({}, {
    get(target, prop: string) {
      const storeList = fallbackStore[modelKey] || [];

      return async (options: any = {}) => {
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
          return res;
        }

        if (prop === "findUnique" || prop === "findFirst") {
          if (options.where) {
            if (options.where.id) return storeList.find((item: any) => item.id === options.where.id) || null;
            if (options.where.email) return storeList.find((item: any) => item.email === options.where.email) || null;
            if (options.where.serial) return storeList.find((item: any) => item.serial === options.where.serial) || null;
            if (options.where.orderId) return storeList.find((item: any) => item.orderId === options.where.orderId) || null;
          }
          return storeList[0] || null;
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
          return newItem;
        }

        if (prop === "update") {
          const idx = storeList.findIndex((item: any) => item.id === options.where?.id);
          if (idx !== -1) {
            storeList[idx] = { ...storeList[idx], ...options.data };
            return storeList[idx];
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

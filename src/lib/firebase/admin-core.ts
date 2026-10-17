import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Firebase Admin is initialised on first use, not at import time, so `next build`
 * can load route modules without credentials. A missing or malformed key fails
 * loudly instead of silently falling back to demo data.
 */
function adminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!rawKey) {
    // Falls back to Application Default Credentials (e.g. `gcloud auth application-default login`).
    if (!projectId) {
      throw new Error("Firebase is not configured: set FIREBASE_SERVICE_ACCOUNT_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
    }
    return initializeApp({ projectId, storageBucket });
  }

  let serviceAccount: { project_id?: string; client_email?: string; private_key?: string };
  try {
    serviceAccount = JSON.parse(rawKey);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Paste the whole service account file as one line.");
  }

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
    projectId: serviceAccount.project_id ?? projectId,
    storageBucket,
  });
}

// Kept on globalThis because dev hot-reload re-runs this module while the Admin
// SDK keeps its Firestore instance, and settings() may only be called once.
const cache = globalThis as typeof globalThis & { __heritechFirestore?: Firestore };

export function adminDb(): Firestore {
  if (!cache.__heritechFirestore) {
    const firestore = getFirestore(adminApp());
    firestore.settings({ ignoreUndefinedProperties: true });
    cache.__heritechFirestore = firestore;
  }
  return cache.__heritechFirestore;
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

export function adminStorage(): Storage {
  return getStorage(adminApp());
}

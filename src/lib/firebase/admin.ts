import "dotenv/config";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App | undefined;

if (!getApps().length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "heritech-edutech";
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      const parsedKey = typeof serviceAccountKey === "string" ? JSON.parse(serviceAccountKey) : serviceAccountKey;
      app = initializeApp({
        credential: cert(parsedKey),
        projectId: parsedKey.project_id || projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      app = initializeApp({
        projectId: projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
} else {
  app = getApps()[0];
}

export const adminAuth: Auth | null = app ? getAuth(app) : null;
export const adminDb: Firestore | null = app ? getFirestore(app) : null;
export const adminStorage: Storage | null = app ? getStorage(app) : null;

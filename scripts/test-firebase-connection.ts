import * as dotenv from "dotenv";
dotenv.config();

import { adminAuth, adminDb } from "../src/lib/firebase/admin";

async function testConnection() {
  console.log("==========================================");
  console.log("🔍 Checking Firebase Environment Variables:");
  console.log("==========================================");

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", projectId ? `✅ Set (${projectId})` : "❌ Missing");
  console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", apiKey ? `✅ Set (${apiKey.substring(0, 6)}...)` : "❌ Missing");
  console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", authDomain ? `✅ Set (${authDomain})` : "❌ Missing");
  console.log("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", storageBucket ? `✅ Set (${storageBucket})` : "❌ Missing");
  console.log("FIREBASE_SERVICE_ACCOUNT_KEY:", serviceAccountKey ? "✅ Set" : "⚠️ Not set (Will use default ADC/project ID)");

  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      console.log("  ↳ Service Account Email:", parsed.client_email ? `✅ ${parsed.client_email}` : "❌ No client_email");
      console.log("  ↳ Service Account Private Key:", parsed.private_key ? "✅ Valid key format" : "❌ No private_key");
    } catch (e: any) {
      console.log("  ↳ ❌ Service Account JSON Parse Error:", e.message);
    }
  }

  console.log("\n==========================================");
  console.log("📡 Testing Live Firebase Connection:");
  console.log("==========================================");

  if (!adminDb) {
    console.log("❌ Firebase Admin DB failed to initialize. Check your credentials.");
    return;
  }

  try {
    console.log("Connecting to Firestore...");
    // Try to list collections or read 1 doc
    const collections = await adminDb.listCollections();
    console.log(`✅ Firestore Connected Successfully!`);
    console.log(`Collections found (${collections.length}):`, collections.map(c => c.id).join(", ") || "(No collections yet - database is empty)");

    if (adminAuth) {
      try {
        const userList = await adminAuth.listUsers(1);
        console.log(`✅ Firebase Auth Connected! Users in auth: ${userList.users.length > 0 ? "Found existing users" : "0 users found"}`);
      } catch (authErr: any) {
        console.log("⚠️ Firebase Auth check notice:", authErr.message);
      }
    }
    console.log("\n🎉 Full Firebase connection test PASSED!");
  } catch (error: any) {
    console.error("❌ Firestore connection failed:", error.message || error);
    if (error.code) {
      console.error("Error Code:", error.code);
    }
  }
}

testConnection();

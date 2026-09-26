import { adminDb } from "../src/lib/firebase/admin";
import { 
  SEED_USERS, 
  SEED_AGREEMENTS, 
  SEED_MATERIAL_BATCHES, 
  SEED_PRODUCTS, 
  SEED_ORDERS, 
  SEED_WALLET_PASSES 
} from "../src/lib/seedData";

async function seedFirebase() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID;

  if (!projectId && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error("⚠️ Firebase credentials missing in .env file.");
    console.error("Please add your NEXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_SERVICE_ACCOUNT_KEY in .env before running the seeder.");
    process.exit(0);
  }

  if (!adminDb) {
    console.error("❌ Firebase Admin DB is not initialized. Please check your .env configuration.");
    process.exit(0);
  }

  console.log("🌱 Seeding Firebase Firestore...");

  // 1. Users
  for (const user of SEED_USERS) {
    await adminDb.collection("users").doc(user.id).set(user, { merge: true });
  }
  console.log(`✅ Seeded ${SEED_USERS.length} Users into Firestore.`);

  // 2. Agreements
  for (const agreement of SEED_AGREEMENTS) {
    await adminDb.collection("agreements").doc(agreement.id).set(agreement, { merge: true });
  }
  console.log(`✅ Seeded ${SEED_AGREEMENTS.length} Agreements into Firestore.`);

  // 3. Material Batches
  for (const batch of SEED_MATERIAL_BATCHES) {
    await adminDb.collection("material_batches").doc(batch.id).set(batch, { merge: true });
  }
  console.log(`✅ Seeded ${SEED_MATERIAL_BATCHES.length} Material Batches into Firestore.`);

  // 4. Products
  for (const product of SEED_PRODUCTS) {
    await adminDb.collection("products").doc(product.id).set(product, { merge: true });
  }
  console.log(`✅ Seeded ${SEED_PRODUCTS.length} Products into Firestore.`);

  // 5. Orders
  for (const order of SEED_ORDERS) {
    await adminDb.collection("orders").doc(order.id).set(order, { merge: true });
  }
  console.log(`✅ Seeded ${SEED_ORDERS.length} Orders into Firestore.`);

  // 6. Wallet Passes
  for (const pass of SEED_WALLET_PASSES) {
    await adminDb.collection("wallet_passes").doc(pass.id).set(pass, { merge: true });
  }
  console.log(`✅ Seeded ${SEED_WALLET_PASSES.length} Wallet Passes into Firestore.`);

  console.log("🚀 Firebase Firestore Seeding Complete!");
}

seedFirebase().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

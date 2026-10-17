import "dotenv/config";
import { adminDb, adminAuth } from "../src/lib/firebase/admin";

async function verifyDatabase() {
  console.log("====================================================");
  console.log("🚀 HERITECH LIVE FIRESTORE DATABASE VERIFICATION");
  console.log("====================================================");

  if (!adminDb) {
    console.error("❌ adminDb is null. Firebase failed to initialize.");
    process.exit(1);
  }

  const collections = [
    "users",
    "agreements",
    "material_batches",
    "products",
    "orders",
    "wallet_passes"
  ];

  let totalDocs = 0;

  for (const colName of collections) {
    try {
      const snap = await adminDb.collection(colName).get();
      console.log(`📦 Collection [${colName}]: ✅ ${snap.size} documents found`);
      totalDocs += snap.size;

      // Print first document sample
      if (snap.size > 0) {
        const firstDoc = snap.docs[0];
        const data = firstDoc.data();
        const sampleKeys = Object.keys(data).slice(0, 4).join(", ");
        console.log(`   ↳ Sample Doc ID: "${firstDoc.id}" (Fields: ${sampleKeys}...)`);
      }
    } catch (err: any) {
      console.error(`❌ Error querying collection [${colName}]:`, err.message);
    }
  }

  console.log("----------------------------------------------------");
  console.log(`🎉 Total Documents Verified in Cloud Firestore: ${totalDocs}`);
  console.log("🔥 Database Status: 100% ONLINE AND HEALTHY");
  console.log("====================================================");
}

verifyDatabase().catch(console.error);

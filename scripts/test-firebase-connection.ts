/**
 * Read-only check that the Firebase credentials in .env work.
 *
 *   npm run check:firebase
 */
import { adminAuth, adminDb, adminStorage } from "../src/lib/firebase/admin-core";

async function main() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  console.log(`Project: ${projectId ?? "(NEXT_PUBLIC_FIREBASE_PROJECT_ID not set)"}`);
  console.log(`Service account key: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? "set" : "missing"}`);

  const collections = await adminDb().listCollections();
  console.log("Firestore: connected");
  for (const collection of collections) {
    const count = (await collection.count().get()).data().count;
    console.log(`  ${collection.id.padEnd(18)} ${count} docs`);
  }

  const { users } = await adminAuth().listUsers(1000);
  console.log(`Auth: connected, ${users.length} user(s)`);

  const [bucketExists] = await adminStorage().bucket().exists();
  console.log(`Storage bucket: ${bucketExists ? "ready" : "not created yet (images are stored inline)"}`);
}

main().catch((error) => {
  console.error("Firebase check failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

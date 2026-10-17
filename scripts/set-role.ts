/**
 * Grants a role to an existing account. Use it to create the first admin.
 * The person must have signed in once so their profile exists.
 *
 *   npm run set-role -- someone@example.com admin
 */
import { adminAuth, adminDb } from "../src/lib/firebase/admin-core";

const ROLES = ["buyer", "artisan", "lgu", "admin"] as const;
type Role = (typeof ROLES)[number];

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !ROLES.includes(role as Role)) {
    console.error(`Usage: npm run set-role -- <email> <${ROLES.join("|")}>`);
    process.exit(1);
  }

  const authUser = await adminAuth().getUserByEmail(email).catch(() => null);
  if (!authUser) throw new Error(`No Firebase Auth account for ${email}. Ask them to sign in once first.`);

  const ref = adminDb().collection("users").doc(authUser.uid);
  if (!(await ref.get()).exists) throw new Error(`${email} has signed in but has no profile yet. Ask them to reload the app.`);

  await ref.update({
    role,
    artisanVerified: role === "artisan",
    verificationStatus: role === "buyer" ? "none" : "approved",
  });
  console.log(`${email} (${authUser.uid}) is now ${role}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

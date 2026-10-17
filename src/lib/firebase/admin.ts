import "server-only";

// App code imports this module so Firebase Admin can never end up in a client bundle.
// Node scripts import ./admin-core directly, because "server-only" throws outside Next.js.
export { adminDb, adminAuth, adminStorage } from "./admin-core";

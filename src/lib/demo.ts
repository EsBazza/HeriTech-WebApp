import type { UserRole } from "@/lib/firebase/types";

/**
 * Demo mode adds one-click showcase accounts for presentations. It never relaxes
 * the server's checks: demo accounts sign in with real Firebase tokens and have
 * exactly the permissions of their role. Leave it off for the production deployment.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Seeded accounts (see src/lib/seedData.ts) used for each role in demo mode. */
export const DEMO_ACCOUNTS: Record<UserRole, string> = {
  buyer: "usr_buy_01",
  artisan: "usr_art_05",
  lgu: "usr_lgu_04",
  admin: "usr_admin_01",
};

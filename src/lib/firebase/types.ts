import type { LoyaltyState } from "@/lib/loyalty";

/**
 * Firestore document shapes, shared by the API routes and the client.
 * Relations are stored as ids only; API routes join the related documents
 * they need. Dates travel as ISO 8601 strings and are stored as Firestore
 * Timestamps (see src/lib/server/firestore.ts).
 */

export type UserRole = "buyer" | "artisan" | "lgu" | "admin";
export type VerificationStatus = "none" | "pending_artisan" | "pending_lgu" | "approved" | "rejected";
export type BatchStatus = "available" | "reserved" | "claimed";
export type AgreementStatus = "active" | "closed";
export type OrderStatus = "pending" | "completed" | "refunded";
export type MessageContextType = "order" | "batch_reservation" | "general";

export interface RoleApplication {
  type: "artisan" | "lgu";
  appliedAt: string;
  workshopName: string | null;
  craftTypology: string | null;
  stationName: string | null;
  country: string | null;
  bio: string | null;
  notes: string | null;
}

/** `users/{uid}`. The document id is the Firebase Auth uid. */
export interface UserDoc {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl: string | null;
  country: string | null;
  workshopName: string | null;
  /** Workshop position an artisan chose to show on their product pages. */
  workshopLat?: number | null;
  workshopLng?: number | null;
  stationName: string | null;
  artisanVerified: boolean;
  verificationStatus: VerificationStatus;
  application: RoleApplication | null;
  preferredLanguage: string;
  /** Seeded showcase account that can be signed into when DEMO_MODE is on. */
  isDemo?: boolean;
  createdAt: string;
}

/** `agreements/{id}`, e.g. "RA-2026-001". */
export interface AgreementDoc {
  id: string;
  title: string;
  organizerName: string;
  festival: string;
  country: string;
  allocatedKg: number;
  collectedKg: number;
  status: AgreementStatus;
  signedAt: string;
  createdById: string | null;
}

/** `material_batches/{id}`, e.g. "HT-2026-0101". */
export interface MaterialBatchDoc {
  id: string;
  title: string;
  materialType: string;
  weightKg: number;
  condition: string;
  status: BatchStatus;
  gpsLat: number;
  gpsLng: number;
  /** Readable place name for the pickup point, looked up from the GPS position. */
  pickupAddress?: string | null;
  /** "ai_estimate" when nobody weighed the batch and the officer kept Gemini's estimate. */
  weightSource?: "scale" | "ai_estimate";
  imageUrl: string;
  agreementId: string | null;
  scannedByOfficerId: string | null;
  reservedByArtisanId: string | null;
  claimedByArtisanId: string | null;
  /** SHA-256 over batch id, GPS, weight, officer and timestamp. */
  txHash: string;
  aiInferredMaterial: string | null;
  aiInferredCondition: string | null;
  aiConfidence: number | null;
  createdAt: string;
  reservedAt?: string | null;
  claimedAt?: string | null;
  /** LGU officer who checked the artisan's handover code. */
  claimVerifiedById?: string | null;
}

/** `products/{id}`. */
export interface ProductDoc {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  artisanId: string;
  sourceBatchId: string;
  materialTags: string[];
  stock: number;
  kgDiverted: number;
  /** Charity partner that receives part of the charity & maintenance share. */
  ngoFundName: string;
  /** Removed listings stay stored so existing impact passes keep resolving. */
  archived?: boolean;
  createdAt: string;
}

export interface ShippingAddress {
  fullName: string;
  streetAddress: string;
  city: string;
  country: string;
  postalCode: string;
}

/** `orders/{id}`. One order per product line in a checkout. */
export interface OrderDoc {
  id: string;
  productId: string;
  artisanId: string;
  buyerId: string;
  sourceBatchId: string;
  quantity: number;
  unitPrice: number;
  amountPaid: number;
  artisanPayout: number;
  lguShare: number;
  charityMaintenanceShare: number;
  /** Loyalty discount taken off the list price, paid for from the charity & maintenance share. */
  discount?: number;
  loyaltyRewardApplied?: boolean;
  /** No payment provider is connected yet; every order is a simulated payment. */
  paymentMode: "simulated";
  shippingAddress: ShippingAddress | null;
  status: OrderStatus;
  createdAt: string;
}

/** `loyalty/{uid}`. HeriTech Circle progress; the rules live in src/lib/loyalty.ts. */
export interface LoyaltyDoc extends LoyaltyState {
  id: string;
  updatedAt: string;
}

/** `wallet_passes/{serial}`. The public impact record for one order. */
export interface WalletPassDoc {
  id: string;
  orderId: string;
  serial: string;
  qrPayload: string;
  harvestHash: string;
  issuedAt: string;
}

/** `messages/{id}`. */
export interface MessageDoc {
  id: string;
  senderId: string;
  receiverId: string;
  /** [senderId, receiverId], so a user's messages are one array-contains query. */
  participants: string[];
  content: string;
  contextType: MessageContextType;
  contextId: string | null;
  /** Written by the server for order and reservation events, never by clients. */
  isSystem: boolean;
  createdAt: string;
}

/** The public subset of a user that other users may see. */
export type PublicUser = Pick<
  UserDoc,
  "id" | "fullName" | "role" | "avatarUrl" | "country" | "workshopName" | "workshopLat" | "workshopLng" | "stationName" | "artisanVerified"
>;

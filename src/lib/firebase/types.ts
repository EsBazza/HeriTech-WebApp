/**
 * HeriTech Firestore Type Definitions
 * Directly translated and adapted from prisma/schema.prisma for Cloud Firestore.
 */

export type UserRole = "buyer" | "artisan" | "lgu" | "admin";
export type VerificationStatus = "none" | "pending_artisan" | "pending_lgu" | "approved" | "rejected";
export type MaterialCondition = "Excellent" | "Good" | "Fair";
export type BatchStatus = "available" | "reserved" | "claimed";
export type AgreementStatus = "active" | "closed";
export type OrderStatus = "pending" | "completed" | "refunded";
export type MessageContextType = "order" | "batch_reservation" | "general";

/**
 * Collection: `users`
 * Represents all user accounts (buyers, artisans, LGU officials, and admins).
 * Document ID: Matches Firebase Auth UID (or custom user ID like 'usr_xxx').
 */
export interface UserDocument {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string | null;
  country?: string | null;
  workshopName?: string | null; // Artisan only
  artisanVerified?: boolean;
  stationName?: string | null; // LGU only
  stripeAccountId?: string | null;
  verificationStatus: VerificationStatus;
  applicationNotes?: string | null; // JSON formatted details submitted during application
  preferredLanguage?: string;
  createdAt: string; // ISO 8601 string or Timestamp
}

/**
 * Collection: `agreements`
 * Represents festival waste reclamation agreements signed by organizers and LGUs.
 * Document ID: e.g. "RA-2026-001"
 */
export interface AgreementDocument {
  id: string;
  title: string;
  organizerName: string;
  festival: string;
  country: string;
  allocatedKg: number;
  collectedKg: number;
  status: AgreementStatus;
  signedAt: string;
}

/**
 * Collection: `material_batches`
 * Logged batches of reclaimed materials from festivals/LGUs.
 * Document ID: e.g. "HT-2026-0101"
 */
export interface MaterialBatchDocument {
  id: string;
  title: string;
  materialType: string;
  weightKg: number;
  condition: MaterialCondition | string;
  status: BatchStatus;
  gpsLat: number;
  gpsLng: number;
  imageUrl: string;
  agreementId?: string | null;
  scannedByOfficerId?: string | null;
  reservedByArtisanId?: string | null;
  claimedByArtisanId?: string | null;
  txHash: string; // SHA-256 telemetry hash
  aiInferredMaterial?: string | null;
  aiInferredCondition?: string | null;
  aiConfidence?: number | null;
  createdAt: string;

  // Optional embedded / joined relations for convenient client rendering
  agreement?: AgreementDocument | null;
  scannedByOfficer?: Pick<UserDocument, "id" | "fullName" | "stationName" | "country"> | null;
  reservedByArtisan?: Pick<UserDocument, "id" | "fullName" | "workshopName" | "country"> | null;
  claimedByArtisan?: Pick<UserDocument, "id" | "fullName" | "workshopName" | "country"> | null;
}

/**
 * Collection: `products`
 * Marketplace products upcycled by artisans from reclaimed material batches.
 * Document ID: Auto-generated string
 */
export interface ProductDocument {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[] | string; // Can be native array in Firestore or JSON string
  artisanId: string;
  sourceBatchId: string;
  materialTags: string[] | string; // Can be native array in Firestore or JSON string
  stock: number;
  kgDiverted: number;
  ngoFundName: string;
  createdAt: string;

  // Optional embedded / joined relations
  artisan?: Pick<UserDocument, "id" | "fullName" | "workshopName" | "country" | "avatarUrl"> | null;
  sourceBatch?: MaterialBatchDocument | null;
}

/**
 * Collection: `orders`
 * Orders placed by buyers for artisan upcycled goods.
 * Document ID: Auto-generated string
 */
export interface OrderDocument {
  id: string;
  productId: string;
  buyerId: string;
  amountPaid: number;
  artisanPayout: number; // 70% Escrow Split
  platformFee: number; // 20% LGU & Platform Escrow Split
  ngoContribution: number; // 10% NGO Trust Fund Escrow Split
  stripePaymentIntentId?: string | null;
  shippingAddress?: string | null; // JSON formatted shipping details
  status: OrderStatus;
  createdAt: string;

  // Optional embedded / joined relations
  product?: ProductDocument | null;
  buyer?: Pick<UserDocument, "id" | "fullName" | "email"> | null;
  walletPass?: WalletPassDocument | null;
}

/**
 * Collection: `wallet_passes`
 * Digital certificates / wallet passes for provenance and ownership verification.
 * Document ID: Auto-generated string
 */
export interface WalletPassDocument {
  id: string;
  orderId: string;
  serial: string; // e.g. "HT-492-AX"
  googleWalletObjectId?: string | null;
  qrPayload: string;
  harvestHash?: string | null;
  issuedAt: string;

  // Optional joined relation
  order?: OrderDocument | null;
}

/**
 * Collection: `messages`
 * In-app messaging between users (e.g. buyers, artisans, LGUs).
 * Document ID: Auto-generated string
 */
export interface MessageDocument {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  contextType?: MessageContextType | null;
  contextId?: string | null;
  isSystem?: boolean;
  createdAt: string;

  // Optional joined relations
  sender?: Pick<UserDocument, "id" | "fullName" | "avatarUrl"> | null;
  receiver?: Pick<UserDocument, "id" | "fullName" | "avatarUrl"> | null;
}

/**
 * Collection: `translations`
 * Caches automated translations.
 */
export interface TranslationDocument {
  id: string;
  sourceText: string;
  targetLanguage: string;
  translatedText: string;
  sourceLanguage: string;
  contextHash?: string | null;
  quality?: number | null;
  verified?: boolean;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Collection: `translation_stats`
 * Aggregate statistics for translation usage.
 */
export interface TranslationStatsDocument {
  id: string;
  languageCode: string;
  totalRequests: number;
  cacheHits: number;
  averageLatency: number;
  errorCount: number;
  lastRequestAt: string;
  createdAt: string;
  updatedAt: string;
}

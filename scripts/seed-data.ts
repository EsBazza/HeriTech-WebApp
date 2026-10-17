/**
 * Fictional showcase data for the DEMO project only (see seed-firebase.ts).
 * Everything here is invented and deliberately generic: no real people,
 * organisations, festivals or charities, materials named by broad category,
 * and labelled placeholder images served from /public/demo instead of stock photos.
 *
 * Ids the app and tests rely on: usr_buy_01, usr_art_05, usr_lgu_04 and
 * usr_admin_01 (demo sign-in), RA-2026-001…005, prod_01 and pass HT-D3M0-0001.
 */

const MATERIAL = {
  paper: { type: "Paper and card", image: "/demo/paper.svg" },
  flowers: { type: "Flowers and plant matter", image: "/demo/flowers.svg" },
  fabric: { type: "Fabric and textile", image: "/demo/fabric.svg" },
  plastics: { type: "Mixed plastics", image: "/demo/plastics.svg" },
  wood: { type: "Wood and frame offcuts", image: "/demo/wood.svg" },
} as const;

const user = (
  id: string,
  role: "buyer" | "artisan" | "lgu" | "admin",
  fullName: string,
  extra: { workshopName?: string; stationName?: string } = {}
) => ({
  id,
  email: `${id.replace(/_/g, ".")}@example.com`,
  role,
  fullName,
  country: "Philippines",
  avatarUrl: null,
  artisanVerified: role === "artisan",
  verificationStatus: role === "buyer" ? "none" : "approved",
  preferredLanguage: "en",
  createdAt: "2026-07-01T08:00:00.000Z",
  ...extra,
});

export const SEED_USERS = [
  user("usr_lgu_04", "lgu", "Demo Officer A", { stationName: "Demo City Environment Office" }),
  user("usr_lgu_01", "lgu", "Demo Officer B", { stationName: "Demo Town Environment Office" }),
  user("usr_art_05", "artisan", "Demo Artisan A", { workshopName: "Demo Workshop A" }),
  user("usr_art_01", "artisan", "Demo Artisan B", { workshopName: "Demo Workshop B" }),
  user("usr_art_02", "artisan", "Demo Artisan C", { workshopName: "Demo Workshop C" }),
  user("usr_buy_01", "buyer", "Demo Buyer A"),
  user("usr_buy_02", "buyer", "Demo Buyer B"),
  user("usr_admin_01", "admin", "Demo Administrator"),
];

const agreement = (n: number, festival: string, allocatedKg: number, collectedKg: number, signedAt: string) => ({
  id: `RA-2026-00${n}`,
  title: `Material release agreement: ${festival}`,
  organizerName: "Demo Festival Committee",
  festival,
  country: "Philippines",
  allocatedKg,
  collectedKg,
  status: "active",
  signedAt,
});

// collectedKg matches the batches logged against each agreement below.
export const SEED_AGREEMENTS = [
  agreement(1, "Demo Lantern Festival", 300, 18.5, "2026-07-15T09:00:00.000Z"),
  agreement(2, "Demo Flower Festival", 400, 32, "2026-07-20T09:00:00.000Z"),
  agreement(3, "Demo Street Parade", 200, 12.4, "2026-08-01T09:00:00.000Z"),
  agreement(4, "Demo New Year Celebration", 150, 9.6, "2026-08-05T09:00:00.000Z"),
  agreement(5, "Demo Harvest Festival", 500, 40.2, "2026-08-08T09:00:00.000Z"),
];

const batch = (
  id: string,
  material: keyof typeof MATERIAL,
  weightKg: number,
  agreementId: string,
  officerId: string,
  gps: [number, number],
  createdAt: string,
  holder: { status: "available" | "reserved" | "claimed"; artisanId?: string }
) => ({
  id,
  title: `${MATERIAL[material].type}, ${weightKg} kg`,
  materialType: MATERIAL[material].type,
  weightKg,
  condition: "Dry, sorted",
  status: holder.status,
  gpsLat: gps[0],
  gpsLng: gps[1],
  imageUrl: MATERIAL[material].image,
  agreementId,
  scannedByOfficerId: officerId,
  reservedByArtisanId: holder.artisanId ?? null,
  claimedByArtisanId: holder.status === "claimed" ? holder.artisanId ?? null : null,
  aiInferredMaterial: null,
  aiInferredCondition: null,
  aiConfidence: null,
  createdAt,
});

export const SEED_MATERIAL_BATCHES = [
  batch("HT-2026-0101", "paper", 18.5, "RA-2026-001", "usr_lgu_01", [15.0286, 120.6898], "2026-07-16T10:00:00.000Z", { status: "claimed", artisanId: "usr_art_01" }),
  batch("HT-2026-0201", "flowers", 32, "RA-2026-002", "usr_lgu_01", [15.0331, 120.6846], "2026-07-21T09:00:00.000Z", { status: "claimed", artisanId: "usr_art_02" }),
  batch("HT-2026-0301", "fabric", 12.4, "RA-2026-003", "usr_lgu_04", [15.0402, 120.6951], "2026-08-02T12:00:00.000Z", { status: "available" }),
  batch("HT-2026-0401", "plastics", 9.6, "RA-2026-004", "usr_lgu_04", [15.0215, 120.6982], "2026-08-06T12:00:00.000Z", { status: "available" }),
  batch("HT-2026-0501", "wood", 26, "RA-2026-005", "usr_lgu_04", [15.0367, 120.6791], "2026-08-09T08:00:00.000Z", { status: "claimed", artisanId: "usr_art_05" }),
  batch("HT-2026-0502", "paper", 14.2, "RA-2026-005", "usr_lgu_04", [15.0254, 120.6823], "2026-08-09T14:00:00.000Z", { status: "available" }),
];

const product = (
  id: string,
  title: string,
  description: string,
  price: number,
  artisanId: string,
  sourceBatchId: string,
  material: keyof typeof MATERIAL,
  stock: number,
  kgDiverted: number,
  createdAt: string
) => ({
  id,
  title,
  description,
  price,
  images: [MATERIAL[material].image],
  artisanId,
  sourceBatchId,
  materialTags: [MATERIAL[material].type],
  stock,
  kgDiverted,
  ngoFundName: "",
  createdAt,
});

export const SEED_PRODUCTS = [
  product("prod_01", "Lamp shade", "Demo listing. A lamp shade made from paper and card collected after a festival.", 35, "usr_art_01", "HT-2026-0101", "paper", 10, 0.6, "2026-07-20T10:00:00.000Z"),
  product("prod_02", "Plant-dyed notecards (set of 6)", "Demo listing. Notecards coloured with dye made from festival flowers.", 12, "usr_art_02", "HT-2026-0201", "flowers", 20, 0.3, "2026-07-25T10:00:00.000Z"),
  product("prod_03", "Wall shelf", "Demo listing. A small shelf built from wood and frame offcuts left after a festival.", 40, "usr_art_05", "HT-2026-0501", "wood", 6, 2.5, "2026-08-10T10:00:00.000Z"),
  product("prod_04", "Coaster set (4 pieces)", "Demo listing. Coasters cut from the same batch of frame offcuts.", 15, "usr_art_05", "HT-2026-0501", "wood", 12, 0.8, "2026-08-11T10:00:00.000Z"),
];

export const SEED_ORDERS = [
  { id: "ord_1001", productId: "prod_01", buyerId: "usr_buy_01", amountPaid: 35, status: "completed", createdAt: "2026-07-22T14:00:00.000Z" },
  { id: "ord_1002", productId: "prod_02", buyerId: "usr_buy_02", amountPaid: 12, status: "completed", createdAt: "2026-07-28T16:00:00.000Z" },
  { id: "ord_1003", productId: "prod_03", buyerId: "usr_buy_01", amountPaid: 40, status: "completed", createdAt: "2026-08-12T10:00:00.000Z" },
];

export const SEED_WALLET_PASSES = [
  { id: "pass_01", orderId: "ord_1001", serial: "HT-D3M0-0001", issuedAt: "2026-07-22T14:05:00.000Z" },
  { id: "pass_02", orderId: "ord_1002", serial: "HT-D3M0-0002", issuedAt: "2026-07-28T16:05:00.000Z" },
  { id: "pass_03", orderId: "ord_1003", serial: "HT-D3M0-0003", issuedAt: "2026-08-12T10:05:00.000Z" },
];

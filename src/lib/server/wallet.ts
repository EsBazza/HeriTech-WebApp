import "server-only";
import { createSign } from "node:crypto";
import { SPLIT } from "@/lib/escrow";
import { LOYALTY, progressSummary, type LoyaltyState } from "@/lib/loyalty";
import { HttpError } from "./http";

/**
 * Google Wallet "Save to Wallet" links for impact passes.
 *
 * The link carries a JWT signed with a service account that has access to the
 * Wallet issuer account. The JWT embeds both the pass class and the pass object,
 * so nothing has to be created through the Wallet REST API first. While the
 * issuer account is in demo mode, only its test users can save passes.
 */

interface Signer {
  email: string;
  privateKey: string;
}

function signer(): Signer | null {
  const email = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_WALLET_PRIVATE_KEY;
  if (email && key) return { email, privateKey: key.replace(/\\n/g, "\n") };

  // Fall back to the Firebase service account; it must be added in the Wallet console.
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "");
    if (sa.client_email && sa.private_key) return { email: sa.client_email, privateKey: sa.private_key };
  } catch {
    // not configured
  }
  return null;
}

export function walletConfigured(): boolean {
  return Boolean(process.env.GOOGLE_WALLET_ISSUER_ID && signer());
}

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

export function signJwt(payload: object, { email, privateKey }: Signer): string {
  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(JSON.stringify({ ...payload, iss: email }))}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey);
  return `${unsigned}.${base64url(signature)}`;
}

const text = (value: string) => ({ defaultValue: { language: "en", value } });

export interface ImpactPassDetails {
  serial: string;
  productId: string;
  artisanId: string;
  verifyUrl: string;
  /** The buyer's name. Shown only on their own Wallet pass, never on the public record. */
  ownerName: string | null;
  productTitle: string;
  makerName: string | null;
  festival: string | null;
  country: string | null;
  kgDiverted: number;
  amountPaid: number;
  issuedAt: string;
  /** Pass colour taken from the product photo; falls back to HeriTech green. */
  backgroundColor: string | null;
  /** Whether the product has a photo the blurred hero banner can be made from. */
  hasHeroImage: boolean;
  /** Whether the source batch has a collection photo for the "before" image. */
  hasBeforeImage: boolean;
  /** A free piece claimed at the showcase booth: no money changed hands, so no split is shown. */
  freeClaim?: boolean;
}

const field = (id: string) => ({ firstValue: { fields: [{ fieldPath: `object.textModulesData['${id}']` }] } });

/** Front-of-card layout: owner and kg diverted side by side, origin below. */
const IMPACT_CLASS_TEMPLATE = {
  cardTemplateOverride: {
    cardRowTemplateInfos: [
      { twoItems: { startItem: field("owner"), endItem: field("diverted") } },
      { oneItem: { item: field("origin") } },
    ],
  },
};

/** Builds the Save to Google Wallet URL for one impact pass. */
export function impactPassSaveUrl(pass: ImpactPassDetails, appUrl: string): string {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const credentials = signer();
  if (!issuerId || !credentials) {
    throw new HttpError(503, "Google Wallet isn't set up on this server yet.");
  }

  const classId = `${issuerId}.${process.env.GOOGLE_WALLET_CLASS_ID || "heritech_impact_pass"}`;
  const objectId = `${issuerId}.${pass.serial.replace(/[^A-Za-z0-9._-]/g, "_")}`;
  const isPublicHttps = appUrl.startsWith("https://");
  const origin = [pass.festival, pass.country].filter(Boolean).join(", ") || "Festival material";

  const genericObject = {
    id: objectId,
    classId,
    state: "ACTIVE",
    hexBackgroundColor: pass.backgroundColor ?? "#1f3a2b",
    cardTitle: text("HeriTech Impact Pass"),
    header: text(pass.productTitle),
    subheader: text(pass.makerName ? `Made by ${pass.makerName}` : "Verified upcycled piece"),
    // Google fetches the logo, so it is only included when the app is served over public HTTPS.
    ...(isPublicHttps ? { logo: { sourceUri: { uri: `${appUrl}/logo_heritech.png` }, contentDescription: text("HeriTech") } } : {}),
    ...(isPublicHttps && pass.hasHeroImage
      ? { heroImage: { sourceUri: { uri: `${appUrl}/api/wallet/hero/${encodeURIComponent(pass.serial)}?v=2` }, contentDescription: text(pass.productTitle) } }
      : {}),
    textModulesData: [
      ...(pass.ownerName ? [{ id: "owner", header: "Owned by", body: pass.ownerName }] : []),
      { id: "origin", header: "Origin", body: origin },
      { id: "diverted", header: "Material diverted", body: `${pass.kgDiverted} kg` },
      pass.freeClaim
        ? { id: "split", header: "Where the money went", body: "Free showcase piece: no money changed hands" }
        : {
            id: "split",
            header: "Where the money went",
            body: `${SPLIT.artisan}% artisan · ${SPLIT.lgu}% local government · ${SPLIT.charityMaintenance}% charity & app upkeep`,
          },
      { id: "issued", header: "Issued", body: new Date(pass.issuedAt).toISOString().slice(0, 10) },
    ],
    // Before (the batch as collected) next to after (the hero banner of the finished piece).
    ...(isPublicHttps && pass.hasBeforeImage
      ? {
          imageModulesData: [
            {
              id: "before",
              mainImage: { sourceUri: { uri: `${appUrl}/api/wallet/before/${encodeURIComponent(pass.serial)}` }, contentDescription: text("The material when it was collected") },
            },
          ],
        }
      : {}),
    linksModuleData: {
      uris: [
        { id: "record", uri: pass.verifyUrl, description: "Public impact record" },
        { id: "journey", uri: `${appUrl}/products/${encodeURIComponent(pass.productId)}#journey`, description: "See the 3D journey" },
        {
          id: "message",
          uri: `${appUrl}/messages?with=${encodeURIComponent(pass.artisanId)}&name=${encodeURIComponent(pass.makerName ?? "Maker")}`,
          description: "Message the maker",
        },
        ...(pass.makerName
          ? [{ id: "more", uri: `${appUrl}/?q=${encodeURIComponent(pass.makerName)}#shop`, description: "More from this maker" }]
          : []),
      ],
    },
    // Keeps all of a buyer's HeriTech passes stacked together in Wallet.
    groupingInfo: { groupingId: "heritech-impact" },
    barcode: { type: "QR_CODE", value: pass.verifyUrl, alternateText: pass.serial },
  };

  const jwt = signJwt(
    {
      aud: "google",
      typ: "savetowallet",
      ...(isPublicHttps ? { origins: [appUrl] } : {}),
      payload: {
        genericClasses: [{ id: classId, classTemplateInfo: IMPACT_CLASS_TEMPLATE }],
        genericObjects: [genericObject],
      },
    },
    credentials
  );
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

// ---------------------------------------------------------------------------
// HeriTech Circle loyalty card
// ---------------------------------------------------------------------------

export interface LoyaltyMember {
  userId: string;
  name: string;
  state: LoyaltyState;
}

function issuer(): { issuerId: string; credentials: Signer } {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const credentials = signer();
  if (!issuerId || !credentials) throw new HttpError(503, "Google Wallet isn't set up on this server yet.");
  return { issuerId, credentials };
}

const loyaltyObjectId = (issuerId: string, userId: string) => `${issuerId}.circle_${userId.replace(/[^A-Za-z0-9._-]/g, "_")}`;

/** The parts of the loyalty card that change after each purchase. */
function loyaltyBalances(state: LoyaltyState) {
  return {
    loyaltyPoints: { label: "Passes", balance: { string: `${state.passesTowardReward} / ${LOYALTY.passesForReward}` } },
    secondaryLoyaltyPoints: {
      label: `Spent toward $${LOYALTY.spendForReward}`,
      balance: { money: { micros: Math.round(state.spendTowardReward * 1_000_000), currencyCode: "USD" } },
    },
    textModulesData: [
      { id: "reward", header: state.rewardAvailable ? "Reward ready" : "Next reward", body: progressSummary(state) },
      { id: "kg", header: "Total diverted", body: `${state.kgDiverted ?? 0} kg of festival material` },
      {
        id: "how",
        header: "How it works",
        body: `Collect ${LOYALTY.passesForReward} Impact Passes or spend $${LOYALTY.spendForReward} to unlock ${LOYALTY.discountPercent}% off your next order. The discount comes from HeriTech's share, so artisans and local governments are always paid in full.`,
      },
    ],
  };
}

/** Builds the Save to Google Wallet URL for a buyer's HeriTech Circle card. */
export function loyaltyCardSaveUrl(member: LoyaltyMember, appUrl: string): string {
  const { issuerId, credentials } = issuer();
  const classId = `${issuerId}.HeriTechCircle`;
  const isPublicHttps = appUrl.startsWith("https://");
  const logo = { sourceUri: { uri: `${appUrl}/logo_heritech.png` }, contentDescription: text("HeriTech") };

  const loyaltyClass = {
    id: classId,
    issuerName: "HeriTech",
    programName: "HeriTech Circle",
    programLogo: logo,
    hexBackgroundColor: "#1f3a2b",
    reviewStatus: "UNDER_REVIEW",
  };
  const loyaltyObject = {
    id: loyaltyObjectId(issuerId, member.userId),
    classId,
    state: "ACTIVE",
    accountName: member.name,
    accountId: member.userId.slice(0, 12),
    ...loyaltyBalances(member.state),
    barcode: { type: "QR_CODE", value: `${appUrl}/profile`, alternateText: "HeriTech Circle" },
  };

  const jwt = signJwt(
    {
      aud: "google",
      typ: "savetowallet",
      ...(isPublicHttps ? { origins: [appUrl] } : {}),
      payload: { loyaltyClasses: [loyaltyClass], loyaltyObjects: [loyaltyObject] },
    },
    credentials
  );
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

let cachedToken: { email: string; token: string; expiresAt: number } | null = null;

/** Exchanges the signer's key for a short-lived Wallet API access token, reused until 5 minutes before it expires. */
async function walletAccessToken(credentials: Signer): Promise<string> {
  if (cachedToken && cachedToken.email === credentials.email && cachedToken.expiresAt - 300_000 > Date.now()) return cachedToken.token;
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    { aud: "https://oauth2.googleapis.com/token", scope: "https://www.googleapis.com/auth/wallet_object.issuer", iat: now, exp: now + 3600 },
    credentials
  );
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`token request failed with ${res.status}`);
  const { access_token: token, expires_in: expiresIn = 3600 } = await res.json();
  cachedToken = { email: credentials.email, token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}

/**
 * Pushes new balances to a buyer's saved loyalty card. Best effort: a buyer who
 * never saved the card (404) or a Wallet outage must never break checkout.
 */
export async function refreshLoyaltyCard(member: LoyaltyMember): Promise<void> {
  if (!walletConfigured()) return;
  try {
    const { issuerId, credentials } = issuer();
    const token = await walletAccessToken(credentials);
    const id = loyaltyObjectId(issuerId, member.userId);
    const res = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ accountName: member.name, ...loyaltyBalances(member.state) }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok && res.status !== 404) console.warn(`[wallet] loyalty card update responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
  } catch (error) {
    console.warn("[wallet] loyalty card update failed:", error);
  }
}

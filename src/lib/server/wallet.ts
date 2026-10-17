import "server-only";
import { createSign } from "node:crypto";
import { SPLIT } from "@/lib/escrow";
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
  verifyUrl: string;
  productTitle: string;
  makerName: string | null;
  festival: string | null;
  country: string | null;
  kgDiverted: number;
  amountPaid: number;
  issuedAt: string;
}

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
    hexBackgroundColor: "#1f3a2b",
    cardTitle: text("HeriTech Impact Pass"),
    header: text(pass.productTitle),
    subheader: text(pass.makerName ? `Made by ${pass.makerName}` : "Verified upcycled piece"),
    // Google fetches the logo, so it is only included when the app is served over public HTTPS.
    ...(isPublicHttps ? { logo: { sourceUri: { uri: `${appUrl}/logo_heritech.png` }, contentDescription: text("HeriTech") } } : {}),
    textModulesData: [
      { id: "origin", header: "Origin", body: origin },
      { id: "diverted", header: "Material diverted", body: `${pass.kgDiverted} kg` },
      {
        id: "split",
        header: "Where the money went",
        body: `${SPLIT.artisan}% artisan · ${SPLIT.lgu}% LGU · ${SPLIT.charityMaintenance}% charity & app upkeep`,
      },
      { id: "issued", header: "Issued", body: new Date(pass.issuedAt).toISOString().slice(0, 10) },
    ],
    linksModuleData: { uris: [{ id: "record", uri: pass.verifyUrl, description: "Public impact record" }] },
    barcode: { type: "QR_CODE", value: pass.verifyUrl, alternateText: pass.serial },
  };

  const jwt = signJwt(
    {
      aud: "google",
      typ: "savetowallet",
      ...(isPublicHttps ? { origins: [appUrl] } : {}),
      payload: {
        genericClasses: [{ id: classId }],
        genericObjects: [genericObject],
      },
    },
    credentials
  );
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

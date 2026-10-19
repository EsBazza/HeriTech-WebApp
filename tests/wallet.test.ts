import { generateKeyPairSync, createVerify } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { impactPassSaveUrl, walletConfigured } from "@/lib/server/wallet";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

const pass = {
  serial: "HT-7KQ2-M9XD",
  verifyUrl: "https://heritech.example/verify/HT-7KQ2-M9XD",
  ownerName: "Test Buyer",
  productTitle: "Lanna desk lamp",
  makerName: "Lanna Bamboo Guild",
  festival: "Yi Peng",
  country: "Thailand",
  kgDiverted: 1.4,
  amountPaid: 65,
  issuedAt: "2026-10-20T10:00:00.000Z",
  backgroundColor: "#3a2a1c",
  hasHeroImage: true,
};

function decode(url: string) {
  const jwt = url.replace("https://pay.google.com/gp/v/save/", "");
  const [header, payload, signature] = jwt.split(".");
  return { header, payload, signature, claims: JSON.parse(Buffer.from(payload, "base64url").toString()) };
}

describe("Google Wallet save links", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_WALLET_ISSUER_ID", "3388000000022114455");
    vi.stubEnv("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL", "wallet@test.iam.gserviceaccount.com");
    vi.stubEnv("GOOGLE_WALLET_PRIVATE_KEY", privateKey.export({ type: "pkcs8", format: "pem" }).toString());
  });
  afterEach(() => vi.unstubAllEnvs());

  it("signs a verifiable RS256 savetowallet JWT", () => {
    const { header, payload, signature, claims } = decode(impactPassSaveUrl(pass, "https://heritech.example"));
    const valid = createVerify("RSA-SHA256").update(`${header}.${payload}`).verify(publicKey, Buffer.from(signature, "base64url"));
    expect(valid).toBe(true);
    expect(claims).toMatchObject({ aud: "google", typ: "savetowallet", iss: "wallet@test.iam.gserviceaccount.com", origins: ["https://heritech.example"] });
  });

  it("embeds the class and an object whose QR code opens the public record", () => {
    const { claims } = decode(impactPassSaveUrl(pass, "https://heritech.example"));
    const object = claims.payload.genericObjects[0];
    expect(claims.payload.genericClasses[0].id).toBe("3388000000022114455.heritech_impact_pass");
    expect(object.id).toBe("3388000000022114455.HT-7KQ2-M9XD");
    expect(object.barcode).toEqual({ type: "QR_CODE", value: pass.verifyUrl, alternateText: pass.serial });
    expect(object.textModulesData.find((m: { id: string }) => m.id === "split").body).toContain("70% artisan");
  });

  it("uses the class created in the Wallet console when one is configured", () => {
    vi.stubEnv("GOOGLE_WALLET_CLASS_ID", "HeriTech2026");
    const { claims } = decode(impactPassSaveUrl(pass, "https://heritech.example"));
    expect(claims.payload.genericClasses[0].id).toBe("3388000000022114455.HeriTech2026");
    expect(claims.payload.genericObjects[0].classId).toBe("3388000000022114455.HeriTech2026");
  });

  it("personalises the pass with the owner, the product colour and a blurred hero banner", () => {
    const { claims } = decode(impactPassSaveUrl(pass, "https://heritech.example"));
    const object = claims.payload.genericObjects[0];
    expect(object.textModulesData[0]).toEqual({ id: "owner", header: "Owned by", body: "Test Buyer" });
    expect(object.hexBackgroundColor).toBe("#3a2a1c");
    expect(object.heroImage.sourceUri.uri).toBe("https://heritech.example/api/wallet/hero/HT-7KQ2-M9XD");
    expect(claims.payload.genericClasses[0].classTemplateInfo.cardTemplateOverride.cardRowTemplateInfos).toHaveLength(2);
  });

  it("falls back to HeriTech green and no banner when the product has no photo", () => {
    const { claims } = decode(impactPassSaveUrl({ ...pass, ownerName: null, backgroundColor: null, hasHeroImage: false }, "https://heritech.example"));
    const object = claims.payload.genericObjects[0];
    expect(object.hexBackgroundColor).toBe("#1f3a2b");
    expect(object.heroImage).toBeUndefined();
    expect(object.textModulesData.some((m: { id: string }) => m.id === "owner")).toBe(false);
  });

  it("leaves out the logo and origins when not served over public HTTPS", () => {
    const { claims } = decode(impactPassSaveUrl(pass, "http://localhost:3000"));
    expect(claims.origins).toBeUndefined();
    expect(claims.payload.genericObjects[0].logo).toBeUndefined();
    expect(claims.payload.genericObjects[0].heroImage).toBeUndefined();
  });

  it("reports when Wallet is not configured", () => {
    vi.stubEnv("GOOGLE_WALLET_ISSUER_ID", "");
    expect(walletConfigured()).toBe(false);
    expect(() => impactPassSaveUrl(pass, "https://heritech.example")).toThrow(/isn't set up/);
  });
});

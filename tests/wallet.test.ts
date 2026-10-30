import { generateKeyPairSync, createVerify } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { impactPassSaveUrl, loyaltyCardSaveUrl, walletConfigured } from "@/lib/server/wallet";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

const pass = {
  serial: "HT-7KQ2-M9XD",
  productId: "prod_01",
  artisanId: "usr_art_01",
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
  hasBeforeImage: true,
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
    expect(object.textModulesData.find((m: { id: string }) => m.id === "split").body).toContain("60% artisan");
  });

  it("shows no money split on a free piece claimed at the booth", () => {
    const { claims } = decode(impactPassSaveUrl({ ...pass, amountPaid: 0, freeClaim: true }, "https://heritech.example"));
    const split = claims.payload.genericObjects[0].textModulesData.find((m: { id: string }) => m.id === "split");
    expect(split.body).toBe("Free showcase piece: no money changed hands");
  });

  it("uses the class created in the Wallet console when one is configured", () => {
    vi.stubEnv("GOOGLE_WALLET_CLASS_ID", "HeriTech2026");
    const { claims } = decode(impactPassSaveUrl(pass, "https://heritech.example"));
    expect(claims.payload.genericClasses[0].id).toBe("3388000000022114455.HeriTech2026");
    expect(claims.payload.genericObjects[0].classId).toBe("3388000000022114455.HeriTech2026");
  });

  it("personalises the pass with the owner, the product colour and a photo banner", () => {
    const { claims } = decode(impactPassSaveUrl(pass, "https://heritech.example"));
    const object = claims.payload.genericObjects[0];
    expect(object.textModulesData[0]).toEqual({ id: "owner", header: "Owned by", body: "Test Buyer" });
    expect(object.hexBackgroundColor).toBe("#3a2a1c");
    expect(object.heroImage.sourceUri.uri).toBe("https://heritech.example/api/wallet/hero/HT-7KQ2-M9XD?v=2");
    expect(claims.payload.genericClasses[0].classTemplateInfo.cardTemplateOverride.cardRowTemplateInfos).toHaveLength(2);
  });

  it("links to the 3D journey, the maker and their shop, shows the before photo and stacks passes", () => {
    const { claims } = decode(impactPassSaveUrl(pass, "https://heritech.example"));
    const object = claims.payload.genericObjects[0];
    const links = Object.fromEntries(object.linksModuleData.uris.map((u: { id: string; uri: string }) => [u.id, u.uri]));
    expect(links).toEqual({
      record: pass.verifyUrl,
      journey: "https://heritech.example/products/prod_01#journey",
      message: "https://heritech.example/messages?with=usr_art_01&name=Lanna%20Bamboo%20Guild",
      more: "https://heritech.example/?q=Lanna%20Bamboo%20Guild#shop",
    });
    expect(object.imageModulesData[0].mainImage.sourceUri.uri).toBe("https://heritech.example/api/wallet/before/HT-7KQ2-M9XD");
    expect(object.groupingInfo).toEqual({ groupingId: "heritech-impact" });
  });

  it("falls back to HeriTech green and no banner when the product has no photo", () => {
    const { claims } = decode(impactPassSaveUrl({ ...pass, ownerName: null, backgroundColor: null, hasHeroImage: false }, "https://heritech.example"));
    const object = claims.payload.genericObjects[0];
    expect(object.hexBackgroundColor).toBe("#1f3a2b");
    expect(object.heroImage).toBeUndefined();
    expect(object.imageModulesData).toBeDefined();
    expect(object.textModulesData.some((m: { id: string }) => m.id === "owner")).toBe(false);
  });

  it("leaves out the logo and origins when not served over public HTTPS", () => {
    const { claims } = decode(impactPassSaveUrl(pass, "http://localhost:3000"));
    expect(claims.origins).toBeUndefined();
    expect(claims.payload.genericObjects[0].logo).toBeUndefined();
    expect(claims.payload.genericObjects[0].heroImage).toBeUndefined();
  });

  it("builds a HeriTech Circle loyalty card with the member's progress", () => {
    const state = { passesTowardReward: 3, spendTowardReward: 62.5, rewardAvailable: false, rewardsEarned: 0, rewardsRedeemed: 0, kgDiverted: 4.2 };
    const { claims } = decode(loyaltyCardSaveUrl({ userId: "usr_buy_01", name: "Test Buyer", state }, "https://heritech.example"));
    const card = claims.payload.loyaltyObjects[0];
    expect(claims.payload.loyaltyClasses[0]).toMatchObject({ id: "3388000000022114455.HeriTechCircle", programName: "HeriTech Circle" });
    expect(card).toMatchObject({ id: "3388000000022114455.circle_usr_buy_01", accountName: "Test Buyer" });
    expect(card.loyaltyPoints.balance.string).toBe("3 / 5");
    expect(card.secondaryLoyaltyPoints.balance.money).toEqual({ micros: 62_500_000, currencyCode: "USD" });
    expect(card.textModulesData[0].body).toBe("2 more passes or $37.50 more until 5% off");
    expect(card.textModulesData[1]).toEqual({ id: "kg", header: "Total diverted", body: "4.2 kg of festival material" });
  });

  it("reports when Wallet is not configured", () => {
    vi.stubEnv("GOOGLE_WALLET_ISSUER_ID", "");
    expect(walletConfigured()).toBe(false);
    expect(() => impactPassSaveUrl(pass, "https://heritech.example")).toThrow(/isn't set up/);
  });
});

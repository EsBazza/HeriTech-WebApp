import { describe, expect, it } from "vitest";
import { NGO_PAYOUT_THRESHOLD, SPLIT, calculateEscrowSplit, ngoPayoutProgress, orderSplit, type EscrowSplit } from "@/lib/escrow";

const cents = (n: number) => Math.round(n * 100);
const sum = (s: EscrowSplit) => cents(s.artisanPayout) + cents(s.lguShare) + cents(s.platformShare) + cents(s.ngoShare);

describe("calculateEscrowSplit", () => {
  it("uses the 60/20/15/5 split", () => {
    expect(SPLIT).toEqual({ artisan: 60, platform: 20, lgu: 15, ngo: 5 });
    expect(calculateEscrowSplit(100)).toEqual({ totalAmount: 100, artisanPayout: 60, lguShare: 15, platformShare: 20, ngoShare: 5, discount: 0 });
  });

  it.each([0.01, 0.99, 33.33, 42, 65, 66.66, 99.99, 1234.57])("parts always add up to the total for %s", (price) => {
    expect(sum(calculateEscrowSplit(price))).toBe(cents(price));
  });

  it("puts the rounding remainder in the platform's share", () => {
    expect(calculateEscrowSplit(66.66)).toEqual({ totalAmount: 66.66, artisanPayout: 40, lguShare: 10, platformShare: 13.33, ngoShare: 3.33, discount: 0 });
  });

  it("never produces a negative share", () => {
    for (let c = 1; c <= 500; c++) {
      const split = calculateEscrowSplit(c / 100);
      expect(split.platformShare).toBeGreaterThanOrEqual(0);
      expect(split.ngoShare).toBeGreaterThanOrEqual(0);
    }
  });

  it("takes a loyalty discount only from the platform's share", () => {
    expect(calculateEscrowSplit(100, { discountPercent: 5 })).toEqual({
      totalAmount: 95,
      artisanPayout: 60,
      lguShare: 15,
      platformShare: 15,
      ngoShare: 5,
      discount: 5,
    });
  });

  it.each([0.01, 0.99, 33.33, 42, 66.66, 99.99, 1234.57])("discounted parts still add up to what the buyer pays for %s", (price) => {
    const split = calculateEscrowSplit(price, { discountPercent: 5 });
    const full = calculateEscrowSplit(price);
    expect(sum(split)).toBe(cents(split.totalAmount));
    expect(cents(split.totalAmount) + cents(split.discount)).toBe(cents(price));
    expect(split.artisanPayout).toBe(full.artisanPayout);
    expect(split.lguShare).toBe(full.lguShare);
    expect(split.ngoShare).toBe(full.ngoShare);
    expect(split.platformShare).toBeGreaterThanOrEqual(0);
  });

  it("works out orders from before the platform share under the new split", () => {
    expect(orderSplit({ amountPaid: 95, discount: 5, artisanPayout: 70, lguShare: 25, paymentMode: "simulated" })).toEqual({ artisanPayout: 60, lguShare: 15, platformShare: 15, ngoShare: 5 });
    // Orders from the 60/20/15/5 split with 20% to the LGU and a developers' share.
    const withDeveloperShare = { amountPaid: 40, artisanPayout: 24, lguShare: 8, developerShare: 6, ngoShare: 2, paymentMode: "simulated" };
    expect(orderSplit(withDeveloperShare)).toEqual({ artisanPayout: 24, lguShare: 6, platformShare: 8, ngoShare: 2 });
    expect(orderSplit({ amountPaid: 0, paymentMode: "free_claim" })).toEqual({ artisanPayout: 0, lguShare: 0, platformShare: 0, ngoShare: 0 });
    expect(orderSplit({ amountPaid: 40, artisanPayout: 24, lguShare: 8, platformShare: 6, ngoShare: 2 })).toEqual({ artisanPayout: 24, lguShare: 8, platformShare: 6, ngoShare: 2 });
  });

  it("never discounts more than the platform's share", () => {
    const split = calculateEscrowSplit(100, { discountPercent: 50 });
    expect(split.discount).toBe(20);
    expect(split.totalAmount).toBe(80);
  });
});

describe("ngoPayoutProgress", () => {
  it("pays out the NGO pool every $1,000", () => {
    expect(NGO_PAYOUT_THRESHOLD).toBe(1000);
    expect(ngoPayoutProgress(0)).toEqual({ totalRaised: 0, payouts: 0, sent: 0, pending: 0, remaining: 1000, pct: 0 });
    expect(ngoPayoutProgress(250.5)).toEqual({ totalRaised: 250.5, payouts: 0, sent: 0, pending: 250.5, remaining: 749.5, pct: 25.1 });
  });

  it("counts reaching the threshold as sent and starts the bar again", () => {
    expect(ngoPayoutProgress(1000)).toEqual({ totalRaised: 1000, payouts: 1, sent: 1000, pending: 0, remaining: 1000, pct: 0 });
    expect(ngoPayoutProgress(2345.67)).toEqual({ totalRaised: 2345.67, payouts: 2, sent: 2000, pending: 345.67, remaining: 654.33, pct: 34.6 });
  });

  it("never goes negative or NaN on odd input", () => {
    for (const total of [-5, 0.004, 999.999, Number.NaN]) {
      const p = ngoPayoutProgress(total);
      for (const v of Object.values(p)) {
        expect(Number.isNaN(v)).toBe(false);
        expect(v).toBeGreaterThanOrEqual(0);
      }
      expect(p.pct).toBeLessThan(100);
    }
  });
});

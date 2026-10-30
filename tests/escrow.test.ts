import { describe, expect, it } from "vitest";
import { SPLIT, calculateEscrowSplit, orderSplit, type EscrowSplit } from "@/lib/escrow";

const cents = (n: number) => Math.round(n * 100);
const sum = (s: EscrowSplit) => cents(s.artisanPayout) + cents(s.lguShare) + cents(s.developerShare) + cents(s.ngoShare);

describe("calculateEscrowSplit", () => {
  it("uses the 60/20/15/5 split", () => {
    expect(SPLIT).toEqual({ artisan: 60, lgu: 20, developers: 15, ngo: 5 });
    expect(calculateEscrowSplit(100)).toEqual({ totalAmount: 100, artisanPayout: 60, lguShare: 20, developerShare: 15, ngoShare: 5, discount: 0 });
  });

  it.each([0.01, 0.99, 33.33, 42, 65, 66.66, 99.99, 1234.57])("parts always add up to the total for %s", (price) => {
    expect(sum(calculateEscrowSplit(price))).toBe(cents(price));
  });

  it("puts the rounding remainder in the developers' share", () => {
    expect(calculateEscrowSplit(66.66)).toEqual({ totalAmount: 66.66, artisanPayout: 40, lguShare: 13.33, developerShare: 10, ngoShare: 3.33, discount: 0 });
  });

  it("never produces a negative share", () => {
    for (let c = 1; c <= 500; c++) {
      const split = calculateEscrowSplit(c / 100);
      expect(split.developerShare).toBeGreaterThanOrEqual(0);
      expect(split.ngoShare).toBeGreaterThanOrEqual(0);
    }
  });

  it("takes a loyalty discount only from the developers' share", () => {
    expect(calculateEscrowSplit(100, { discountPercent: 5 })).toEqual({
      totalAmount: 95,
      artisanPayout: 60,
      lguShare: 20,
      developerShare: 10,
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
    expect(split.developerShare).toBeGreaterThanOrEqual(0);
  });

  it("works out orders from before the developer and NGO shares under the new split", () => {
    expect(orderSplit({ amountPaid: 95, discount: 5, artisanPayout: 70, lguShare: 25, paymentMode: "simulated" })).toEqual({ artisanPayout: 60, lguShare: 20, developerShare: 10, ngoShare: 5 });
    expect(orderSplit({ amountPaid: 0, paymentMode: "free_claim" })).toEqual({ artisanPayout: 0, lguShare: 0, developerShare: 0, ngoShare: 0 });
    expect(orderSplit({ amountPaid: 40, artisanPayout: 24, lguShare: 8, developerShare: 6, ngoShare: 2 })).toEqual({ artisanPayout: 24, lguShare: 8, developerShare: 6, ngoShare: 2 });
  });

  it("never discounts more than the developers' share", () => {
    const split = calculateEscrowSplit(100, { discountPercent: 50 });
    expect(split.discount).toBe(15);
    expect(split.totalAmount).toBe(85);
  });
});

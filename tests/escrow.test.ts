import { describe, expect, it } from "vitest";
import { SPLIT, calculateEscrowSplit } from "@/lib/escrow";

const cents = (n: number) => Math.round(n * 100);

describe("calculateEscrowSplit", () => {
  it("uses the 70/25/5 split", () => {
    expect(SPLIT).toEqual({ artisan: 70, lgu: 25, charityMaintenance: 5 });
    expect(calculateEscrowSplit(100)).toEqual({ totalAmount: 100, artisanPayout: 70, lguShare: 25, charityMaintenanceShare: 5, discount: 0 });
  });

  it.each([0.01, 0.99, 33.33, 42, 65, 66.66, 99.99, 1234.57])("parts always add up to the total for %s", (price) => {
    const split = calculateEscrowSplit(price);
    expect(cents(split.artisanPayout) + cents(split.lguShare) + cents(split.charityMaintenanceShare)).toBe(cents(price));
  });

  it("puts the rounding remainder in the charity & maintenance share", () => {
    expect(calculateEscrowSplit(66.66)).toEqual({ totalAmount: 66.66, artisanPayout: 46.66, lguShare: 16.67, charityMaintenanceShare: 3.33, discount: 0 });
  });

  it("never produces a negative share", () => {
    for (let c = 1; c <= 500; c++) {
      const split = calculateEscrowSplit(c / 100);
      expect(split.charityMaintenanceShare).toBeGreaterThanOrEqual(0);
    }
  });

  it("takes a loyalty discount only from the charity & maintenance share", () => {
    expect(calculateEscrowSplit(100, { discountPercent: 5 })).toEqual({
      totalAmount: 95,
      artisanPayout: 70,
      lguShare: 25,
      charityMaintenanceShare: 0,
      discount: 5,
    });
  });

  it.each([0.01, 0.99, 33.33, 42, 66.66, 99.99, 1234.57])("discounted parts still add up to what the buyer pays for %s", (price) => {
    const split = calculateEscrowSplit(price, { discountPercent: 5 });
    expect(cents(split.artisanPayout) + cents(split.lguShare) + cents(split.charityMaintenanceShare)).toBe(cents(split.totalAmount));
    expect(cents(split.totalAmount) + cents(split.discount)).toBe(cents(price));
    expect(split.artisanPayout).toBe(calculateEscrowSplit(price).artisanPayout);
    expect(split.charityMaintenanceShare).toBeGreaterThanOrEqual(0);
  });

  it("never discounts more than the charity & maintenance share", () => {
    const split = calculateEscrowSplit(100, { discountPercent: 50 });
    expect(split.discount).toBe(5);
    expect(split.totalAmount).toBe(95);
  });
});

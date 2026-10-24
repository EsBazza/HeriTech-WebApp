import { describe, expect, it } from "vitest";
import { kgBudgetProblem, promisedKg } from "@/lib/server/kgBudget";
import { SEED_MATERIAL_BATCHES, SEED_ORDERS, SEED_PRODUCTS } from "../scripts/seed-data";

const batch = { batchId: "HT-2026-0501", batchWeightKg: 26 };

describe("kg budget per batch", () => {
  it("counts every piece a listing will ever have, sold or in stock", () => {
    expect(promisedKg({ kgDiverted: 2.5, stock: 6, sold: 1 })).toBe(17.5);
  });

  it("accepts listings that fit what the batch has left", () => {
    expect(kgBudgetProblem({ ...batch, others: [{ kgDiverted: 2.5, stock: 6, sold: 1 }], after: { kgDiverted: 0.3, stock: 12, sold: 0 } })).toBeNull();
  });

  it("rejects pieces that add up to more than the batch weighed, with the numbers", () => {
    const problem = kgBudgetProblem({ ...batch, batchWeightKg: 5, others: [], after: { kgDiverted: 1, stock: 20, sold: 0 } });
    expect(problem).toContain("5 kg");
    expect(problem).toContain("20 pieces × 1 kg = 20 kg");
  });

  it("counts pieces already sold when an edit raises the stock", () => {
    const problem = kgBudgetProblem({
      ...batch,
      batchWeightKg: 10,
      others: [],
      before: { kgDiverted: 1, stock: 5, sold: 4 },
      after: { kgDiverted: 1, stock: 7, sold: 4 },
    });
    expect(problem).toContain("11 pieces (including 4 already sold)");
  });

  it("lets an over-budget listing from before the check be lowered", () => {
    const others = [{ kgDiverted: 2.5, stock: 6, sold: 1 }, { kgDiverted: 0.8, stock: 12, sold: 0 }];
    const before = { kgDiverted: 1.1, stock: 6, sold: 0 };
    expect(kgBudgetProblem({ ...batch, others, before, after: { ...before, stock: 5 } })).toBeNull();
    expect(kgBudgetProblem({ ...batch, others, before, after: { ...before, stock: 7 } })).not.toBeNull();
  });

  it("keeps every seeded demo batch within its weight", () => {
    for (const b of SEED_MATERIAL_BATCHES) {
      const promised = SEED_PRODUCTS.filter((p) => p.sourceBatchId === b.id).reduce(
        (sum, p) => sum + promisedKg({ kgDiverted: p.kgDiverted, stock: p.stock, sold: SEED_ORDERS.filter((o) => o.productId === p.id).length }),
        0
      );
      expect(promised, b.id).toBeLessThanOrEqual(b.weightKg);
    }
  });
});

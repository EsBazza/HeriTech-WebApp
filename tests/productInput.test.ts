import { describe, expect, it } from "vitest";
import { productCreateSchema, productUpdateSchema } from "@/lib/server/productInput";

const listing = { title: "Lamp shade", price: 35, images: ["https://example.com/a.jpg"], sourceBatchId: "HT-2026-0101", kgDiverted: 0.6 };

describe("product input", () => {
  it("treats the charity partner as optional", () => {
    expect(productCreateSchema.safeParse(listing).data?.ngoFundName).toBe("");
    expect(productCreateSchema.safeParse({ ...listing, ngoFundName: "" }).success).toBe(true);
    expect(productCreateSchema.safeParse({ ...listing, ngoFundName: "  Local fund " }).data?.ngoFundName).toBe("Local fund");
  });

  it("accepts the admin-only free-claim switch and nothing else for it", () => {
    expect(productUpdateSchema.parse({ freeClaim: true })).toEqual({ freeClaim: true });
    expect(productUpdateSchema.safeParse({ freeClaim: "yes" }).success).toBe(false);
  });

  it("leaves unsent fields out of an update instead of filling defaults", () => {
    expect(productUpdateSchema.parse({ price: 40 })).toEqual({ price: 40 });
  });
});

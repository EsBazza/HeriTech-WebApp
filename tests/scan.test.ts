import { describe, expect, it } from "vitest";
import { tidy } from "@/lib/server/scan";

describe("scanner result tidy-up", () => {
  it("keeps Gemini to one general category, one condition and short lists", () => {
    const result = tidy({
      materialType: "mixed plastics",
      confidence: 0.96,
      summary: "Clear plastic bottles and food trays piled inside a cardboard collection box with labels",
      condition: "Needs sorting",
      contaminationFlags: ["Paper product labels", "Adhesive residue", "Minor food or liquid residue inside containers", "Caps"],
      suggestedCraftTypologies: ["Plastic sheet melting for artisan panels", "Seed starter pots", "Laser-cut jewellery", "Filament"],
      estimatedWeightKg: { low: 0.8, high: 1.8, bestEstimate: 1.23 },
      peopleVisible: false,
    });
    expect(result.materialType).toBe("Mixed plastics");
    expect(result.inferredMaterialDetails.split(" ")).toHaveLength(12);
    expect(result.contaminationFlags).toEqual(["Paper product labels", "Adhesive residue", "Minor food or"]);
    expect(result.suggestedCraftTypologies).toHaveLength(3);
    expect(result.suggestedCraftTypologies?.every((u) => u.split(" ").length <= 4)).toBe(true);
    expect(result.estimatedWeightKg).toEqual({ low: 0.8, high: 1.8, bestEstimate: 1.2 });
  });

  it("falls back to Other and Needs sorting for answers outside the lists", () => {
    const result = tidy({ materialType: "PET bottles (Cocobella)", condition: "pristine, mint", confidence: 3 });
    expect(result).toMatchObject({ materialType: "Other", condition: "Needs sorting", confidence: 1, contaminationFlags: [], peopleVisible: false });
  });
});

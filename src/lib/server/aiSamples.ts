import "server-only";

/**
 * Canned AI results for presentations. They are only returned when DEMO_MODE is
 * on and Gemini is unavailable, and responses carry `isSample: true` so the UI
 * can say so. Production never shows them.
 */

export interface ScanAnalysis {
  materialType: string;
  materialSubtypes?: string[];
  confidence: number;
  condition: string;
  inferredMaterialDetails: string;
  contaminationFlags?: string[];
  suggestedCraftTypologies?: string[];
  estimatedWeightKg?: { low: number; high: number; bestEstimate: number; visualRationale: string };
}

const SCAN_SAMPLES: Record<"panagbenga" | "yipeng" | "nirmalaya" | "default", ScanAnalysis> = {
  panagbenga: {
    materialType: "Cured Bolo Bamboo Framework & Strawflower Bundles",
    materialSubtypes: ["Bolo Bamboo Culms", "Helichrysum Bracteatum Botanical Flora", "Abaca Twine Bindings"],
    condition: "Pristine & Dry structural condition",
    confidence: 0.97,
    inferredMaterialDetails: "Untreated native highland bamboo frames with natural sun-dried Everlasting floral clusters from Panagbenga festival float salvages.",
    suggestedCraftTypologies: ["Loom Weaving Accents", "Botanical Wall Hangings", "Heritage Joinery Sculptures"],
    contaminationFlags: ["Minor floral pollen dust"],
    estimatedWeightKg: { low: 35, high: 55, bestEstimate: 45, visualRationale: "Bundle volume ~120x60x40cm with bamboo density ~600 kg/m³" },
  },
  yipeng: {
    materialType: "Treated Phyllostachys Bamboo Frames",
    materialSubtypes: ["Split Bamboo Strips", "Mulberry Rice Paper Shells"],
    condition: "Intact, wire-free and dry",
    confidence: 0.96,
    inferredMaterialDetails: "Clean, non-charred bamboo lantern ribs recovered post-festival with structural flexibility preserved.",
    suggestedCraftTypologies: ["Luminary Desk Lamps", "Tea Trays", "Architectural Latticework"],
    contaminationFlags: ["Residual beeswax droplets"],
    estimatedWeightKg: { low: 15, high: 28, bestEstimate: 22.5, visualRationale: "Lightweight flexible bamboo hoops ~40x40cm stack" },
  },
  nirmalaya: {
    materialType: "Temple Nirmalaya Floral Biomass",
    materialSubtypes: ["Tagetes Erecta (Marigold)", "Rosa Damascena Petals", "Hibiscus Flower"],
    condition: "High moisture content, rich organic pigmentation",
    confidence: 0.98,
    inferredMaterialDetails: "Fresh post-ceremonial flower garlands with high carotenoid dye concentration.",
    suggestedCraftTypologies: ["Organic Watercolor Inks", "Natural Fabric Dyes", "Temple Incense Sticks"],
    contaminationFlags: ["Ground moisture", "Jute thread strings"],
    estimatedWeightKg: { low: 20, high: 40, bestEstimate: 30, visualRationale: "Moist flower basket volume ~80x50x50cm at ~350 kg/m³" },
  },
  default: {
    materialType: "Unbleached Mulberry Kraft & Rice Paper",
    materialSubtypes: ["Handmade Kozo Fiber Paper", "Plant Cellulose Sheet"],
    condition: "Dry, clean, torn along seams",
    confidence: 0.94,
    inferredMaterialDetails: "Long-fiber handmade paper suitable for repulping, calligraphy binding, or translucent craft shades.",
    suggestedCraftTypologies: ["Accordion Journals", "Botanical Stationery", "Lantern Lampshades"],
    contaminationFlags: ["Paste residue along rim"],
    estimatedWeightKg: { low: 5, high: 12, bestEstimate: 8.5, visualRationale: "Layered paper stack ~60x40x15cm" },
  },
};

const has = (text: string, ...needles: string[]) => needles.some((n) => text.includes(n));

export function sampleScan(festivalHint: string): ScanAnalysis {
  const hint = festivalHint.toLowerCase();
  if (has(hint, "panagbenga", "baguio")) return SCAN_SAMPLES.panagbenga;
  if (has(hint, "ganesh", "flora", "nirmalaya")) return SCAN_SAMPLES.nirmalaya;
  if (has(hint, "yi peng", "yipeng", "chiang")) return SCAN_SAMPLES.yipeng;
  return SCAN_SAMPLES.default;
}

export interface OriginStory {
  story: string;
  headline: string;
  suggestedTags: string[];
}

export function sampleStory(festival: string, materialType: string, divertedKg: string): OriginStory {
  const f = festival.toLowerCase();
  if (has(f, "panagbenga", "baguio")) {
    return {
      story: `Handcrafted from ${divertedKg} kg of structural Highland Bolo bamboo and sun-dried botanical flora salvaged from the Panagbenga Festival in Baguio. Master Cordillera weavers gently cure and knot each culm using heirloom backstrap looms, transforming transient float sculptures into enduring living tapestries.`,
      headline: "Echoes of the Blooming Highlands",
      suggestedTags: ["Cordillera Loom", "Panagbenga Flora", "Bolo Bamboo"],
    };
  }
  if (has(f, "yi peng", "chiang")) {
    return {
      story: `Repurposed from ${divertedKg} kg of non-combusted split bamboo frames and mulberry rice paper gathered after the Yi Peng Sky Lantern celebration in Chiang Mai. Traditional Lanna joinery keeps Northern Thai craftsmanship alive while keeping delicate paper fibers out of regional waterways.`,
      headline: "Sky Lantern Rebirth",
      suggestedTags: ["Lanna Joinery", "Mulberry Paper", "Yi Peng Bamboo"],
    };
  }
  if (has(f, "ganesh", "nirmalaya")) {
    return {
      story: `Extracted from ${divertedKg} kg of consecrated temple nirmalaya marigolds and rose petals after Ganesh Visarjan. Solar-dried and blended into non-toxic organic pigment inks, carrying festival colors into archival handmade parchment.`,
      headline: "Sacred Petals, Permanent Pigments",
      suggestedTags: ["Temple Nirmalaya", "Natural Pigment", "Organic Marigold"],
    };
  }
  return {
    story: `Hand-carved and woven from ${divertedKg} kg of ${materialType} recovered after the ${festival}. Restored by master artisans through natural curing, giving ceremonial fibers a second, lasting life.`,
    headline: "From Celebration to Living Heritage",
    suggestedTags: ["Heritage Craft", "Zero-Waste", "Circular Fiber"],
  };
}

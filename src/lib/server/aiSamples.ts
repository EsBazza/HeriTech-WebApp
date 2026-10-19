import "server-only";

/**
 * Placeholder AI results for presentations. They are only returned when
 * DEMO_MODE is on and Gemini is unreachable, carry `isSample: true`, and the UI
 * labels them as samples. They deliberately describe nothing specific.
 */

export interface ScanAnalysis {
  /** One of MATERIAL_CATEGORIES, or a labelled sample. */
  materialType: string;
  /** Other categories clearly present in a mixed batch. */
  alsoContains?: string[];
  confidence: number;
  condition: string;
  /** One short line describing what is in the photo. */
  inferredMaterialDetails: string;
  contaminationFlags?: string[];
  suggestedCraftTypologies?: string[];
  estimatedWeightKg?: { low: number; high: number; bestEstimate: number };
  /** True when any person is recognisable in the photo; such photos must not be logged. */
  peopleVisible?: boolean;
}

export function sampleScan(): ScanAnalysis {
  return {
    materialType: "Sample result: festival material",
    confidence: 0,
    condition: "Not assessed (sample)",
    inferredMaterialDetails: "Gemini was unavailable, so this photo was not analysed. Enter the material details by hand.",
    contaminationFlags: [],
    suggestedCraftTypologies: [],
    peopleVisible: false,
  };
}

export interface OriginStory {
  story: string;
  headline: string;
  suggestedTags: string[];
}

export function sampleStory(festival: string, materialType: string, divertedKg: string): OriginStory {
  return {
    story: `Made from ${divertedKg} kg of ${materialType} collected after ${festival}. Replace this sample with your own words about how the piece was made.`,
    headline: "Sample story",
    suggestedTags: [],
  };
}

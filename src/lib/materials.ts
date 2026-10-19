/**
 * The material categories HeriTech works with. Kept deliberately general:
 * the scanner, the on-device model and the demo data all use these names.
 */
export const MATERIAL_CATEGORIES = [
  "Paper and card",
  "Flowers and plant matter",
  "Fabric and textile",
  "Mixed plastics",
  "Wood and frame offcuts",
  "Other",
] as const;

export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

/** How ready a batch is for artisans, from the scanner's point of view. */
export const MATERIAL_CONDITIONS = ["Clean and dry", "Needs sorting", "Dirty or wet"] as const;

export type MaterialCondition = (typeof MATERIAL_CONDITIONS)[number];

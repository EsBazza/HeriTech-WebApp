import "server-only";
import { MATERIAL_CATEGORIES, MATERIAL_CONDITIONS } from "@/lib/materials";
import type { ScanAnalysis } from "./aiSamples";
import { generateJson } from "./gemini";

/**
 * Gemini material scan for LGU officers. The prompt asks for short, fixed answers
 * (one general category, one condition, up to three flags and uses) and tidy()
 * enforces them, so the scanner never shows long or brand-specific text.
 */

const SYSTEM_PROMPT =
  "You sort leftover festival material for a recycling and upcycling programme. Answer briefly in plain English. Never mention brand names, logos or product names.";

const USER_PROMPT = `Look at the material in this photo and fill in this JSON. Keep every answer short.

{
  "materialType": one of ${MATERIAL_CATEGORIES.map((c) => `"${c}"`).join(", ")},
  "confidence": number from 0 to 1,
  "summary": "what is in the photo, at most 10 words, no brand names",
  "condition": one of ${MATERIAL_CONDITIONS.map((c) => `"${c}"`).join(", ")},
  "contaminationFlags": up to 3 things to remove before reuse, each 1 to 3 words (empty list if none),
  "suggestedCraftTypologies": up to 3 simple uses, each 2 to 4 words,
  "estimatedWeightKg": { "low": number, "high": number, "bestEstimate": number },
  "peopleVisible": true if any person or face is visible
}

Pick the single category that makes up most of the photo. Use "Other" for anything that fits none of them.
Return only the JSON.`;

const words = (text: unknown, max: number) =>
  typeof text === "string" ? text.trim().split(/\s+/).slice(0, max).join(" ").replace(/[.,;:]+$/, "") : "";

const shortList = (list: unknown, maxItems: number, maxWords: number) =>
  Array.isArray(list) ? list.map((item) => words(item, maxWords)).filter(Boolean).slice(0, maxItems) : [];

/** Holds Gemini to the short, fixed answers the scanner screen expects. */
export function tidy(raw: Partial<ScanAnalysis> & { summary?: string }): ScanAnalysis {
  const category = MATERIAL_CATEGORIES.find((c) => c.toLowerCase() === String(raw.materialType ?? "").trim().toLowerCase()) ?? "Other";
  const condition = MATERIAL_CONDITIONS.find((c) => c.toLowerCase() === String(raw.condition ?? "").trim().toLowerCase()) ?? "Needs sorting";
  const weight = raw.estimatedWeightKg;
  const kg = (n: unknown) => Math.max(0, Math.round(Number(n) * 10) / 10 || 0);
  return {
    materialType: category,
    confidence: Math.min(Math.max(Number(raw.confidence) || 0, 0), 1),
    condition,
    inferredMaterialDetails: words(raw.summary ?? raw.inferredMaterialDetails, 12),
    contaminationFlags: shortList(raw.contaminationFlags, 3, 3),
    suggestedCraftTypologies: shortList(raw.suggestedCraftTypologies, 3, 4),
    estimatedWeightKg: weight ? { low: kg(weight.low), high: kg(weight.high), bestEstimate: kg(weight.bestEstimate) } : undefined,
    peopleVisible: Boolean(raw.peopleVisible),
  };
}

/** Classifies one photo (a data URL). Returns null when Gemini is unavailable. */
export async function analyzeScan(imageBase64: string, festivalHint = ""): Promise<{ data: ScanAnalysis; model: string } | null> {
  const separator = imageBase64.indexOf(",");
  const mimeType = imageBase64.slice("data:".length, imageBase64.indexOf(";"));
  const data = imageBase64.slice(separator + 1);
  const prompt = festivalHint ? `${USER_PROMPT}

Context: collected after ${festivalHint}.` : USER_PROMPT;
  const result = await generateJson<Partial<ScanAnalysis> & { summary?: string }>({
    system: SYSTEM_PROMPT,
    contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data } }] }],
    temperature: 0.2,
  });
  return result ? { data: tidy(result.data), model: result.model } : null;
}

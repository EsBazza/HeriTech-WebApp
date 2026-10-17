import { z } from "zod";
import { DEMO_MODE } from "@/lib/demo";
import { requireUser } from "@/lib/server/auth";
import { sampleScan, type ScanAnalysis } from "@/lib/server/aiSamples";
import { generateJson } from "@/lib/server/gemini";
import { HttpError, ok, parseBody, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";

const SYSTEM_PROMPT =
  "You are the HeriTech Multimodal Waste & Material Salvage Classifier. Analyze the image with complete visual objectivity: identify exactly what is visible without forcing it into rigid categories or predefined options. Use open-ended, highly specific descriptions based strictly on physical reality.";

const USER_PROMPT = `Analyze the material shown in this photo with complete visual honesty.

Provide:
1. Exact Material Classification: State the exact material(s) seen (e.g., standard corrugated cardboard, bamboo splits, PET plastic, unbleached kraft paper, scrap metal, pine wood, etc.—do not limit to these examples; state whatever is actually there).
2. Physical Condition & Degradation: Describe the true state of the material (e.g., dry, wet, crushed, torn, moldy, intact, pristine).
3. Specific Visual Details: Note brand logos, flute patterns, weave textures, layer thicknesses, or visible markings.
4. Contamination Flags: List every visible contaminant or foreign element observed (e.g., shipping tape, staples, moisture, food grease, wax coating, fuel, dirt, mold, wire).
5. Suggested Upcycling & Craft Typologies: Suggest realistic artisan crafts, recycling pathways, or maker applications tailored to the specific material.
6. Volumetric Weight Estimation: Estimate the weight in kilograms based on visible scale, dimensions, and material density.

Return ONLY valid JSON matching this schema:
{
  "materialType": "Open string: exact primary material identified (e.g. Corrugated Kraft Cardboard Boxes)",
  "materialSubtypes": ["Open string: specific subtypes, e.g. Single-wall corrugated board, paper tape"],
  "confidence": 0.95,
  "condition": "Open string: descriptive condition assessment",
  "inferredMaterialDetails": "Detailed breakdown of visible physical traits, brands, textures, and structural layers",
  "contaminationFlags": ["Open list of any observed contaminants, e.g. shipping tape, ground moisture"],
  "suggestedCraftTypologies": ["Open list of practical upcycling / artisan use-cases"],
  "estimatedWeightKg": {
    "low": 1.0,
    "high": 2.5,
    "bestEstimate": 1.8,
    "visualRationale": "Brief visual scale and density basis (e.g. bundle size relative to curbside ~50x30x20cm at ~60-80 kg/m³)"
  }
}`;

const schema = z.object({
  imageBase64: z
    .string()
    .max(8_000_000, "Photo is too large. Retake it at a lower resolution.")
    .regex(/^data:image\/(jpeg|png|webp);base64,/, "Upload a JPEG, PNG or WebP photo."),
  festivalHint: z.string().max(100).default(""),
});

/**
 * POST /api/ai/scan — Gemini classifies a photographed batch for an LGU officer.
 * When Gemini is unreachable this fails with 503, except in demo mode, where a
 * clearly labelled sample result is returned instead.
 */
export const POST = route(async (request: Request) => {
  const officer = await requireUser(request, ["lgu"]);
  rateLimit(request, "ai-scan", 20, 60_000, officer.id);
  const { imageBase64, festivalHint } = await parseBody(request, schema);

  const separator = imageBase64.indexOf(",");
  const mimeType = imageBase64.slice("data:".length, imageBase64.indexOf(";"));
  const data = imageBase64.slice(separator + 1);
  const result = await generateJson<ScanAnalysis>({
    system: SYSTEM_PROMPT,
    contents: [{ role: "user", parts: [{ text: USER_PROMPT }, { inline_data: { mime_type: mimeType, data } }] }],
    temperature: 0.2,
  });

  if (result) return ok({ ...result.data, isSample: false, model: result.model });
  if (DEMO_MODE) return ok({ ...sampleScan(festivalHint), isSample: true });
  throw new HttpError(503, "The AI scanner is unavailable right now. Enter the material details by hand.");
});

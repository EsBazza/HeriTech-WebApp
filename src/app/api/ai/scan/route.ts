import { z } from "zod";
import { DEMO_MODE } from "@/lib/demo";
import { requireUser } from "@/lib/server/auth";
import { sampleScan } from "@/lib/server/aiSamples";
import { HttpError, ok, parseBody, route } from "@/lib/server/http";
import { analyzeScan } from "@/lib/server/scan";
import { rateLimit } from "@/lib/server/rateLimit";

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

  const result = await analyzeScan(imageBase64, festivalHint);
  if (result) return ok({ ...result.data, isSample: false, model: result.model });
  if (DEMO_MODE) return ok({ ...sampleScan(), isSample: true });
  throw new HttpError(503, "The AI scanner is unavailable right now. Enter the material details by hand.");
});

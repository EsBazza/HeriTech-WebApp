import { z } from "zod";
import { DEMO_MODE } from "@/lib/demo";
import { requireUser } from "@/lib/server/auth";
import { sampleStory, type OriginStory } from "@/lib/server/aiSamples";
import { generateJson } from "@/lib/server/gemini";
import { HttpError, ok, parseBody, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";

const SYSTEM_PROMPT =
  "You are the HeriTech Heritage Storyteller AI. You craft authentic, evocative, and culturally reverent product bios and origin stories for upcycled heritage artisan pieces made from salvaged Asian festival materials.";

const text = (fallback: string, max = 200) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || v === "" ? fallback : String(v).slice(0, max)));

const schema = z.object({
  title: text("Handcrafted Heritage Piece"),
  festival: text("Pan-Asian Cultural Festival"),
  country: text("Asia", 80),
  batchId: text("unknown batch", 40),
  materialType: text("organic festival material"),
  condition: text("good"),
  divertedKg: text("1.0", 20),
  craftTypology: text("traditional joinery and weaving"),
  artisanWorkshop: text("certified artisan cooperative"),
});

/** POST /api/ai/story — Gemini drafts a product origin story for an artisan. */
export const POST = route(async (request: Request) => {
  const artisan = await requireUser(request, ["artisan"]);
  rateLimit(request, "ai-story", 20, 60_000, artisan.id);
  const input = await parseBody(request, schema);

  const prompt = `Craft a compelling, authentic 2-3 sentence product origin bio for an upcycled artisan craft piece with these details:
- Product Title: ${input.title}
- Origin Festival: ${input.festival} (${input.country})
- Source Material Batch ID: ${input.batchId}
- Salvaged Material: ${input.materialType}
- Material Condition: ${input.condition}
- Material Diverted from Landfill: ${input.divertedKg} kg
- Upcycling Craft Method / Typology: ${input.craftTypology}
- Artisan Cooperative / Workshop: ${input.artisanWorkshop}

Guidelines:
1. Tell the journey from ceremonial festival salvage to handcrafted art.
2. Emphasize physical sustainability, cultural dignity, and zero-waste craftsmanship.
3. Keep it between 50 to 80 words. Direct, editorial tone. Do not invent facts beyond the details above.
4. Return ONLY valid JSON: {"story": "...", "suggestedTags": ["Tag1", "Tag2", "Tag3"], "headline": "A short headline"}`;

  const result = await generateJson<OriginStory>({
    system: SYSTEM_PROMPT,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    temperature: 0.7,
  });

  if (result) return ok({ ...result.data, isSample: false });
  if (DEMO_MODE) return ok({ ...sampleStory(input.festival, input.materialType, input.divertedKg), isSample: true });
  throw new HttpError(503, "The story writer is unavailable right now. Write the description yourself or try again later.");
});

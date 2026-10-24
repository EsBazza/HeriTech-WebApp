import { z } from "zod";
import { DEMO_MODE } from "@/lib/demo";
import { requireUser } from "@/lib/server/auth";
import { sampleStory, type OriginStory } from "@/lib/server/aiSamples";
import { generateJson } from "@/lib/server/gemini";
import { HttpError, ok, parseBody, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";

const SYSTEM_PROMPT =
  "You write short, factual product descriptions for HeriTech, a shop for handmade pieces made from material left over after festivals. Write plain, warm English. Use only the facts you are given: never invent techniques, traditions, certifications, people, places or numbers.";

/** A detail the artisan's form may leave empty; empty details are left out of the prompt rather than guessed. */
const detail = (max = 200) =>
  z
    .union([z.string(), z.number()])
    .nullish()
    .transform((v) => {
      const text = v == null ? "" : String(v).trim();
      return text ? text.slice(0, max) : null;
    });

const schema = z.object({
  title: detail(),
  festival: detail(),
  country: detail(80),
  batchId: detail(40),
  materialType: detail(),
  condition: detail(),
  divertedKg: detail(20),
  craftTypology: detail(),
  artisanWorkshop: detail(),
});

/** POST /api/ai/story — Gemini drafts a product description for an artisan to edit. */
export const POST = route(async (request: Request) => {
  const artisan = await requireUser(request, ["artisan"]);
  rateLimit(request, "ai-story", 20, 60_000, artisan.id);
  const input = await parseBody(request, schema);

  const facts = [
    ["Piece", input.title],
    ["Festival the material came from", input.festival],
    ["Country", input.country],
    ["Source batch", input.batchId],
    ["Material", input.materialType],
    ["Condition of the material when collected", input.condition],
    ["Material used in this piece", input.divertedKg && `${input.divertedKg} kg`],
    ["How it was made", input.craftTypology],
    ["Workshop", input.artisanWorkshop],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `- ${label}: ${value}`)
    .join("\n");

  const prompt = `Write a product description from these facts:
${facts}

Guidelines:
1. 2 or 3 sentences, 40 to 70 words: what the piece is, what it was made from and where that material came from.
2. Use only the facts above. If something isn't listed, leave it out rather than guessing.
3. No exclamation marks, no em dashes, no marketing superlatives.
4. Return ONLY valid JSON: {"story": "...", "suggestedTags": ["Tag1", "Tag2", "Tag3"], "headline": "A short headline"}`;

  const result = await generateJson<OriginStory>({
    system: SYSTEM_PROMPT,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    temperature: 0.4,
  });

  if (result) return ok({ ...result.data, isSample: false });
  if (DEMO_MODE) {
    return ok({ ...sampleStory(input.festival ?? "a festival", input.materialType ?? "festival material", input.divertedKg ?? "some"), isSample: true });
  }
  throw new HttpError(503, "The story writer is unavailable right now. Write the description yourself or try again later.");
});

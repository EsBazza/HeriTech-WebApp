import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { translateWithCache } from "@/lib/translation/google-translate";
import { ok, parseBody, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";

const LANGUAGE_CODES = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));
const languageCode = z.string().refine((code) => LANGUAGE_CODES.has(code), "Unsupported language.");
const snippet = z.string().max(5000);
/** Translation is billed per character, so one guest request may not ask for much. */
const MAX_TOTAL_CHARS = 20_000;

const schema = z.object({
  text: z
    .union([snippet, z.array(snippet).min(1).max(100)])
    .refine((t) => (Array.isArray(t) ? t.join("") : t).length <= MAX_TOTAL_CHARS, `Send at most ${MAX_TOTAL_CHARS} characters per request.`),
  targetLanguage: languageCode,
  sourceLanguage: z.union([languageCode, z.literal("auto")]).default("en"),
});

/**
 * POST /api/translate — translates UI text for the language picker.
 * Open to guests, so it is rate limited and capped at 100 strings and 20,000 characters per call.
 */
export const POST = route(async (request: Request) => {
  // Generous per IP: at a booth every visitor's phone shares the venue's one address.
  // Each call is still capped at 100 strings and 20,000 characters, and answers are cached.
  rateLimit(request, "translate", 600, 60_000);
  const { text, targetLanguage, sourceLanguage } = await parseBody(request, schema);
  const result = await translateWithCache({ text, targetLanguage, sourceLanguage });

  // `translation` / `translations` stay top-level because TranslationContext reads them there.
  return Response.json({
    success: result.success,
    translation: Array.isArray(text) ? result.translations : result.translations[0],
    translations: result.translations,
    error: result.error,
  });
});

/** GET /api/translate — the list of supported languages. */
export const GET = route(async () =>
  ok(SUPPORTED_LANGUAGES.map(({ code, name, nativeName, region, flag }) => ({ code, name, nativeName, region, flag })))
);

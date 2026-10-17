import "server-only";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 25_000;

/** Primary model first, then a fallback. Override with GEMINI_MODELS="model-a,model-b". */
function models(): string[] {
  const configured = process.env.GEMINI_MODELS?.split(",").map((m) => m.trim()).filter(Boolean);
  return configured?.length ? configured : ["gemini-3.5-flash-lite", "gemini-3.6-flash"];
}

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

export interface GeminiRequest {
  system: string;
  contents: { role: "user" | "model"; parts: Part[] }[];
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiResult {
  text: string;
  model: string;
}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Calls Gemini, trying each configured model in turn. Returns null when no key is
 * set or every model fails, so callers can show an honest "AI unavailable" state.
 */
export async function generate(request: GeminiRequest): Promise<GeminiResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: request.system }] },
    contents: request.contents,
    generationConfig: {
      temperature: request.temperature ?? 0.3,
      ...(request.maxOutputTokens ? { maxOutputTokens: request.maxOutputTokens } : {}),
      ...(request.json ? { response_mime_type: "application/json" } : {}),
    },
  });

  for (const model of models()) {
    try {
      const res = await fetch(`${API_BASE}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        console.warn(`[gemini] ${model} responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
        continue;
      }
      const data = await res.json();
      const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { text, model };
    } catch (error) {
      console.warn(`[gemini] ${model} failed:`, error);
    }
  }
  return null;
}

/** Like generate(), but parses the reply as JSON. Returns null on failure or invalid JSON. */
export async function generateJson<T>(request: Omit<GeminiRequest, "json">): Promise<{ data: T; model: string } | null> {
  const result = await generate({ ...request, json: true });
  if (!result) return null;
  try {
    return { data: JSON.parse(result.text) as T, model: result.model };
  } catch {
    console.warn(`[gemini] ${result.model} returned invalid JSON`);
    return null;
  }
}

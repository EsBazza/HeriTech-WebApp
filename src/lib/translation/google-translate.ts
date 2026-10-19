// Server-side translation: Google Cloud Translation first, Gemini as a fallback,
// then the bundled phrase dictionary.
import "server-only";
import { generateJson } from "@/lib/server/gemini";

export interface TranslationRequest {
  text: string | string[];
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslationResponse {
  translations: string[];
  detectedLanguage?: string;
  success: boolean;
  error?: string;
}

export interface BatchTranslationRequest {
  texts: Record<string, string>;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface BatchTranslationResponse {
  translations: Record<string, string>;
  success: boolean;
  error?: string;
}

export class TranslationCache {
  private static cache = new Map<string, { translation: string; timestamp: number }>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static getCacheKey(text: string, targetLang: string, sourceLang?: string): string {
    return `${sourceLang || 'auto'}:${targetLang}:${text}`;
  }

  static get(text: string, targetLang: string, sourceLang?: string): string | null {
    const key = this.getCacheKey(text, targetLang, sourceLang);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.translation;
  }

  static set(text: string, targetLang: string, translation: string, sourceLang?: string): void {
    const key = this.getCacheKey(text, targetLang, sourceLang);
    this.cache.set(key, {
      translation,
      timestamp: Date.now()
    });
  }

  static clear(): void {
    this.cache.clear();
  }

  static getSize(): number {
    return this.cache.size;
  }
}

// Direct REST Google Translate API call
async function fetchGoogleTranslateRest(
  texts: string[],
  targetLanguage: string,
  sourceLanguage = 'en'
): Promise<string[] | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey || apiKey.includes('YOUR_') || apiKey.length < 20) return null;

  try {
    const body: Record<string, any> = {
      q: texts,
      target: targetLanguage,
      format: 'text',
    };
    if (sourceLanguage && sourceLanguage !== 'auto') {
      body.source = sourceLanguage;
    }

    const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify(body),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data?.data?.translations && Array.isArray(data.data.translations)) {
      return data.data.translations.map((t: any) => t.translatedText);
    }
  } catch (err) {
    console.warn('Google Translate REST API call failed:', err);
  }
  return null;
}

// Fallback: Gemini translation of the whole batch in one call
async function fetchGeminiTranslate(texts: string[], targetLanguage: string): Promise<string[] | null> {
  const result = await generateJson<unknown>({
    system: "You are an expert multilingual translator for Pan-Asian cultural crafts. Reply with JSON only.",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Translate this JSON array of English strings into the language with code "${targetLanguage}". Return a JSON array of strings matching the input one-to-one.

${JSON.stringify(texts)}`,
          },
        ],
      },
    ],
    temperature: 0.1,
  });
  const parsed = result?.data;
  return Array.isArray(parsed) && parsed.length === texts.length ? parsed.map(String) : null;
}

// Translate single text or array of texts
export async function translateText({
  text,
  targetLanguage,
  sourceLanguage = 'auto'
}: TranslationRequest): Promise<TranslationResponse> {
  const textsToTranslate = Array.isArray(text) ? text : [text];
  
  if (textsToTranslate.length === 0) {
    return { translations: [], success: true };
  }

  if (targetLanguage === 'en') {
    return { translations: textsToTranslate, success: true };
  }

  // 1. Try Google Translate REST API
  const restTranslations = await fetchGoogleTranslateRest(textsToTranslate, targetLanguage, sourceLanguage);
  if (restTranslations && restTranslations.length === textsToTranslate.length) {
    return { translations: restTranslations, success: true };
  }

  // 2. Try Gemini AI Translation
  const geminiTranslations = await fetchGeminiTranslate(textsToTranslate, targetLanguage);
  if (geminiTranslations && geminiTranslations.length === textsToTranslate.length) {
    return { translations: geminiTranslations, success: true };
  }

  // 3. Both services failed: keep the English text rather than guess.
  return { translations: textsToTranslate, success: false, error: 'Translation is unavailable right now.' };
}

// Translate object with key-value pairs
export async function translateBatch({
  texts,
  targetLanguage,
  sourceLanguage = 'auto'
}: BatchTranslationRequest): Promise<BatchTranslationResponse> {
  const keys = Object.keys(texts);
  const values = Object.values(texts);
  
  if (values.length === 0) {
    return { translations: {}, success: true };
  }

  const response = await translateText({
    text: values,
    targetLanguage,
    sourceLanguage
  });

  const translatedObject: Record<string, string> = {};
  keys.forEach((key, index) => {
    translatedObject[key] = response.translations[index] || texts[key];
  });

  return {
    translations: translatedObject,
    success: true
  };
}

// Enhanced translation with caching
export async function translateWithCache({
  text,
  targetLanguage,
  sourceLanguage = 'auto'
}: TranslationRequest): Promise<TranslationResponse> {
  if (Array.isArray(text)) {
    const results: string[] = [];
    const textsToTranslate: string[] = [];
    const indices: number[] = [];

    text.forEach((t, index) => {
      const cached = TranslationCache.get(t, targetLanguage, sourceLanguage);
      if (cached) {
        results[index] = cached;
      } else {
        textsToTranslate.push(t);
        indices.push(index);
      }
    });

    if (textsToTranslate.length > 0) {
      const response = await translateText({
        text: textsToTranslate,
        targetLanguage,
        sourceLanguage
      });
      // Never cache a failed attempt as if it were a translation.
      if (!response.success) return { translations: text, success: false, error: response.error };

      response.translations.forEach((translation: string, i: number) => {
        const originalIndex = indices[i];
        results[originalIndex] = translation;
        TranslationCache.set(text[originalIndex], targetLanguage, translation, sourceLanguage);
      });
    }

    return {
      translations: results,
      success: true
    };
  }

  const cached = TranslationCache.get(text, targetLanguage, sourceLanguage);
  if (cached) {
    return {
      translations: [cached],
      success: true
    };
  }

  const response = await translateText({ text, targetLanguage, sourceLanguage });
  if (response.success && response.translations[0]) {
    TranslationCache.set(text, targetLanguage, response.translations[0], sourceLanguage);
  }
  return response;
}

// Google Cloud Translation API configuration and utilities
import { Translate } from '@google-cloud/translate/build/src/v2';

// Initialize Google Translate client
let translateClient: Translate | null = null;

function initializeTranslateClient() {
  if (!translateClient) {
    // For development, we'll use API key authentication
    // In production, you should use service account authentication
    translateClient = new Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });
  }
  return translateClient;
}

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
  texts: Record<string, string>; // key-value pairs to translate
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface BatchTranslationResponse {
  translations: Record<string, string>;
  success: boolean;
  error?: string;
}

// Translate single text or array of texts
export async function translateText({
  text,
  targetLanguage,
  sourceLanguage = 'auto'
}: TranslationRequest): Promise<TranslationResponse> {
  try {
    const client = initializeTranslateClient();
    
    const textsToTranslate = Array.isArray(text) ? text : [text];
    
    const [translations, metadata] = await client.translate(textsToTranslate, {
      to: targetLanguage,
      from: sourceLanguage === 'auto' ? undefined : sourceLanguage
    });

    const translatedTexts = Array.isArray(translations) ? translations : [translations];

    return {
      translations: translatedTexts,
      detectedLanguage: metadata?.data?.translations?.[0]?.detectedSourceLanguage,
      success: true
    };
  } catch (error) {
    console.error('Google Translate API error:', error);
    return {
      translations: Array.isArray(text) ? text : [text],
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed'
    };
  }
}

// Translate object with key-value pairs (useful for JSON translation)
export async function translateBatch({
  texts,
  targetLanguage,
  sourceLanguage = 'auto'
}: BatchTranslationRequest): Promise<BatchTranslationResponse> {
  try {
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

    if (!response.success) {
      return {
        translations: texts,
        success: false,
        error: response.error
      };
    }

    const translatedObject: Record<string, string> = {};
    keys.forEach((key, index) => {
      translatedObject[key] = response.translations[index] || texts[key];
    });

    return {
      translations: translatedObject,
      success: true
    };
  } catch (error) {
    console.error('Batch translation error:', error);
    return {
      translations: texts,
      success: false,
      error: error instanceof Error ? error.message : 'Batch translation failed'
    };
  }
}

// Get supported languages from Google Translate
export async function getSupportedLanguages(): Promise<{
  languages: Array<{ code: string; name: string }>;
  success: boolean;
  error?: string;
}> {
  try {
    const client = initializeTranslateClient();
    const [languages] = await client.getLanguages();
    
    return {
      languages: languages.map(lang => ({
        code: lang.code,
        name: lang.name
      })),
      success: true
    };
  } catch (error) {
    console.error('Error fetching supported languages:', error);
    return {
      languages: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch languages'
    };
  }
}

// Detect language of text
export async function detectLanguage(text: string): Promise<{
  language: string;
  confidence: number;
  success: boolean;
  error?: string;
}> {
  try {
    const client = initializeTranslateClient();
    const [detection] = await client.detect(text);
    
    return {
      language: detection.language,
      confidence: detection.confidence,
      success: true
    };
  } catch (error) {
    console.error('Language detection error:', error);
    return {
      language: 'en',
      confidence: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Language detection failed'
    };
  }
}

// Utility to clean text for translation (remove HTML, normalize spaces)
export function cleanTextForTranslation(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Utility to preserve HTML structure during translation
export function translateWithHtmlPreservation(html: string, translation: string): string {
  // Simple approach - for more complex HTML, use a proper HTML parser
  const textContent = html.replace(/<[^>]*>/g, '');
  if (textContent.trim() === '') return html;
  
  return html.replace(textContent.trim(), translation);
}

// Rate limiting and caching utilities
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

// Enhanced translation with caching and fallback to mock
export async function translateWithCache({
  text,
  targetLanguage,
  sourceLanguage = 'auto'
}: TranslationRequest): Promise<TranslationResponse> {
  // Check if we should use mock translation
  const { shouldUseMockTranslation, mockTranslateText } = await import('./mock-translate');
  
  if (shouldUseMockTranslation()) {
    console.log(`Using mock translation for ${targetLanguage}`);
    return mockTranslateText({ text, targetLanguage, sourceLanguage });
  }

  // Handle array of texts
  if (Array.isArray(text)) {
    const results: string[] = [];
    const textsToTranslate: string[] = [];
    const indices: number[] = [];

    // Check cache for each text
    text.forEach((t, index) => {
      const cached = TranslationCache.get(t, targetLanguage, sourceLanguage);
      if (cached) {
        results[index] = cached;
      } else {
        textsToTranslate.push(t);
        indices.push(index);
      }
    });

    // Translate uncached texts
    if (textsToTranslate.length > 0) {
      const response = await translateText({
        text: textsToTranslate,
        targetLanguage,
        sourceLanguage
      });

      if (response.success) {
        response.translations.forEach((translation, i) => {
          const originalIndex = indices[i];
          results[originalIndex] = translation;
          TranslationCache.set(text[originalIndex], targetLanguage, translation, sourceLanguage);
        });
      } else {
        // Fallback to mock translation
        const mockResponse = await mockTranslateText({ 
          text: textsToTranslate, 
          targetLanguage, 
          sourceLanguage 
        });
        
        mockResponse.translations.forEach((translation, i) => {
          const originalIndex = indices[i];
          results[originalIndex] = translation;
        });
      }
    }

    return {
      translations: results,
      success: true
    };
  }

  // Handle single text
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
    return response;
  } else {
    // Fallback to mock translation
    const mockResponse = await mockTranslateText({ text, targetLanguage, sourceLanguage });
    if (mockResponse.success && mockResponse.translations[0]) {
      TranslationCache.set(text, targetLanguage, mockResponse.translations[0], sourceLanguage);
    }
    return mockResponse;
  }
}
// Translation utilities and helper functions
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '@/lib/languages';

// Text processing utilities
export class TextProcessor {
  // Extract translatable text from complex objects
  static extractTranslatableText(obj: any, prefix = ''): Record<string, string> {
    const texts: Record<string, string> = {};
    
    if (typeof obj === 'string') {
      if (obj.trim().length > 0 && !this.isNonTranslatable(obj)) {
        texts[prefix || 'text'] = obj;
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const extracted = this.extractTranslatableText(item, `${prefix}[${index}]`);
        Object.assign(texts, extracted);
      });
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        const extracted = this.extractTranslatableText(value, newPrefix);
        Object.assign(texts, extracted);
      });
    }
    
    return texts;
  }

  // Reconstruct object with translated text
  static reconstructWithTranslations(
    original: any, 
    translations: Record<string, string>, 
    prefix = ''
  ): any {
    if (typeof original === 'string') {
      const key = prefix || 'text';
      return translations[key] || original;
    } else if (Array.isArray(original)) {
      return original.map((item, index) => 
        this.reconstructWithTranslations(item, translations, `${prefix}[${index}]`)
      );
    } else if (original && typeof original === 'object') {
      const reconstructed: any = {};
      Object.entries(original).forEach(([key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        reconstructed[key] = this.reconstructWithTranslations(value, translations, newPrefix);
      });
      return reconstructed;
    }
    
    return original;
  }

  // Check if text should not be translated (URLs, emails, etc.)
  static isNonTranslatable(text: string): boolean {
    const nonTranslatablePatterns = [
      /^https?:\/\//, // URLs
      /^[\w.-]+@[\w.-]+\.\w+$/, // Email addresses
      /^\+?[\d\s-()]+$/, // Phone numbers
      /^#[a-fA-F0-9]{3,8}$/, // Color codes
      /^\d+(\.\d+)?[%$€£¥₹₩¥₫₱₨₦₴₲₵₡₪₸₼₽₿]?$/, // Numbers with currency
      /^[A-Z]{2,10}$/, // Abbreviations/codes
      /^[\d\s\-+()]+$/, // Numbers and basic punctuation
    ];

    return nonTranslatablePatterns.some(pattern => pattern.test(text.trim()));
  }

  // Clean text for better translation quality
  static cleanForTranslation(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^\s+|\s+$/g, '') // Trim
      .replace(/([.!?])\s*$/, '$1') // Ensure proper sentence ending
      .replace(/^([a-z])/, (match) => match.toUpperCase()); // Capitalize first letter
  }

  // Split long text into chunks for better translation
  static splitIntoChunks(text: string, maxLength = 1000): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    const sentences = text.split(/([.!?]+\s*)/);
    let currentChunk = '';

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] + (sentences[i + 1] || '');
      
      if (currentChunk.length + sentence.length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }
}

// Translation quality and validation
export class TranslationValidator {
  // Check if translation looks reasonable
  static isReasonableTranslation(original: string, translated: string, targetLang: string): boolean {
    // Basic sanity checks
    if (!translated || translated === original) return false;
    
    // Check length ratio (translated text shouldn't be drastically different in length)
    const lengthRatio = translated.length / original.length;
    if (lengthRatio < 0.2 || lengthRatio > 5) return false;

    // Check for proper script usage (basic check)
    const language = getLanguageByCode(targetLang);
    if (language && this.hasExpectedScript(translated, targetLang)) {
      return true;
    }

    return true; // Default to accepting translation
  }

  // Check if text uses expected script/characters for the target language
  static hasExpectedScript(text: string, languageCode: string): boolean {
    const scriptChecks: Record<string, RegExp> = {
      'zh-CN': /[\u4e00-\u9fff]/, // Chinese characters
      'zh-TW': /[\u4e00-\u9fff]/, // Chinese characters  
      'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/, // Hiragana, Katakana, Kanji
      'ko': /[\uac00-\ud7af]/, // Hangul
      'th': /[\u0e00-\u0e7f]/, // Thai
      'hi': /[\u0900-\u097f]/, // Devanagari
      'bn': /[\u0980-\u09ff]/, // Bengali
      'ta': /[\u0b80-\u0bff]/, // Tamil
      'te': /[\u0c00-\u0c7f]/, // Telugu
      'my': /[\u1000-\u109f]/, // Myanmar
      'km': /[\u1780-\u17ff]/, // Khmer
      'lo': /[\u0e80-\u0eff]/, // Lao
      'si': /[\u0d80-\u0dff]/, // Sinhala
      'ar': /[\u0600-\u06ff]/, // Arabic (for Urdu)
    };

    const pattern = scriptChecks[languageCode];
    return pattern ? pattern.test(text) : true;
  }
}

// Translation statistics and analytics
export class TranslationStats {
  private static stats = {
    totalTranslations: 0,
    byLanguage: new Map<string, number>(),
    averageLatency: 0,
    cacheHits: 0,
    errors: 0
  };

  static recordTranslation(targetLang: string, latency: number, cached = false) {
    this.stats.totalTranslations++;
    this.stats.byLanguage.set(targetLang, (this.stats.byLanguage.get(targetLang) || 0) + 1);
    
    if (cached) {
      this.stats.cacheHits++;
    } else {
      // Update rolling average
      this.stats.averageLatency = 
        (this.stats.averageLatency + latency) / 2;
    }
  }

  static recordError(targetLang: string) {
    this.stats.errors++;
  }

  static getStats() {
    return {
      ...this.stats,
      byLanguage: Object.fromEntries(this.stats.byLanguage),
      cacheHitRate: this.stats.totalTranslations > 0 
        ? (this.stats.cacheHits / this.stats.totalTranslations) * 100 
        : 0
    };
  }

  static reset() {
    this.stats = {
      totalTranslations: 0,
      byLanguage: new Map<string, number>(),
      averageLatency: 0,
      cacheHits: 0,
      errors: 0
    };
  }
}

// Localization helpers
export class LocalizationHelper {
  // Format numbers according to locale
  static formatNumber(number: number, locale: string): string {
    try {
      return new Intl.NumberFormat(locale).format(number);
    } catch {
      return number.toString();
    }
  }

  // Format currency according to locale
  static formatCurrency(amount: number, currency: string, locale: string): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  // Format dates according to locale
  static formatDate(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
    try {
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      return new Intl.DateTimeFormat(locale, options || defaultOptions).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  }

  // Format relative time (e.g., "2 days ago")
  static formatRelativeTime(date: Date, locale: string): string {
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const now = new Date();
      const diffInSeconds = (date.getTime() - now.getTime()) / 1000;
      const diffInMinutes = diffInSeconds / 60;
      const diffInHours = diffInMinutes / 60;
      const diffInDays = diffInHours / 24;

      if (Math.abs(diffInDays) >= 1) {
        return rtf.format(Math.round(diffInDays), 'day');
      } else if (Math.abs(diffInHours) >= 1) {
        return rtf.format(Math.round(diffInHours), 'hour');
      } else {
        return rtf.format(Math.round(diffInMinutes), 'minute');
      }
    } catch {
      return date.toLocaleDateString();
    }
  }

  // Get text direction for language
  static getTextDirection(languageCode: string): 'ltr' | 'rtl' {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(languageCode.split('-')[0]) ? 'rtl' : 'ltr';
  }
}

// Translation middleware for API responses
export class TranslationMiddleware {
  static async translateApiResponse(
    data: any,
    targetLanguage: string,
    fieldsToTranslate: string[] = []
  ): Promise<any> {
    if (targetLanguage === 'en' || !data) return data;

    try {
      // Extract translatable fields
      const textsToTranslate: Record<string, string> = {};
      
      if (fieldsToTranslate.length > 0) {
        fieldsToTranslate.forEach(field => {
          if (data[field] && typeof data[field] === 'string') {
            textsToTranslate[field] = data[field];
          }
        });
      } else {
        // Auto-detect translatable fields
        Object.assign(textsToTranslate, TextProcessor.extractTranslatableText(data));
      }

      // Translate the texts (would call actual translation service)
      // For now, return original data
      return data;
    } catch (error) {
      console.error('Translation middleware error:', error);
      return data; // Return original data on error
    }
  }
}

// Language detection utilities
export class LanguageDetector {
  // Detect language from text patterns (basic heuristics)
  static detectLanguageHeuristic(text: string): string {
    const patterns: Record<string, RegExp[]> = {
      'zh': [/[\u4e00-\u9fff]/], // Chinese characters
      'ja': [/[\u3040-\u309f]/, /[\u30a0-\u30ff]/], // Hiragana, Katakana
      'ko': [/[\uac00-\ud7af]/], // Hangul
      'th': [/[\u0e00-\u0e7f]/], // Thai
      'hi': [/[\u0900-\u097f]/], // Devanagari
      'ar': [/[\u0600-\u06ff]/], // Arabic
      'bn': [/[\u0980-\u09ff]/], // Bengali
    };

    for (const [lang, regexes] of Object.entries(patterns)) {
      if (regexes.some(regex => regex.test(text))) {
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  // Detect if text needs translation
  static needsTranslation(text: string, targetLanguage: string): boolean {
    if (targetLanguage === 'en') return false;
    if (!text || text.trim().length === 0) return false;
    if (TextProcessor.isNonTranslatable(text)) return false;
    
    const detectedLang = this.detectLanguageHeuristic(text);
    return detectedLang !== targetLanguage;
  }
}
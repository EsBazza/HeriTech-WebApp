"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getBrowserLanguage,
  getLanguageByCode,
  type Language,
} from "@/lib/languages";

interface TranslationContextType {
  currentLanguage: Language;
  isLoading: boolean;
  changeLanguage: (languageCode: string) => Promise<void>;
  translate: (key: string, fallback?: string) => Promise<string>;
  translateText: (text: string, targetLang?: string) => Promise<string>;
  translateSync: (text: string) => string;
  getSupportedLanguages: () => Language[];
  isRTL: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date) => string;
  formatNumber: (number: number) => string;
  getRegionLanguages: (region: string) => Language[];
  translationCache: Map<string, string>;
  clearCache: () => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

// Cookie/storage keys
const LANGUAGE_COOKIE = "heritech-language";
const CACHE_STORAGE_KEY = "heritech-translation-cache";
const CACHE_LANG_KEY = "heritech-translation-cache-lang";

interface TranslationProviderProps {
  children: ReactNode;
}

// Global in-memory cache (persists across re-renders, shared across all components)
const globalCache = new Map<string, string>();
// Registry of all texts that need translation
const translationRegistry = new Set<string>();

/** Register a text string for batch translation */
export function registerTextForTranslation(text: string) {
  if (text && text.trim().length > 0) {
    translationRegistry.add(text);
  }
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [currentLanguage, setCurrentLanguage] =
    useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);
  // This state is only used to trigger re-renders when the cache is populated
  const [cacheVersion, setCacheVersion] = useState(0);

  // Expose the global cache as a Map reference
  const translationCache = globalCache;

  // Load saved cache from sessionStorage
  const loadCacheFromStorage = useCallback((langCode: string) => {
    try {
      const savedLang = sessionStorage.getItem(CACHE_LANG_KEY);
      if (savedLang !== langCode) return false;

      const saved = sessionStorage.getItem(CACHE_STORAGE_KEY);
      if (!saved) return false;

      const entries: [string, string][] = JSON.parse(saved);
      globalCache.clear();
      entries.forEach(([k, v]) => globalCache.set(k, v));
      return true;
    } catch {
      return false;
    }
  }, []);

  // Save cache to sessionStorage
  const saveCacheToStorage = useCallback((langCode: string) => {
    try {
      const entries = Array.from(globalCache.entries());
      sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
      sessionStorage.setItem(CACHE_LANG_KEY, langCode);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Batch translate all registered strings + any additional texts
  const batchTranslate = useCallback(
    async (langCode: string, extraTexts: string[] = []) => {
      if (langCode === "en") {
        globalCache.clear();
        setCacheVersion((v) => v + 1);
        return;
      }

      const allTexts = Array.from(
        new Set([...Array.from(translationRegistry), ...extraTexts])
      ).filter((t) => t && t.trim().length > 0 && !globalCache.has(t));

      if (allTexts.length === 0) {
        setCacheVersion((v) => v + 1);
        return;
      }

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: allTexts,
            targetLanguage: langCode,
            sourceLanguage: "en",
            type: "single",
          }),
        });

        const data = await response.json();
        if (data.success && Array.isArray(data.translations)) {
          data.translations.forEach((translated: string, i: number) => {
            if (translated && allTexts[i]) {
              globalCache.set(allTexts[i], translated);
            }
          });
        }
      } catch (err) {
        console.warn("Batch translation failed:", err);
      }

      setCacheVersion((v) => v + 1);
    },
    []
  );

  // Initialize language from cookies or browser preference
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        let langCode = DEFAULT_LANGUAGE.code;

        const savedLanguage = Cookies.get(LANGUAGE_COOKIE);
        if (savedLanguage) {
          const language = getLanguageByCode(savedLanguage);
          if (language) {
            langCode = language.code;
            setCurrentLanguage(language);
          }
        } else {
          const browserLang = getBrowserLanguage();
          const language = getLanguageByCode(browserLang);
          if (language) {
            langCode = language.code;
            setCurrentLanguage(language);
            Cookies.set(LANGUAGE_COOKIE, language.code, { expires: 365 });
          }
        }

        if (typeof document !== "undefined") {
          const lang = getLanguageByCode(langCode);
          document.documentElement.lang = langCode;
          document.documentElement.dir = lang?.rtl ? "rtl" : "ltr";
        }

        if (langCode !== "en") {
          const loaded = loadCacheFromStorage(langCode);
          if (!loaded) {
            await batchTranslate(langCode);
            saveCacheToStorage(langCode);
          } else {
            setCacheVersion((v) => v + 1);
          }
        }
      } catch (error) {
        console.error("Failed to initialize language:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeLanguage = useCallback(
    async (languageCode: string): Promise<void> => {
      setIsLoading(true);
      try {
        const language = getLanguageByCode(languageCode);
        if (!language) {
          throw new Error(`Unsupported language: ${languageCode}`);
        }

        setCurrentLanguage(language);
        Cookies.set(LANGUAGE_COOKIE, language.code, { expires: 365 });

        if (typeof document !== "undefined") {
          document.documentElement.lang = language.code;
          document.documentElement.dir = language.rtl ? "rtl" : "ltr";
        }

        globalCache.clear();
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(CACHE_STORAGE_KEY);
          sessionStorage.removeItem(CACHE_LANG_KEY);
        }

        if (language.code !== "en") {
          await batchTranslate(language.code);
          saveCacheToStorage(language.code);
        } else {
          setCacheVersion((v) => v + 1);
        }
      } catch (error) {
        console.error("Failed to change language:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [batchTranslate, loadCacheFromStorage, saveCacheToStorage]
  );

  /** Synchronous translation lookup — returns cached value or original text */
  const translateSync = useCallback(
    (text: string): string => {
      if (!text) return text;
      if (currentLanguage.code === "en") return text;
      return globalCache.get(text) || text;
    },
    // cacheVersion in deps ensures re-render when cache is populated
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentLanguage.code, cacheVersion]
  );

  /** Async translation — checks cache first, falls back to API */
  const translateText = useCallback(
    async (text: string, targetLang?: string): Promise<string> => {
      const target = targetLang || currentLanguage.code;
      if (!text) return text;
      if (target === "en") return text;

      // Check cache
      const cached = globalCache.get(text);
      if (cached) return cached;

      // Register and batch translate
      registerTextForTranslation(text);
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            targetLanguage: target,
            sourceLanguage: "en",
          }),
        });

        const data = await response.json();
        if (data.success && data.translation) {
          globalCache.set(text, data.translation);
          setCacheVersion((v) => v + 1);
          return data.translation;
        }
      } catch (err) {
        console.warn("Translation failed:", err);
      }

      return text;
    },
    [currentLanguage.code]
  );

  const translate = useCallback(
    async (key: string, fallback?: string): Promise<string> => {
      return translateSync(fallback || key) || fallback || key;
    },
    [translateSync]
  );

  const getSupportedLanguages = useCallback((): Language[] => {
    return SUPPORTED_LANGUAGES;
  }, []);

  const getRegionLanguages = useCallback((region: string): Language[] => {
    return SUPPORTED_LANGUAGES.filter((lang) => lang.region === region);
  }, []);

  const formatCurrency = useCallback(
    (amount: number, currency?: string): string => {
      const currencyCode = currency || getCurrencyForLanguage(currentLanguage.code);
      try {
        return new Intl.NumberFormat(currentLanguage.code, {
          style: "currency",
          currency: currencyCode,
        }).format(amount);
      } catch {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
      }
    },
    [currentLanguage.code]
  );

  const formatDate = useCallback(
    (date: Date): string => {
      try {
        return new Intl.DateTimeFormat(currentLanguage.code, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(date);
      } catch {
        return date.toLocaleDateString("en-US");
      }
    },
    [currentLanguage.code]
  );

  const formatNumber = useCallback(
    (number: number): string => {
      try {
        return new Intl.NumberFormat(currentLanguage.code).format(number);
      } catch {
        return number.toLocaleString("en-US");
      }
    },
    [currentLanguage.code]
  );

  const clearCache = useCallback(() => {
    globalCache.clear();
    try {
      sessionStorage.removeItem(CACHE_STORAGE_KEY);
      sessionStorage.removeItem(CACHE_LANG_KEY);
    } catch {}
    setCacheVersion((v) => v + 1);
  }, []);

  const value: TranslationContextType = {
    currentLanguage,
    isLoading,
    changeLanguage,
    translate,
    translateText,
    translateSync,
    getSupportedLanguages,
    isRTL: currentLanguage.rtl || false,
    formatCurrency,
    formatDate,
    formatNumber,
    getRegionLanguages,
    translationCache,
    clearCache,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

// Custom hook to use the translation context
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}

// Custom hook for real-time text translation
export function useTextTranslation(
  text: string,
  options?: {
    enabled?: boolean;
    targetLanguage?: string;
  }
) {
  const { translateSync, translateText, currentLanguage } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);

  // Register text for future batch translation
  useEffect(() => {
    if (text) registerTextForTranslation(text);
  }, [text]);

  const shouldTranslate =
    options?.enabled !== false &&
    (options?.targetLanguage || currentLanguage.code) !== "en";

  // First try synchronous cache lookup — this is instant
  const cachedResult = shouldTranslate ? translateSync(text) : text;
  const isCached = cachedResult !== text && shouldTranslate;

  // Only call async if not cached
  const [asyncResult, setAsyncResult] = useState<string>(cachedResult);
  const prevLangRef = useRef(currentLanguage.code);
  const prevTextRef = useRef(text);

  useEffect(() => {
    const langChanged = prevLangRef.current !== currentLanguage.code;
    const textChanged = prevTextRef.current !== text;
    prevLangRef.current = currentLanguage.code;
    prevTextRef.current = text;

    if (!shouldTranslate) {
      setAsyncResult(text);
      return;
    }

    // Use cached value synchronously
    const cached = translateSync(text);
    if (cached !== text) {
      setAsyncResult(cached);
      return;
    }

    // Fall back to async
    setIsTranslating(true);
    translateText(text, options?.targetLanguage)
      .then((result) => {
        setAsyncResult(result);
      })
      .catch(() => setAsyncResult(text))
      .finally(() => setIsTranslating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, currentLanguage.code, options?.targetLanguage, options?.enabled]);

  // Return cached synchronously if available, otherwise async result
  return {
    translatedText: isCached ? cachedResult : asyncResult,
    isTranslating: !isCached && isTranslating,
  };
}

// Helper function to get currency for a language
function getCurrencyForLanguage(languageCode: string): string {
  const currencyMap: Record<string, string> = {
    "zh-CN": "CNY",
    "zh-TW": "TWD",
    ja: "JPY",
    ko: "KRW",
    th: "THB",
    vi: "VND",
    id: "IDR",
    ms: "MYR",
    tl: "PHP",
    hi: "INR",
    bn: "BDT",
    ur: "PKR",
    si: "LKR",
    ne: "NPR",
  };

  return currencyMap[languageCode] || "USD";
}
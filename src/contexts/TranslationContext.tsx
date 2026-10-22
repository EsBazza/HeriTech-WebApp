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
  currentCurrency: string;
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
// Strings the server couldn't translate for the current language; not retried until the language changes.
const failedTexts = new Set<string>();
// Strings waiting for the next batch request.
const pendingTexts = new Set<string>();
/** At most this many strings per /api/translate call (the route caps it too). */
const BATCH_SIZE = 100;
const FLUSH_DELAY_MS = 150;

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

  // One queue for every component: misses are collected, then sent in batches, one
  // request at a time. Re-renders happen only when new translations were stored.
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const queueLang = useRef<string>(DEFAULT_LANGUAGE.code);

  const flushQueue = useCallback(async () => {
    flushTimer.current = null;
    if (inFlight.current) return;
    const langCode = queueLang.current;
    if (langCode === "en") {
      pendingTexts.clear();
      return;
    }
    const batch = [...pendingTexts].filter((t) => !globalCache.has(t) && !failedTexts.has(t)).slice(0, BATCH_SIZE);
    batch.forEach((t) => pendingTexts.delete(t));
    if (batch.length === 0) return;

    inFlight.current = true;
    let stored = 0;
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: batch, targetLanguage: langCode, sourceLanguage: "en" }),
      });
      const data = await response.json().catch(() => null);
      // The language may have changed while this request was out; drop stale answers.
      if (queueLang.current === langCode && data?.success && Array.isArray(data.translations)) {
        data.translations.forEach((translated: string, i: number) => {
          if (translated && batch[i]) {
            globalCache.set(batch[i], translated);
            stored++;
          }
        });
      }
    } catch (err) {
      console.warn("Batch translation failed:", err);
    } finally {
      inFlight.current = false;
    }

    if (queueLang.current === langCode) {
      batch.filter((t) => !globalCache.has(t)).forEach((t) => failedTexts.add(t));
      if (stored > 0) {
        saveCacheToStorage(langCode);
        setCacheVersion((v) => v + 1);
      }
    }
    if (pendingTexts.size > 0) flushTimer.current = setTimeout(flushQueue, FLUSH_DELAY_MS);
  }, [saveCacheToStorage]);

  const queueTranslation = useCallback(
    (texts: Iterable<string>) => {
      if (queueLang.current === "en" || typeof window === "undefined") return;
      for (const t of texts) {
        if (t && t.trim() && !globalCache.has(t) && !failedTexts.has(t)) pendingTexts.add(t);
      }
      if (pendingTexts.size > 0 && !flushTimer.current) flushTimer.current = setTimeout(flushQueue, FLUSH_DELAY_MS);
    },
    [flushQueue]
  );

  /** Switches the queue to a language and asks for everything registered so far. */
  const startLanguage = useCallback(
    (langCode: string) => {
      queueLang.current = langCode;
      failedTexts.clear();
      pendingTexts.clear();
      if (langCode !== "en") queueTranslation(translationRegistry);
    },
    [queueTranslation]
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

        // Fetch live exchange rates in parallel with translation init
        fetchExchangeRates().then(() => {
          // Trigger a re-render so formatCurrency picks up the live rates
          setCacheVersion((v) => v + 1);
        });

        if (langCode !== "en") loadCacheFromStorage(langCode);
        startLanguage(langCode);
        setCacheVersion((v) => v + 1);
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

        // Show English straight away; translations fill in as they arrive.
        setCacheVersion((v) => v + 1);
        setIsLoading(false);

        // Fetch any un-cached strings in the background without blocking the UI
        startLanguage(language.code);
      } catch (error) {
        console.error("Failed to change language:", error);
        setIsLoading(false);
        throw error;
      }
    },
    [startLanguage]
  );

  /** Synchronous translation lookup: returns cached value or original text */
  const translateSync = useCallback(
    (text: string): string => {
      if (!text || typeof text !== "string") return text;
      registerTextForTranslation(text);
      if (currentLanguage.code === "en") return text;

      const cached = globalCache.get(text);
      if (cached) return cached;

      // Queued for the next batch request; failed strings are not retried.
      queueTranslation([text]);
      return text;
    },
    // cacheVersion in deps ensures re-render when cache is populated
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentLanguage.code, cacheVersion, queueTranslation]
  );

  /** Async translation: checks cache first, falls back to API */
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
    (amountUSD: number, currency?: string): string => {
      const currencyCode = currency || getCurrencyForLanguage(currentLanguage.code);
      // Convert from USD base price to the target currency
      const convertedAmount = currency
        ? amountUSD // If an explicit currency is provided, assume amount is already in that currency
        : convertFromUSD(amountUSD, currencyCode);
      try {
        return new Intl.NumberFormat(currentLanguage.code, {
          style: "currency",
          currency: currencyCode,
          maximumFractionDigits: currencyCode === "JPY" || currencyCode === "KRW" || currencyCode === "VND" || currencyCode === "IDR" ? 0 : 2,
        }).format(convertedAmount);
      } catch {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amountUSD);
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
    failedTexts.clear();
    try {
      sessionStorage.removeItem(CACHE_STORAGE_KEY);
      sessionStorage.removeItem(CACHE_LANG_KEY);
    } catch {}
    setCacheVersion((v) => v + 1);
  }, []);

  const value: TranslationContextType = {
    currentLanguage,
    currentCurrency: getCurrencyForLanguage(currentLanguage.code),
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

// Custom hook for real-time text translation. It reads the shared cache and queues
// misses for the provider's batch request, so many elements never mean many requests.
export function useTextTranslation(
  text: string,
  options?: {
    enabled?: boolean;
    targetLanguage?: string;
  }
) {
  const { translateSync, currentLanguage } = useTranslation();

  // Register text for future batch translation
  useEffect(() => {
    if (text) registerTextForTranslation(text);
  }, [text]);

  const shouldTranslate = options?.enabled !== false && (options?.targetLanguage || currentLanguage.code) !== "en";
  const translatedText = shouldTranslate ? translateSync(text) : text;

  return {
    translatedText,
    isTranslating: shouldTranslate && translatedText === text,
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
    my: "MMK",
    km: "KHR",
    lo: "LAK",
    ta: "INR",
    te: "INR",
    kk: "KZT",
    ky: "KGS",
    uz: "UZS",
  };

  return currencyMap[languageCode] || "USD";
}

/**
 * Fallback USD-based exchange rates used when the live API is unreachable.
 * These approximate rates keep pricing functional offline or during API errors.
 */
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, CNY: 7.25, TWD: 32.5, JPY: 149.5, KRW: 1330,
  THB: 36.2, VND: 24500, IDR: 15800, MYR: 4.72, PHP: 56.5,
  INR: 83.5, BDT: 110, PKR: 280, LKR: 325, NPR: 133,
  MMK: 2100, KHR: 4100, LAK: 21000, KZT: 460, KGS: 89, UZS: 12600,
};

/**
 * Module-level live rates cache — shared across all instances so we only
 * fetch once per session (the API route also caches server-side for 1 hour).
 */
let liveRates: Record<string, number> = { ...FALLBACK_RATES };
let ratesFetched = false;

/** Fetch live exchange rates from the internal API route */
export async function fetchExchangeRates(): Promise<void> {
  if (ratesFetched) return;
  try {
    const res = await fetch("/api/exchange-rates");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && data.rates) {
      liveRates = { ...FALLBACK_RATES, ...data.rates }; // merge so no currency is ever missing
      ratesFetched = true;
    }
  } catch (err) {
    console.warn("[exchange-rates] Using fallback rates:", err);
    // liveRates already holds FALLBACK_RATES — no action needed
  }
}

/** Convert a USD amount to the target currency using live (or fallback) rates */
export function convertFromUSD(amountUSD: number, targetCurrency: string): number {
  const rate = liveRates[targetCurrency] ?? 1;
  return amountUSD * rate;
}
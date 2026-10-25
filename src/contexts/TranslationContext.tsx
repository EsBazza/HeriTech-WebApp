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
  /** Translates a whole sentence with {placeholders}, then fills them in: t("Only {count} left", { count: 3 }). */
  translateTemplate: (template: string, values: Record<string, string | number>) => string;
  getSupportedLanguages: () => Language[];
  isRTL: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  /** "October 24, 2026"; pass month "short" for tight spaces ("Oct 24, 2026"). */
  formatDate: (date: Date, month?: "long" | "short") => string;
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
/** Translations are kept per language in localStorage, so a return visit (or switching back) is instant. */
const CACHE_PREFIX = "heritech-tx-v1:";
/** Keep the stored cache bounded; the oldest entries are dropped first. */
const CACHE_MAX_ENTRIES = 3000;

interface TranslationProviderProps {
  children: ReactNode;
}

// Global in-memory cache (persists across re-renders, shared across all components)
const globalCache = new Map<string, string>();
// Registry of all texts that need translation
const translationRegistry = new Set<string>();
// Strings the server still couldn't translate after every retry; not asked again until the language changes.
const failedTexts = new Set<string>();
// How many times each string has been sent without coming back translated.
const attempts = new Map<string, number>();
/** A failed batch is retried after these waits (a 429 says how long to wait; that wins when longer). */
const RETRY_DELAYS_MS = [2_000, 6_000, 15_000];
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

  // Replace the in-memory cache with what this browser already translated into this language.
  const loadCacheFromStorage = useCallback((langCode: string) => {
    globalCache.clear();
    try {
      const saved = localStorage.getItem(CACHE_PREFIX + langCode);
      if (!saved) return false;
      const entries: unknown = JSON.parse(saved);
      if (!Array.isArray(entries)) return false;
      for (const e of entries) {
        if (Array.isArray(e) && typeof e[0] === "string" && typeof e[1] === "string") globalCache.set(e[0], e[1]);
      }
      return globalCache.size > 0;
    } catch {
      return false;
    }
  }, []);

  const saveCacheToStorage = useCallback((langCode: string) => {
    try {
      const entries = Array.from(globalCache.entries()).slice(-CACHE_MAX_ENTRIES);
      localStorage.setItem(CACHE_PREFIX + langCode, JSON.stringify(entries));
    } catch {
      // Storage full or blocked: translations still work for this visit.
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
    let retryAfterMs = 0;
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: batch, targetLanguage: langCode, sourceLanguage: "en" }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 429) {
        // "Too many requests. Try again in 12s." — wait at least that long before asking again.
        const seconds = Number(/in (\d+)s/.exec(String(data?.error ?? ""))?.[1] ?? 0);
        retryAfterMs = seconds * 1000;
      }
      // The language may have changed while this request was out; drop stale answers.
      if (queueLang.current === langCode && data?.success && Array.isArray(data.translations)) {
        data.translations.forEach((translated: string, i: number) => {
          if (translated && batch[i]) {
            globalCache.set(batch[i], translated);
            attempts.delete(batch[i]);
            stored++;
          }
        });
      }
    } catch (err) {
      console.warn("Batch translation failed:", err);
    } finally {
      inFlight.current = false;
    }

    let retryDelay = 0;
    if (queueLang.current === langCode) {
      // A failed request (network, rate limit, both services down) is retried with back-off
      // instead of leaving the page in English for the rest of the visit.
      for (const t of batch) {
        if (globalCache.has(t)) continue;
        const n = (attempts.get(t) ?? 0) + 1;
        if (n > RETRY_DELAYS_MS.length) {
          failedTexts.add(t);
          attempts.delete(t);
        } else {
          attempts.set(t, n);
          pendingTexts.add(t);
          retryDelay = Math.max(retryDelay, RETRY_DELAYS_MS[n - 1], retryAfterMs);
        }
      }
      if (stored > 0) {
        saveCacheToStorage(langCode);
        setCacheVersion((v) => v + 1);
      }
    }
    if (pendingTexts.size > 0 && !flushTimer.current) flushTimer.current = setTimeout(flushQueue, retryDelay || FLUSH_DELAY_MS);
  }, [saveCacheToStorage]);

  const queueTranslation = useCallback(
    (texts: Iterable<string>) => {
      if (queueLang.current === "en" || typeof window === "undefined") return;
      for (const t of texts) {
        // Strings waiting for a retry are already queued; don't jump the back-off.
        if (t && t.trim() && !globalCache.has(t) && !failedTexts.has(t) && !attempts.has(t)) pendingTexts.add(t);
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
      attempts.clear();
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

        // Swap in this language's saved translations (empty for English or a first visit).
        if (language.code === "en") globalCache.clear();
        else loadCacheFromStorage(language.code);

        // Show what is cached straight away; the rest fills in as it arrives.
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
    [startLanguage, loadCacheFromStorage]
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
        if (data.success && data.translation && target === currentLanguage.code) {
          globalCache.set(text, data.translation);
          saveCacheToStorage(target);
          setCacheVersion((v) => v + 1);
          return data.translation;
        }
        if (data.success && data.translation) return data.translation;
      } catch (err) {
        console.warn("Translation failed:", err);
      }

      return text;
    },
    [currentLanguage.code, saveCacheToStorage]
  );

  const translateTemplate = useCallback(
    (template: string, values: Record<string, string | number>): string =>
      // Unknown placeholders are left as they are rather than blanked.
      translateSync(template).replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole)),
    [translateSync]
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
    (date: Date, month: "long" | "short" = "long"): string => {
      try {
        return new Intl.DateTimeFormat(currentLanguage.code, {
          year: "numeric",
          month,
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
    attempts.clear();
    try {
      for (const key of Object.keys(localStorage)) if (key.startsWith(CACHE_PREFIX)) localStorage.removeItem(key);
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
    translateTemplate,
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
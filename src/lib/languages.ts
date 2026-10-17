// Languages offered in the picker: English plus the languages of HeriTech's pilot festivals.
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  googleTranslateCode: string;
  rtl?: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", region: "International", googleTranslateCode: "en" },

  // East Asia (Pingxi lantern festival, Taiwan; Japanese visitors)
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳", region: "East Asia", googleTranslateCode: "zh" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", flag: "🇹🇼", region: "East Asia", googleTranslateCode: "zh-TW" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", region: "East Asia", googleTranslateCode: "ja" },

  // Southeast Asia (Yi Peng, Thailand; Bali kites, Indonesia; Panagbenga, Philippines)
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭", region: "Southeast Asia", googleTranslateCode: "th" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", region: "Southeast Asia", googleTranslateCode: "id" },
  { code: "tl", name: "Filipino", nativeName: "Filipino", flag: "🇵🇭", region: "Southeast Asia", googleTranslateCode: "tl" },

  // South Asia (Ganesh Chaturthi, India)
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", region: "South Asia", googleTranslateCode: "hi" },
];

// Group languages by region for the picker
export const LANGUAGES_BY_REGION = SUPPORTED_LANGUAGES.reduce(
  (acc, lang) => {
    (acc[lang.region] ??= []).push(lang);
    return acc;
  },
  {} as Record<string, Language[]>
);

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0];

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
}

/** The browser's preferred language if supported (exact match, then prefix), else English. */
export function getBrowserLanguage(): string {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE.code;

  const browserLang = navigator.language || navigator.languages?.[0];
  if (!browserLang) return DEFAULT_LANGUAGE.code;

  const exactMatch = SUPPORTED_LANGUAGES.find((lang) => lang.code === browserLang);
  if (exactMatch) return exactMatch.code;

  const langPrefix = browserLang.split("-")[0];
  const prefixMatch = SUPPORTED_LANGUAGES.find((lang) => lang.code.split("-")[0] === langPrefix);
  return prefixMatch?.code || DEFAULT_LANGUAGE.code;
}

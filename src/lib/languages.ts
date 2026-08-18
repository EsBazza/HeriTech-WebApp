// Comprehensive Asian language configuration for HeriTech
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
  // English (Default)
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    region: 'International',
    googleTranslateCode: 'en'
  },
  
  // East Asia
  {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    region: 'East Asia',
    googleTranslateCode: 'zh'
  },
  {
    code: 'zh-TW',
    name: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    flag: '🇹🇼',
    region: 'East Asia',
    googleTranslateCode: 'zh-TW'
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    region: 'East Asia',
    googleTranslateCode: 'ja'
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    region: 'East Asia',
    googleTranslateCode: 'ko'
  },

  // Southeast Asia
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    region: 'Southeast Asia',
    googleTranslateCode: 'th'
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    region: 'Southeast Asia',
    googleTranslateCode: 'vi'
  },
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    region: 'Southeast Asia',
    googleTranslateCode: 'id'
  },
  {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    flag: '🇲🇾',
    region: 'Southeast Asia',
    googleTranslateCode: 'ms'
  },
  {
    code: 'tl',
    name: 'Filipino',
    nativeName: 'Filipino',
    flag: '🇵🇭',
    region: 'Southeast Asia',
    googleTranslateCode: 'tl'
  },
  {
    code: 'my',
    name: 'Burmese',
    nativeName: 'မြန်မာ',
    flag: '🇲🇲',
    region: 'Southeast Asia',
    googleTranslateCode: 'my'
  },
  {
    code: 'km',
    name: 'Khmer',
    nativeName: 'ខ្មែរ',
    flag: '🇰🇭',
    region: 'Southeast Asia',
    googleTranslateCode: 'km'
  },
  {
    code: 'lo',
    name: 'Lao',
    nativeName: 'ລາວ',
    flag: '🇱🇦',
    region: 'Southeast Asia',
    googleTranslateCode: 'lo'
  },

  // South Asia
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    region: 'South Asia',
    googleTranslateCode: 'hi'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇧🇩',
    region: 'South Asia',
    googleTranslateCode: 'bn'
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇵🇰',
    region: 'South Asia',
    googleTranslateCode: 'ur',
    rtl: true
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    region: 'South Asia',
    googleTranslateCode: 'ta'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    region: 'South Asia',
    googleTranslateCode: 'te'
  },
  {
    code: 'si',
    name: 'Sinhala',
    nativeName: 'සිංහල',
    flag: '🇱🇰',
    region: 'South Asia',
    googleTranslateCode: 'si'
  },
  {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    flag: '🇳🇵',
    region: 'South Asia',
    googleTranslateCode: 'ne'
  },

  // Central Asia
  {
    code: 'kk',
    name: 'Kazakh',
    nativeName: 'Қазақ тілі',
    flag: '🇰🇿',
    region: 'Central Asia',
    googleTranslateCode: 'kk'
  },
  {
    code: 'ky',
    name: 'Kyrgyz',
    nativeName: 'Кыргызча',
    flag: '🇰🇬',
    region: 'Central Asia',
    googleTranslateCode: 'ky'
  },
  {
    code: 'uz',
    name: 'Uzbek',
    nativeName: 'Oʻzbekcha',
    flag: '🇺🇿',
    region: 'Central Asia',
    googleTranslateCode: 'uz'
  }
];

// Group languages by region for better organization
export const LANGUAGES_BY_REGION = SUPPORTED_LANGUAGES.reduce((acc, lang) => {
  if (!acc[lang.region]) {
    acc[lang.region] = [];
  }
  acc[lang.region].push(lang);
  return acc;
}, {} as Record<string, Language[]>);

// Default language
export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0]; // English

// Get language by code
export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

// Get browser preferred language
export function getBrowserLanguage(): string {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE.code;
  
  const browserLang = navigator.language || navigator.languages?.[0];
  if (!browserLang) return DEFAULT_LANGUAGE.code;
  
  // Check for exact match
  const exactMatch = SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang);
  if (exactMatch) return exactMatch.code;
  
  // Check for language prefix match (e.g., 'en-US' -> 'en')
  const langPrefix = browserLang.split('-')[0];
  const prefixMatch = SUPPORTED_LANGUAGES.find(lang => lang.code.split('-')[0] === langPrefix);
  
  return prefixMatch?.code || DEFAULT_LANGUAGE.code;
}

// Language detection priority for Asian users
export const ASIAN_LANGUAGE_PRIORITY = [
  'zh-CN', 'zh-TW', 'ja', 'ko', 'th', 'vi', 'id', 'hi', 'ms', 'tl'
];

// Festival-specific language mappings
export const FESTIVAL_LANGUAGE_MAP = {
  'Panagbenga': ['tl', 'en'], // Philippines
  'Yi Peng': ['th', 'en'], // Thailand  
  'Ganesh Chaturthi': ['hi', 'ta', 'te', 'en'], // India
  'Lunar New Year': ['zh-CN', 'zh-TW', 'ko', 'vi', 'en'], // East Asia
  'Songkran': ['th', 'en'], // Thailand
  'Diwali': ['hi', 'bn', 'te', 'ta', 'en'], // India
  'Vesak Day': ['si', 'th', 'my', 'km', 'en'], // Buddhist countries
};
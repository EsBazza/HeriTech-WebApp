# HeriTech Multi-Language Translation System

A comprehensive internationalization (i18n) system for HeriTech V4, supporting 20+ Asian languages with Google Translate API integration and intelligent fallback mechanisms.

## 🌏 Supported Languages

### East Asia (4 languages)
- 🇨🇳 Chinese (Simplified) - `zh-CN`
- 🇹🇼 Chinese (Traditional) - `zh-TW`
- 🇯🇵 Japanese - `ja`
- 🇰🇷 Korean - `ko`

### Southeast Asia (8 languages)
- 🇹🇭 Thai - `th`
- 🇻🇳 Vietnamese - `vi`
- 🇮🇩 Indonesian - `id`
- 🇲🇾 Malay - `ms`
- 🇵🇭 Filipino - `tl`
- 🇲🇲 Burmese - `my`
- 🇰🇭 Khmer - `km`
- 🇱🇦 Lao - `lo`

### South Asia (7 languages)
- 🇮🇳 Hindi - `hi`
- 🇧🇩 Bengali - `bn`
- 🇵🇰 Urdu - `ur`
- 🇮🇳 Tamil - `ta`
- 🇮🇳 Telugu - `te`
- 🇱🇰 Sinhala - `si`
- 🇳🇵 Nepali - `ne`

### Central Asia (3 languages)
- 🇰🇿 Kazakh - `kk`
- 🇰🇬 Kyrgyz - `ky`
- 🇺🇿 Uzbek - `uz`

## 🚀 Features

### Core Translation Features
- **Real-time Translation**: Instant translation of UI text using Google Translate API
- **Intelligent Caching**: Browser and server-side caching for improved performance
- **Fallback System**: Mock translation service when Google API is unavailable
- **Batch Translation**: Efficient translation of multiple texts
- **Language Detection**: Automatic detection of source language

### Localization Features
- **Currency Formatting**: Automatic currency conversion and formatting for each region
- **Date/Time Formatting**: Localized date and time display
- **Number Formatting**: Regional number formatting (commas, periods, etc.)
- **RTL Support**: Right-to-left text support for Arabic/Urdu
- **Regional Preferences**: Timezone and cultural preferences

### Developer Experience
- **React Components**: Pre-built translatable components (`TranslatableText`, `TranslatableHeading`)
- **Custom Hooks**: `useTranslation`, `useTextTranslation` for easy integration
- **TypeScript Support**: Full type safety with comprehensive interfaces
- **Performance Monitoring**: Translation statistics and error tracking

## 📁 File Structure

```
src/
├── lib/
│   ├── languages.ts              # Language definitions and configurations
│   ├── i18n/
│   │   └── config.ts              # Next-intl configuration
│   ├── messages/
│   │   └── en.json                # Static message translations
│   └── translation/
│       ├── google-translate.ts    # Google Translate API integration
│       ├── mock-translate.ts      # Mock translation service
│       └── utils.ts               # Translation utilities
├── contexts/
│   └── TranslationContext.tsx     # React context for translations
├── components/
│   ├── language/
│   │   └── LanguageSelector.tsx   # Language picker component
│   └── translation/
│       └── TranslatableText.tsx   # Translatable React components
└── app/
    ├── api/translate/route.ts     # Translation API endpoints
    └── test-translations/page.tsx # Testing interface
```

## ⚙️ Setup & Configuration

### 1. Environment Variables

Add these variables to your `.env` file:

```bash
# Google Cloud Translation API
GOOGLE_TRANSLATE_API_KEY="your-google-translate-api-key"
GOOGLE_CLOUD_PROJECT_ID="your-google-cloud-project-id"
```

### 2. Enable Google Cloud Translation API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Library"
3. Search for "Cloud Translation API"
4. Click "Enable"
5. Create credentials (API Key) in "APIs & Services" → "Credentials"

### 3. Database Schema

The system includes Prisma models for caching translations:

```prisma
model Translation {
  id             String   @id @default(cuid())
  sourceText     String
  targetLanguage String
  translatedText String
  sourceLanguage String   @default("en")
  quality        Float?
  verified       Boolean  @default(false)
  usageCount     Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([sourceText, targetLanguage, sourceLanguage])
  @@map("translations")
}
```

## 🎯 Usage Examples

### Basic Translation Component

```tsx
import { TranslatableText } from '@/components/translation/TranslatableText';

function WelcomeMessage() {
  return (
    <TranslatableText className="text-lg font-semibold">
      Welcome to HeriTech Platform
    </TranslatableText>
  );
}
```

### Using Translation Context

```tsx
import { useTranslation } from '@/contexts/TranslationContext';

function ProductPrice({ price }: { price: number }) {
  const { formatCurrency, currentLanguage } = useTranslation();
  
  return (
    <span className="text-xl font-bold">
      {formatCurrency(price)}
    </span>
  );
}
```

### Language Selector

```tsx
import { LanguageSelector } from '@/components/language/LanguageSelector';

function Header() {
  return (
    <header>
      {/* Other header content */}
      <LanguageSelector variant="compact" />
    </header>
  );
}
```

### API Usage

```typescript
// Translate single text
const response = await fetch('/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello, world!',
    targetLanguage: 'zh-CN'
  })
});

// Batch translation
const batchResponse = await fetch('/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'batch',
    texts: {
      greeting: 'Hello',
      goodbye: 'Goodbye'
    },
    targetLanguage: 'ja'
  })
});
```

## 🧪 Testing

### Run the Test Interface

1. Start the development server: `npm run dev`
2. Navigate to `/test-translations`
3. Select different Asian languages from the dropdown
4. Run translation tests to verify functionality

### Manual Testing Checklist

- [ ] Language selector displays correctly in navbar
- [ ] Text translations work for all supported languages
- [ ] Currency formatting adapts to language
- [ ] Date formatting follows regional standards
- [ ] RTL languages display correctly (Arabic, Urdu)
- [ ] Translation caching improves performance
- [ ] Fallback system works when Google API is unavailable

## 📊 Performance & Monitoring

### Translation Statistics

The system tracks:
- Total translation requests
- Cache hit rates
- Average latency
- Error rates by language
- Usage patterns by language

Access statistics via: `GET /api/translate?action=stats`

### Optimization Features

- **Client-side Caching**: Translations cached in browser for 24 hours
- **Server-side Caching**: Database caching prevents redundant API calls
- **Batch Processing**: Multiple translations in single API call
- **Lazy Loading**: Components only translate when rendered
- **Smart Fallbacks**: Mock translations when API unavailable

## 🛠️ Customization

### Adding New Languages

1. Update `SUPPORTED_LANGUAGES` in `src/lib/languages.ts`
2. Add translations to `src/lib/translation/mock-translate.ts`
3. Test new language in `/test-translations`

### Custom Translation Components

```tsx
import { useTextTranslation } from '@/contexts/TranslationContext';

function CustomTranslatableComponent({ children, className }) {
  const { translatedText, isTranslating } = useTextTranslation(children);
  
  return (
    <div className={`${className} ${isTranslating ? 'opacity-70' : ''}`}>
      {translatedText}
    </div>
  );
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Translations not working**: Check Google Cloud API is enabled and API key is valid
2. **Slow performance**: Verify caching is working and consider using batch translation
3. **Missing translations**: Add fallback text or update mock translation service
4. **Layout issues**: Test with longer translated text and adjust CSS accordingly

### Debug Mode

Enable detailed logging by setting:
```bash
NEXT_PUBLIC_DEBUG_TRANSLATIONS=true
```

## 📈 Production Deployment

### Pre-deployment Checklist

- [ ] Google Cloud Translation API configured and tested
- [ ] Database migration includes translation tables
- [ ] Translation cache properly configured
- [ ] All supported languages tested
- [ ] Performance monitoring set up
- [ ] Error handling covers API failures
- [ ] CDN configured for translation assets

### Monitoring in Production

- Monitor API usage to stay within Google Cloud quotas
- Track translation quality and user feedback
- Monitor cache hit rates for optimization
- Set up alerts for translation API failures

## 🤝 Contributing

When adding new features:
1. Add translations for all supported languages
2. Update test cases in `/test-translations`
3. Document changes in this README
4. Test with multiple Asian languages
5. Verify performance impact

---

**Built for EduTech Asia Competition** - Powering sustainable Asian heritage crafts with accessible multi-language support across all Asian markets.
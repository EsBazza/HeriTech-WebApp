# HeriTech translation system

HeriTech's UI is written in English and translated on demand into the languages of its pilot festivals. Google Cloud Translation does the work, Gemini is the fallback, and English is shown when both are unavailable. Nothing is guessed or hand-written.

## Supported languages

Defined in `src/lib/languages.ts`:

| Code | Language |
| --- | --- |
| `en` | English |
| `zh-CN` | Chinese (Simplified) |
| `zh-TW` | Chinese (Traditional) |
| `ja` | Japanese |
| `th` | Thai |
| `id` | Indonesian |
| `tl` | Filipino |
| `hi` | Hindi |

## How it works

```
component ── translateSync("text") ──▶ shared cache (hit: translated text)
                                       │ miss
                                       ▼
                               pending queue (one per page)
                                       │ 150 ms debounce, one request at a time,
                                       │ ≤ 100 strings per request
                                       ▼
                POST /api/translate ──▶ Cloud Translation ──▶ Gemini ──▶ English
```

- **One queue for the whole app** (`src/contexts/TranslationContext.tsx`). However many components ask for missing strings, they are collected and sent in batches, with only one request in flight.
- **No retry loops.** A string the server couldn't translate is remembered and not requested again until the language changes. Components re-render only when new translations arrive.
- **Caching.** Translations are cached in the browser (memory plus `sessionStorage` for the current language) and in memory on each server instance for 24 hours (`src/lib/translation/google-translate.ts`). Failed attempts are never cached.
- **Prices** are shown in the reader's currency using live exchange rates (`/api/exchange-rates`, with fallback rates). Orders are always charged in US dollars, and checkout says so.

## The API route

`POST /api/translate` (`src/app/api/translate/route.ts`) is open to guests, so it is limited:

- 60 requests per minute per client (per server instance)
- at most 100 strings and 20,000 characters per request (translation is billed per character)
- only the language codes above

`GET /api/translate` lists the supported languages.

## Using it in components

```tsx
const { translateSync } = useTranslation();
return <h2>{translateSync("Where your money goes")}</h2>;
```

or, for plain strings in JSX:

```tsx
<TranslatableText>Material release agreements</TranslatableText>
```

Translate fixed UI text and user-written titles. Don't pass strings that embed changing numbers (prices, counts) through `translateSync`; translate the words and format the number with `formatCurrency` / `formatNumber`.

## Configuration

```bash
GOOGLE_TRANSLATE_API_KEY=   # optional; without it, Gemini (GEMINI_API_KEY) translates
```

Enable the Cloud Translation API for the key in Google Cloud Console and restrict the key to that API.

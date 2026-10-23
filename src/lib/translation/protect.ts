/**
 * Names that must come back from translation exactly as written: the product,
 * the Google services it runs on, partners and pass serials.
 */
export const PROTECTED_TERMS = [
  "HeriTech",
  "Google Wallet",
  "Google Maps",
  "Maps Platform",
  "Cloud Translation",
  "Gemini",
  "Firebase",
  "Teachable Machine",
  "EDUtech Asia",
  "Unsplash",
  "Wikimedia Commons",
];

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unescapeHtml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&amp;/g, "&");

const termPattern = new RegExp(
  `(${PROTECTED_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}|HT-[A-Z0-9]{4}-[A-Z0-9]{4}|\\{\\w+\\})`,
  "g"
);

/** Plain text → HTML for Google Translate with every protected name wrapped in translate="no". */
export function protectForHtml(text: string): string {
  return escapeHtml(text).replace(termPattern, '<span translate="no">$1</span>');
}

/** Google's HTML answer → plain text again. */
export function unprotectFromHtml(html: string): string {
  return unescapeHtml(html.replace(/<span translate="no">([\s\S]*?)<\/span>/g, "$1").replace(/<\/?span[^>]*>/g, ""));
}

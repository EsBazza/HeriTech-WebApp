import "server-only";
import sharp from "sharp";

/**
 * Artwork for Google Wallet passes, made from the product photo so every
 * piece gets its own look: a photo banner and a matching background colour.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const DATA_URL = /^data:image\/[a-z+]+;base64,(.+)$/;

/** Hero banner size Google recommends for Wallet passes. */
const HERO = { width: 1032, height: 336 };

/** Hosts the server may fetch pass artwork from: the app itself and Firebase / Cloud Storage. */
const IMAGE_HOSTS = ["firebasestorage.googleapis.com", "storage.googleapis.com"];

function isAllowedImageHost(url: string, appOrigin: string): boolean {
  try {
    const { protocol, host, origin } = new URL(url);
    if (origin === new URL(appOrigin).origin) return true;
    return protocol === "https:" && IMAGE_HOSTS.includes(host);
  } catch {
    return false;
  }
}

/**
 * Reads a product image stored as an https URL, an inline data URL, or a path
 * under /public (demo artwork), which is fetched from the app itself.
 */
export async function loadProductImage(src: string, appOrigin: string): Promise<Buffer | null> {
  const inline = DATA_URL.exec(src);
  if (inline) return Buffer.from(inline[1], "base64");

  const url = src.startsWith("/") && !src.startsWith("//") ? `${appOrigin}${src}` : src;
  if (!isAllowedImageHost(url, appOrigin)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length <= MAX_IMAGE_BYTES ? bytes : null;
  } catch {
    return null;
  }
}

/**
 * The 1032×336 banner Wallet shows under the card: the piece itself, sharp.
 * Wallet can't put an image behind the card text, so a blur only hid the product.
 */
export function heroBanner(image: Buffer): Promise<Buffer> {
  return sharp(image, { density: 144 })
    .resize(HERO.width, HERO.height, { fit: "cover", position: "attention" })
    .modulate({ saturation: 1.05 })
    .png()
    .toBuffer();
}

/**
 * The photo's most characteristic colour, darkened until white pass text stays
 * readable (relative luminance at most 0.18, roughly 4.5:1 contrast with white).
 * Colours are bucketed and scored by how common and how saturated they are, so a
 * neutral backdrop doesn't win over the piece itself.
 */
export async function passBackground(image: Buffer): Promise<string> {
  const { data, info } = await sharp(image, { density: 72 })
    .resize(48, 48, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map<number, { count: number; r: number; g: number; b: number; saturation: number }>();
  for (let i = 0; i < data.length; i += info.channels) {
    const [pr, pg, pb] = [data[i], data[i + 1], data[i + 2]];
    const key = ((pr >> 4) << 8) | ((pg >> 4) << 4) | (pb >> 4);
    const max = Math.max(pr, pg, pb);
    const saturation = max === 0 ? 0 : (max - Math.min(pr, pg, pb)) / max;
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0, saturation };
    bucket.count += 1;
    bucket.r += pr;
    bucket.g += pg;
    bucket.b += pb;
    buckets.set(key, bucket);
  }
  // Prefer clearly coloured areas covering at least 2% of the photo; fall back to the most common colour.
  const all = [...buckets.values()];
  const colourful = all.filter((c) => c.saturation >= 0.25 && c.count >= (data.length / info.channels) * 0.02);
  const best = colourful.length
    ? colourful.reduce((a, c) => (c.count * c.saturation > a.count * a.saturation ? c : a))
    : all.reduce((a, c) => (c.count > a.count ? c : a));
  const [h, photoS, photoL] = toHsl(best.r / best.count, best.g / best.count, best.b / best.count);
  // A near-grey photo would give a muddy card, so those get HeriTech green.
  if (photoS < 0.12) return PASS_GREEN;
  // A deep, clear version of the photo's colour, rather than its darkened average (which turns taupe).
  const s = Math.max(photoS, 0.45);
  let l = Math.min(Math.max(photoL, 0.22), 0.32);
  let rgb = fromHsl(h, s, l);
  while (luminance(rgb) > 0.18) rgb = fromHsl(h, s, (l -= 0.02));
  return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

const PASS_GREEN = "#1f3a2b";

function luminance([r, g, b]: number[]): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** RGB (0–255) to hue, saturation and lightness (each 0–1). */
function toHsl(r: number, g: number, b: number): [number, number, number] {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

/** Hue, saturation and lightness (each 0–1) to RGB (0–255). */
function fromHsl(h: number, s: number, l: number): number[] {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)].map((c) => c * 255);
}

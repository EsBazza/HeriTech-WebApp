import "server-only";
import sharp from "sharp";

/**
 * Artwork for Google Wallet passes, made from the product photo so every
 * piece gets its own look: a blurred banner and a matching background colour.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const DATA_URL = /^data:image\/[a-z+]+;base64,(.+)$/;

/** Hero banner size Google recommends for Wallet passes. */
const HERO = { width: 1032, height: 336 };

/**
 * Reads a product image stored as an https URL, an inline data URL, or a path
 * under /public (demo artwork), which is fetched from the app itself.
 */
export async function loadProductImage(src: string, appOrigin: string): Promise<Buffer | null> {
  const inline = DATA_URL.exec(src);
  if (inline) return Buffer.from(inline[1], "base64");

  const url = src.startsWith("/") ? `${appOrigin}${src}` : src;
  if (!/^https?:\/\//.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length <= MAX_IMAGE_BYTES ? bytes : null;
  } catch {
    return null;
  }
}

/** A blurred, slightly darkened 1032×336 banner. */
export function heroBanner(image: Buffer): Promise<Buffer> {
  return sharp(image, { density: 144 })
    .resize(HERO.width, HERO.height, { fit: "cover" })
    .blur(18)
    .modulate({ brightness: 0.8, saturation: 1.1 })
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
  let [r, g, b] = [best.r / best.count, best.g / best.count, best.b / best.count];
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = () => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  while (luminance() > 0.18) {
    [r, g, b] = [r * 0.9, g * 0.9, b * 0.9];
  }
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

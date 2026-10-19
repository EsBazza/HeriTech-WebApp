/**
 * Client-side QR decoding for the custody handover.
 *
 * Uses the browser's native BarcodeDetector when it exists (fast, robust), and
 * jsQR everywhere else (iOS Safari, Firefox). Photos are tried at several sizes
 * and with a centre crop, because a phone photo of a screen is often huge,
 * slightly blurred, or has the code small in the frame.
 */

type JsQr = typeof import("jsqr").default;

let jsQrPromise: Promise<JsQr> | null = null;
/** Loads jsQR on first use only. */
export function loadJsQr(): Promise<JsQr> {
  jsQrPromise ??= import("jsqr").then((m) => m.default);
  return jsQrPromise;
}

interface NativeDetector {
  detect(source: CanvasImageSource | ImageBitmap): Promise<Array<{ rawValue: string }>>;
}

let detectorPromise: Promise<NativeDetector | null> | null = null;
/** The native QR detector, or null when the browser doesn't have one. */
export function nativeDetector(): Promise<NativeDetector | null> {
  detectorPromise ??= (async () => {
    const Ctor = (globalThis as { BarcodeDetector?: new (o: { formats: string[] }) => NativeDetector } & {
      BarcodeDetector?: { getSupportedFormats?: () => Promise<string[]> };
    }).BarcodeDetector;
    if (!Ctor) return null;
    try {
      const formats = await (Ctor as unknown as { getSupportedFormats?: () => Promise<string[]> }).getSupportedFormats?.();
      if (formats && !formats.includes("qr_code")) return null;
      return new Ctor({ formats: ["qr_code"] });
    } catch {
      return null;
    }
  })();
  return detectorPromise;
}

/** HeriTech pickup codes look like `HT1.<payload>.<signature>`. */
export function isHandoverCode(text: string): boolean {
  return /^HT1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(text.trim());
}

/** Draws `source` scaled so its longest side is at most `maxSide`, optionally cropped to the centre. */
function rasterize(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxSide: number,
  crop = 1
): { data: Uint8ClampedArray; width: number; height: number; canvas: HTMLCanvasElement } | null {
  const sw = width * crop;
  const sh = height * crop;
  const sx = (width - sw) / 2;
  const sy = (height - sh) / 2;
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, w, h);
  return { data: ctx.getImageData(0, 0, w, h).data, width: w, height: h, canvas };
}

/**
 * Decodes the first QR code in an image file (photo, screenshot or the
 * downloaded pickup card). Returns null when none can be read.
 */
export async function decodeQrFromFile(file: Blob): Promise<string | null> {
  let source: CanvasImageSource;
  let width: number;
  let height: number;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    source = bitmap;
    width = bitmap.width;
    height = bitmap.height;
  } catch {
    // Older browsers: fall back to an <img>
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("unreadable"));
        el.src = url;
      });
      source = img;
      width = img.naturalWidth;
      height = img.naturalHeight;
    } catch {
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const detector = await nativeDetector();
  if (detector) {
    try {
      const found = await detector.detect(source);
      if (found[0]?.rawValue) return found[0].rawValue;
    } catch {
      /* fall through to jsQR */
    }
  }

  const jsQR = await loadJsQr();
  // Whole image at a few sizes first, then a centre crop for codes small in frame
  const attempts: Array<[number, number]> = [
    [1200, 1],
    [800, 1],
    [1600, 1],
    [500, 1],
    [1000, 0.6],
    [700, 0.45],
  ];
  for (const [maxSide, crop] of attempts) {
    const img = rasterize(source, width, height, maxSide, crop);
    if (!img) continue;
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
    if (code?.data) return code.data;
  }
  return null;
}

/**
 * Decodes one video frame. Frames are downscaled before jsQR so phones keep
 * a smooth preview; `invert` lets callers alternate light/dark attempts.
 */
export async function decodeQrFromVideo(video: HTMLVideoElement, invert: boolean): Promise<string | null> {
  if (video.readyState < video.HAVE_CURRENT_DATA || !video.videoWidth) return null;
  const detector = await nativeDetector();
  if (detector) {
    try {
      const found = await detector.detect(video);
      return found[0]?.rawValue ?? null;
    } catch {
      /* fall through */
    }
  }
  const jsQR = await loadJsQr();
  const img = rasterize(video, video.videoWidth, video.videoHeight, 720);
  if (!img) return null;
  const code = jsQR(img.data, img.width, img.height, { inversionAttempts: invert ? "invertFirst" : "dontInvert" });
  return code?.data ?? null;
}

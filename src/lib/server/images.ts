import "server-only";
import { randomUUID } from "node:crypto";
import { getDownloadURL } from "firebase-admin/storage";
import { adminStorage } from "@/lib/firebase/admin";
import { HttpError, badRequest } from "./http";

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Inline fallback must stay well under Firestore's 1 MiB document limit. */
const MAX_INLINE_CHARS = 600_000;

let bucketReady: Promise<boolean> | undefined;

function storageAvailable(): Promise<boolean> {
  // bucket() throws synchronously when no bucket name is configured, so start
  // inside a promise and let the inline fallback below handle that case too.
  bucketReady ??= Promise.resolve()
    .then(() => adminStorage().bucket().exists())
    .then(([exists]) => {
      if (!exists) console.warn("[images] Storage bucket missing; storing compressed images inline instead.");
      return exists;
    })
    .catch((error) => {
      console.warn("[images] Storage check failed; storing images inline:", error);
      return false;
    });
  return bucketReady;
}

/**
 * Accepts an https URL as-is, or uploads a base64 data URL to Cloud Storage and
 * returns its download URL. Until Storage is enabled for the project, small
 * images are kept inline as data URLs instead.
 */
export async function storeImage(value: string, folder: "batches" | "products"): Promise<string> {
  if (value.startsWith("https://")) return value;
  // Labelled demo artwork shipped in /public/demo (seeded listings keep it when edited).
  if (/^\/demo\/[\w/-]+\.(svg|png|jpe?g|webp)$/.test(value)) return value;

  const match = DATA_URL.exec(value);
  if (!match) throw badRequest("Images must be an https URL or a JPEG, PNG or WebP upload.");

  const [, contentType, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length > MAX_UPLOAD_BYTES) throw new HttpError(413, "Image is larger than 5 MB.");

  if (await storageAvailable()) {
    const extension = contentType.split("/")[1].replace("jpeg", "jpg");
    const file = adminStorage().bucket().file(`${folder}/${randomUUID()}.${extension}`);
    await file.save(bytes, { contentType, resumable: false, metadata: { cacheControl: "public, max-age=31536000" } });
    return getDownloadURL(file);
  }

  if (value.length > MAX_INLINE_CHARS) {
    throw new HttpError(413, "Image is too large. Use a smaller photo or paste an image URL.");
  }
  return value;
}

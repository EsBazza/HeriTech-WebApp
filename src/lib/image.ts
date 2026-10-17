"use client";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Resizes a photo in the browser and re-encodes it as JPEG, so uploads stay small
 * (typically 100–300 KB) and fit the server's inline-image limit.
 */
export function compressImage(file: File, maxDimension = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED.includes(file.type)) {
      reject(new Error("Please choose a JPEG, PNG or WebP photo."));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("This browser can't process photos."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That photo couldn't be read. Try another one."));
    };
    img.src = url;
  });
}

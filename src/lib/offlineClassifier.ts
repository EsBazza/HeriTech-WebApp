"use client";

import type { LayersModel } from "@tensorflow/tfjs";

/**
 * On-device material classifier trained with Google Teachable Machine (image
 * project, exported as "TensorFlow.js"). Put the exported model.json,
 * weights.bin and metadata.json in public/tm-model/. Used only when Gemini
 * can't be reached; results are labelled as on-device estimates.
 */
const MODEL_URL = "/tm-model/model.json";
const METADATA_URL = "/tm-model/metadata.json";
const INPUT_SIZE = 224;

interface Loaded {
  model: LayersModel;
  labels: string[];
}

let loading: Promise<Loaded | null> | undefined;

function load(): Promise<Loaded | null> {
  loading ??= (async () => {
    const metadata = await fetch(METADATA_URL).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!metadata?.labels?.length) return null; // no model trained yet
    const tf = await import("@tensorflow/tfjs");
    const model = await tf.loadLayersModel(MODEL_URL);
    return { model, labels: metadata.labels as string[] };
  })().catch((error) => {
    console.warn("[offline classifier] could not load:", error);
    return null;
  });
  return loading;
}

export interface OfflinePrediction {
  label: string;
  probability: number;
}

function toImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read the photo."));
    img.src = dataUrl;
  });
}

/** Classifies a photo on the device, or returns null when no model is installed. */
export async function classifyOffline(dataUrl: string): Promise<OfflinePrediction | null> {
  const loaded = await load();
  if (!loaded) return null;
  const tf = await import("@tensorflow/tfjs");
  const img = await toImage(dataUrl);

  // Same preprocessing as Teachable Machine: centre-crop to a square, 224×224, scaled to [-1, 1].
  const scores = tf.tidy(() => {
    const pixels = tf.browser.fromPixels(img);
    const side = Math.min(pixels.shape[0], pixels.shape[1]);
    const top = Math.floor((pixels.shape[0] - side) / 2);
    const left = Math.floor((pixels.shape[1] - side) / 2);
    const square = pixels.slice([top, left, 0], [side, side, 3]);
    const input = tf.image.resizeBilinear(square, [INPUT_SIZE, INPUT_SIZE]).toFloat().div(127.5).sub(1).expandDims(0);
    return (loaded.model.predict(input) as import("@tensorflow/tfjs").Tensor).dataSync();
  });

  let best = 0;
  for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i;
  return { label: loaded.labels[best] ?? "Unknown material", probability: scores[best] };
}

# On-device classifier (Teachable Machine)

The scanner falls back to this model when Gemini can't be reached.

1. Open https://teachablemachine.withgoogle.com/train/image
2. Add one class per material, named exactly like the scanner's categories
   (`src/lib/materials.ts`): Paper and card, Flowers and plant matter,
   Fabric and textile, Mixed plastics, Wood and frame offcuts. Use 30+ close-up
   photos per class, taken the way officers will take them.
3. Train, then Export model → TensorFlow.js → Download.
4. Put `model.json`, `weights.bin` and `metadata.json` in this folder and deploy.

Until those files exist, the fallback stays off and the scanner shows Gemini's
error instead.

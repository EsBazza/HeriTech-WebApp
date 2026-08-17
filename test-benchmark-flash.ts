import "dotenv/config";

async function benchmarkGeminiSpeed() {
  const apiKey = process.env.GEMINI_API_KEY;
  const sampleBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const systemPrompt = "You are the HeriTech Multimodal Waste & Material Salvage Classifier. Analyze the image with complete visual objectivity.";

  const userPrompt = `Analyze the material shown in this photo. Return ONLY valid JSON:
{
  "materialType": "String",
  "materialSubtypes": ["String"],
  "confidence": 0.95,
  "condition": "String",
  "inferredMaterialDetails": "String",
  "contaminationFlags": ["String"],
  "suggestedCraftTypologies": ["String"],
  "estimatedWeightKg": {
    "low": 1.0,
    "high": 2.5,
    "bestEstimate": 1.8,
    "visualRationale": "String"
  }
}`;

  const models = ["gemini-3.6-flash", "gemini-2.5-flash-lite"];

  for (const model of models) {
    try {
      console.log(`\nTesting ${model}...`);
      const t0 = Date.now();
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [
              {
                parts: [
                  { text: userPrompt },
                  { inline_data: { mime_type: "image/png", data: sampleBase64 } },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.2,
            },
          }),
        }
      );
      const elapsed = Date.now() - t0;
      if (res.ok) {
        console.log(`✅ ${model} responded in ${elapsed}ms! (${(elapsed / 1000).toFixed(2)}s)`);
      } else {
        console.log(`❌ ${model} failed:`, await res.text());
      }
    } catch (e: any) {
      console.error(`Error with ${model}:`, e.message);
    }
  }
}

benchmarkGeminiSpeed();

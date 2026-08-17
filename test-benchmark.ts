import "dotenv/config";

async function benchmarkGeminiSpeed() {
  console.log("==========================================");
  console.log("⚡ BENCHMARKING GEMINI MULTIMODAL INFERENCE SPEED");
  console.log("==========================================");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing API key");
    return;
  }

  // Sample 200x200 compressed jpeg base64
  const sampleBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const systemPrompt = "You are the HeriTech Multimodal Waste & Material Salvage Classifier. Analyze the image with complete visual objectivity: identify exactly what is visible without forcing it into rigid categories or predefined options. Use open-ended, highly specific descriptions based strictly on physical reality.";

  const userPrompt = `Analyze the material shown in this photo with complete visual honesty.

Provide:
1. Exact Material Classification: State the exact material(s) seen.
2. Physical Condition & Degradation: Describe the true state of the material.
3. Specific Visual Details: Note brand logos, flute patterns, weave textures, layer thicknesses, or visible markings.
4. Contamination Flags: List every visible contaminant or foreign element observed.
5. Suggested Upcycling & Craft Typologies: Suggest realistic artisan crafts, recycling pathways, or maker applications.
6. Volumetric Weight Estimation: Estimate the weight in kilograms.

Return ONLY valid JSON matching this schema:
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

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

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
        console.log(`❌ ${model} failed with status ${res.status}:`, await res.text());
      }
    } catch (e: any) {
      console.error(`Error with ${model}:`, e.message);
    }
  }
}

benchmarkGeminiSpeed();

import "dotenv/config";

async function testUpdatedPrompt() {
  console.log("==================================================");
  console.log("🧪 TESTING UPDATED OBJECTIVE GEMINI VISION PROMPT");
  console.log("==================================================");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing from .env!");
    return;
  }

  const sampleBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const systemPrompt = "You are the HeriTech Multimodal Waste & Material Salvage Classifier. Analyze the image with complete visual objectivity: identify exactly what is visible without forcing it into rigid categories or predefined options. Use open-ended, highly specific descriptions based strictly on physical reality.";

  const userPrompt = `Analyze the material shown in this photo with complete visual honesty.

Provide:
1. Exact Material Classification: State the exact material(s) seen (e.g., standard corrugated cardboard, bamboo splits, PET plastic, unbleached kraft paper, scrap metal, pine wood, etc.—do not limit to these examples; state whatever is actually there).
2. Physical Condition & Degradation: Describe the true state of the material (e.g., dry, wet, crushed, torn, moldy, intact, pristine).
3. Specific Visual Details: Note brand logos, flute patterns, weave textures, layer thicknesses, or visible markings.
4. Contamination Flags: List every visible contaminant or foreign element observed (e.g., shipping tape, staples, moisture, food grease, wax coating, fuel, dirt, mold, wire).
5. Suggested Upcycling & Craft Typologies: Suggest realistic artisan crafts, recycling pathways, or maker applications tailored to the specific material.
6. Volumetric Weight Estimation: Estimate the weight in kilograms based on visible scale, dimensions, and material density.

Return ONLY valid JSON matching this schema:
{
  "materialType": "Open string: exact primary material identified (e.g. Corrugated Kraft Cardboard Boxes)",
  "materialSubtypes": ["Open string: specific subtypes, e.g. Single-wall corrugated board, paper tape"],
  "confidence": 0.95,
  "condition": "Open string: descriptive condition assessment",
  "inferredMaterialDetails": "Detailed breakdown of visible physical traits, brands, textures, and structural layers",
  "contaminationFlags": ["Open list of any observed contaminants, e.g. shipping tape, ground moisture"],
  "suggestedCraftTypologies": ["Open list of practical upcycling / artisan use-cases"],
  "estimatedWeightKg": {
    "low": 1.0,
    "high": 2.5,
    "bestEstimate": 1.8,
    "visualRationale": "Brief visual scale and density basis (e.g. bundle size relative to curbside ~50x30x20cm at ~60-80 kg/m³)"
  }
}`;

  try {
    const startTime = Date.now();
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [
                { text: userPrompt },
                {
                  inline_data: {
                    mime_type: "image/png",
                    data: sampleBase64,
                  },
                },
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

    const elapsed = Date.now() - startTime;
    const data = await geminiRes.json();

    if (geminiRes.ok) {
      console.log(`✅ Gemini responded in ${elapsed}ms!`);
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("\n📄 Live AI Response Payload:\n", JSON.parse(rawText));
    } else {
      console.error("❌ Gemini API error:", data);
    }
  } catch (err) {
    console.error("❌ Request error:", err);
  }
}

testUpdatedPrompt();

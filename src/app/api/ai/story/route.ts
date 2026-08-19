import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      batchId,
      materialType,
      condition,
      festival,
      country,
      craftTypology,
      artisanWorkshop,
      divertedKg,
      title,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt =
          "You are the HeriTech Heritage Storyteller AI. You craft authentic, evocative, and culturally reverent product bios and origin stories for upcycled heritage artisan pieces made from salvaged Asian festival materials.";

        const userPrompt = `Craft a compelling, authentic 2-3 sentence product origin bio for an upcycled artisan craft piece with these telemetry details:
- Product Title: ${title || "Handcrafted Heritage Piece"}
- Origin Festival: ${festival || "Pan-Asian Cultural Festival"} (${country || "Asia"})
- Source Material Batch ID: ${batchId || "HT-2026"}
- Salvaged Material: ${materialType || "Organic festival materials"}
- Material Condition: ${condition || "Pristine"}
- Material Diverted from Landfill: ${divertedKg || "1.0"} kg
- Upcycling Craft Method / Typology: ${craftTypology || "Traditional Heritage Joinery & Weaving"}
- Artisan Cooperative / Workshop: ${artisanWorkshop || "Certified Master Artisan"}

Guidelines:
1. Tell the journey from ceremonial festival salvage to handcrafted art.
2. Emphasize physical sustainability, cultural dignity, and zero-waste craftsmanship.
3. Keep it between 50 to 80 words. Direct, editorial luxury tone.
4. Return ONLY valid JSON:
{
  "story": "The generated story...",
  "suggestedTags": ["Tag1", "Tag2", "Tag3"],
  "headline": "A short poetic headline"
}`;

        const models = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];
        let rawText: string | null = null;
        let usedModel = "gemini-3.5-flash-lite";

        for (const model of models) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  system_instruction: { parts: [{ text: systemPrompt }] },
                  contents: [
                    {
                      parts: [{ text: userPrompt }],
                    },
                  ],
                  generationConfig: {
                    response_mime_type: "application/json",
                    temperature: 0.7,
                  },
                }),
              }
            );

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
              usedModel = model;
              if (rawText) break;
            }
          } catch (e) {
            console.warn(`Model ${model} story generation attempt failed:`, e);
          }
        }

        if (rawText) {
          const parsed = JSON.parse(rawText);
          return NextResponse.json({
            success: true,
            source: usedModel,
            data: parsed,
          });
        }
      } catch (geminiError) {
        console.warn("Gemini story generation failed, using fallback:", geminiError);
      }
    }

    // Fallback stories tailored to festival
    const festivalLower = (festival || "").toLowerCase();
    let fallbackStory = `Hand-carved and woven from ${divertedKg || "1.5"}kg of certified ${materialType || "salvaged bamboo"} recovered post-celebration at the ${festival || "Pan-Asian Cultural Festival"}. Restored by master artisans through zero-emission natural curing, giving renewed cultural permanence to ceremonial fibers.`;
    let fallbackHeadline = "From Sacred Celebration to Living Heritage";
    let fallbackTags = ["Heritage Craft", "Zero-Waste", "Circular Fiber"];

    if (festivalLower.includes("panagbenga") || festivalLower.includes("baguio")) {
      fallbackStory = `Handcrafted from ${divertedKg || "1.5"}kg of structural Highland Bolo bamboo and sun-dried botanical flora salvaged from the Panagbenga Festival in Baguio. Master Cordillera weavers gently cure and knot each culm using heirloom backstrap looms, transforming transient float sculptures into enduring living tapestries.`;
      fallbackHeadline = "Echoes of the Blooming Highlands";
      fallbackTags = ["Cordillera Loom", "Panagbenga Flora", "Bolo Bamboo"];
    } else if (festivalLower.includes("yi peng") || festivalLower.includes("chiang")) {
      fallbackStory = `Lovingly repurposed from ${divertedKg || "1.2"}kg of non-combusted split bamboo frames and mulberry rice paper gathered after the Yi Peng Sky Lantern celebration in Chiang Mai. Preserving traditional Lanna joinery, each piece illuminates ancient Northern Thai craftsmanship while diverting delicate paper fibers from regional waterways.`;
      fallbackHeadline = "Sky Lantern Rebirth";
      fallbackTags = ["Lanna Joinery", "Mulberry Paper", "Yi Peng Bamboo"];
    } else if (festivalLower.includes("ganesh") || festivalLower.includes("nirmalaya")) {
      fallbackStory = `Extracted from ${divertedKg || "2.0"}kg of consecrated temple nirmalaya marigolds and rose petals post-Ganesh Visarjan. Solar-dried and blended into rich non-toxic organic pigment inks, breathing sacred festive colors into archival handcrafted parchment.`;
      fallbackHeadline = "Sacred Petals, Permanent Pigments";
      fallbackTags = ["Temple Nirmalaya", "Natural Pigment", "Organic Marigold"];
    }

    return NextResponse.json({
      success: true,
      source: "fallback-story-engine",
      data: {
        story: fallbackStory,
        headline: fallbackHeadline,
        suggestedTags: fallbackTags,
      },
    });
  } catch (error) {
    console.error("Story API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate origin story" },
      { status: 500 }
    );
  }
}

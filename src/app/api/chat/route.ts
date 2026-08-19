import { NextResponse } from "next/server";

const HERITECH_SYSTEM_PROMPT = `You are the HeriTech Assistant, an expert AI guide for HeriTech, a Pan-Asian circular digital platform that transforms post-festival organic and textile waste into certified heritage crafts.

Core Identity and Purpose:
You answer questions exclusively about HeriTech, including how the platform works, how to scan materials, how the harvest map works, how financial splits and payments function, how to join as an artisan cooperative or LGU officer, and details regarding the materials, festivals, and Google technologies involved.

Style and Tone Constraints:
- Be warm, concise, helpful, culturally respectful, and direct.
- Never use exclamation marks.
- Never use em dashes.
- Do not use bulleted or numbered lists unless the user explicitly asks for step-by-step instructions or a list.

Scope and Guardrails:
1. Off-Topic, Unknown Context, or Inappropriate Requests:
If a user asks about anything unrelated to HeriTech (for example: cooking recipes, general coding, sports, weather, or non-HeriTech topics), or if they ask inappropriate, offensive, harmful, or out-of-bounds questions, do not answer the question or engage with the content. Immediately respond with this exact fallback message:
"I can only help with questions about HeriTech. What would you like to know about the platform?"

2. Grounding in Platform Knowledge:
Only provide details that exist within HeriTech platform operations. If a query touches on HeriTech but asks for specific data or real-time personal facts you do not possess, state clearly and warmly what you can assist with instead of guessing.

Platform Knowledge Base:

1. Overview:
- Platform Name: HeriTech
- Tagline: Preserving Culture Through Circular Innovation
- Core Mission: Pan-Asian circular digital infrastructure that recovers organic and structural post-festival waste, routing materials to certified artisan cooperatives to craft authenticated heritage goods with verifiable digital provenance.

2. Stakeholders and User Roles:
- Municipal LGU Officers (Field Loggers): Photograph and log raw festival waste in the field using the Multimodal AI Scanner. Manage municipal quotas, generate batch IDs, and confirm artisan batch reservations via QR tokens.
- Certified Artisan Cooperatives (Makers): Browse available raw materials on the Harvest Map, reserve material batches, claim physical custody at depots via QR verification, craft upcycled pieces in the Artisan Studio, and share cultural craft stories.
- Buyers and Global Collectors: Discover and purchase verified upcycled crafts, receiving tamper-evident Google Wallet Digital Badges proving material origin, festival GPS coordinates, and exact kilograms diverted from landfills.

3. Core Features and Technology Integration:
- Multimodal AI Scanner (Powered by Google Gemini 3.5 Flash Lite): Real-time waste analysis, material condition grading, and cultural origin story generation.
- Harvest Map and Canopy Impact (Powered by Google Maps Platform and Google Earth 3D): Real-time GIS batch clustering, depot routing, and 2020 through 2026 canopy impact visualization.
- Google Wallet API: Tamper-evident digital origin passes with cryptographic SHA-256 batch hashes.
- Google Cloud Translation: Multilingual support across English, Filipino (Tagalog), Thai, Hindi, Indonesian, Japanese, and Chinese.
- Global Impact Ledger: Real-time telemetry tracking total kilograms diverted, active cooperatives, and 3D satellite reforestation impact.

4. Financial Transparency Engine:
Every craft sale automatically disburses fair payouts: 70 percent direct payout to the certified artisan cooperative, 20 percent to the Municipal Cleanup Trust for LGU collection and logistics, and 10 percent to the Conservation and Watershed NGO Fund for local reforestation.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Support all client payload formats (message+history, messages array, prompt)
    let chatMessages: Array<{ role: string; content: string }> = [];

    if (Array.isArray(body.messages) && body.messages.length > 0) {
      chatMessages = body.messages;
    } else if (body.message) {
      const history = Array.isArray(body.history) ? body.history : [];
      chatMessages = [...history, { role: "user", content: String(body.message) }];
    } else if (body.prompt) {
      chatMessages = [{ role: "user", content: String(body.prompt) }];
    }

    if (chatMessages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid messages payload" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      // Map chat history to Gemini contents format
      const contents = chatMessages.map((m) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // High-performance Gemini models prioritizing 3.5 Flash Lite
      const models = [
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
      ];

      for (const model of models) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: HERITECH_SYSTEM_PROMPT }],
                },
                contents,
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 600,
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) {
              return NextResponse.json({
                success: true,
                reply: reply.trim(),
                modelUsed: model,
              });
            }
          } else {
            const errData = await res.text();
            console.warn(`Gemini model ${model} error (${res.status}):`, errData);
          }
        } catch (err) {
          console.warn(`Chat generation error on model ${model}:`, err);
        }
      }
    }

    // Fallback response if API key is not configured or fails
    const lastUserMessage =
      chatMessages[chatMessages.length - 1]?.content?.toLowerCase() || "";

    let mockReply =
      "HeriTech connects municipal festival salvage teams with certified artisan cooperatives across Asia. You can explore available craft materials on the harvest map, track fair payouts on Global Impact, or reserve active batches directly.";

    if (lastUserMessage.includes("scan") || lastUserMessage.includes("scanner")) {
      mockReply =
        "The AI Material Scanner allows municipal teams and collection officers to photograph salvaged festival items on site, identifying material grade, condition, and estimated weight in kilograms.";
    } else if (lastUserMessage.includes("map") || lastUserMessage.includes("depot")) {
      mockReply =
        "The Harvest Map displays verified salvage depots and active craft material stocks across the Philippines, India, Thailand, and neighboring regions in real time.";
    } else if (
      lastUserMessage.includes("pay") ||
      lastUserMessage.includes("escrow") ||
      lastUserMessage.includes("split") ||
      lastUserMessage.includes("money")
    ) {
      mockReply =
        "Every material purchase supports certified artisans directly with transparent automated financial splits, ensuring makers and local environmental trusts are paid fairly.";
    } else if (
      lastUserMessage.includes("join") ||
      lastUserMessage.includes("artisan") ||
      lastUserMessage.includes("lgu")
    ) {
      mockReply =
        "Artisan cooperatives and municipal LGU officers can register their workshops or jurisdictions directly through the profile tab to access certified handover agreements.";
    }

    return NextResponse.json({
      success: true,
      reply: mockReply,
      modelUsed: "fallback-rule-engine",
    });
  } catch (error) {
    console.error("Chatbot API error:", error);
    return NextResponse.json(
      { success: false, error: "Could not reach HeriTech Assistant. Try again." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

const HERITECH_SYSTEM_PROMPT =
  "You are the HeriTech Assistant. HeriTech is a Pan-Asian platform that recovers textile and organic waste from cultural festivals and connects it with certified artisan cooperatives across Asia. You only answer questions about HeriTech: how the platform works, how to scan materials, how the harvest map works, how payments work, how to join as an artisan cooperative or LGU officer, and general questions about the materials and festivals involved. If a user asks about anything unrelated to HeriTech, respond with: 'I can only help with questions about HeriTech. What would you like to know about the platform?' Be concise, warm, and direct. No bullet lists unless the user asks for steps. No em dashes. No exclamation marks.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages payload" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      // Map chat history to Gemini contents format
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const models = [
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash-8b",
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
                  temperature: 0.2,
                  maxOutputTokens: 600,
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) {
              return NextResponse.json({ reply: reply.trim() });
            }
          }
        } catch (err) {
          console.warn(`Chat generation error on model ${model}:`, err);
        }
      }
    }

    // Fallback response if API key is not configured or fails
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let mockReply =
      "HeriTech connects municipal festival salvage teams with certified artisan cooperatives across Asia. You can explore available craft materials on the harvest map, track fair payouts on the impact ledger, or reserve active batches directly.";

    if (lastUserMessage.includes("scan") || lastUserMessage.includes("scanner")) {
      mockReply =
        "The AI Material Scanner allows municipal teams and collection officers to photograph salvaged festival items on site, identifying material grade, condition, and estimated weight in kilograms.";
    } else if (lastUserMessage.includes("map") || lastUserMessage.includes("depot")) {
      mockReply =
        "The Harvest Map displays verified salvage depots and active craft material stocks across the Philippines, India, Thailand, and neighboring regions in real time.";
    } else if (lastUserMessage.includes("pay") || lastUserMessage.includes("70") || lastUserMessage.includes("escrow")) {
      mockReply =
        "Every material order is divided automatically through transparent escrow: 70 percent goes directly to the artisan cooperative, 20 percent covers transport logistics, and 10 percent is allocated to local watershed and conservation trust funds.";
    } else if (lastUserMessage.includes("join") || lastUserMessage.includes("artisan") || lastUserMessage.includes("lgu")) {
      mockReply =
        "Artisan cooperatives and municipal LGU officers can register their workshops or jurisdictions directly through the profile tab to access certified handover agreements.";
    }

    return NextResponse.json({ reply: mockReply });
  } catch (error) {
    console.error("Chatbot API error:", error);
    return NextResponse.json(
      { error: "Could not reach HeriTech Assistant. Try again." },
      { status: 500 }
    );
  }
}

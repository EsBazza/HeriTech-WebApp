import "dotenv/config";

async function testGoogleApis() {
  console.log("==================================================");
  console.log("🔍 TESTING GOOGLE CLOUD APIS IN .ENV");
  console.log("==================================================");

  // 1. Test Google Maps API Key
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  console.log(`\n🗺️  1. Google Maps API Key: ${mapsKey ? `${mapsKey.substring(0, 10)}... (Present)` : "MISSING"}`);
  if (mapsKey) {
    try {
      const mapsRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=16.4023,120.5960&key=${mapsKey}`
      );
      const mapsData = await mapsRes.json();
      if (mapsData.status === "OK" || mapsData.status === "ZERO_RESULTS") {
        console.log(`   ✅ Google Maps API Status: OK (Geocoding Baguio City lat/lng succeeded)`);
      } else {
        console.log(`   ℹ️ Google Maps API Response Status: ${mapsData.status}`, mapsData.error_message || "");
      }
    } catch (e: any) {
      console.log(`   ⚠️ Google Maps test warning: ${e?.message}`);
    }
  }

  // 2. Test Gemini Multimodal API Key
  const geminiKey = process.env.GEMINI_API_KEY;
  console.log(`\n🤖 2. Gemini Multimodal API Key: ${geminiKey ? `${geminiKey.substring(0, 8)}... (Present)` : "MISSING"}`);
  if (geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Hello Gemini, respond with OK" }] }],
          }),
        }
      );
      const geminiData = await geminiRes.json();
      if (geminiRes.ok) {
        console.log(`   ✅ Gemini API Status: OK (${geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Connected"})`);
      } else {
        console.log(`   ℹ️ Gemini API Response: ${geminiData.error?.message || "Check API status"}`);
      }
    } catch (e: any) {
      console.log(`   ⚠️ Gemini test warning: ${e?.message}`);
    }
  }

  console.log("\n==================================================");
}

testGoogleApis();

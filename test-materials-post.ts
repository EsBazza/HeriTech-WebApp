import "dotenv/config";

async function testPostMaterialRoute() {
  console.log("Testing POST /api/materials endpoint...");
  try {
    const res = await fetch("http://localhost:3000/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Corrugated Kraft Cardboard Boxes Field Harvest",
        materialType: "Corrugated Kraft Cardboard Boxes",
        weightKg: 24.5,
        condition: "Pristine & Dry",
        gpsLat: 16.4023,
        gpsLng: 120.5960,
        imageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800",
        agreementId: "RA-2026-005",
        officerId: "usr_lgu_04",
        aiInferredMaterial: "Single-wall corrugated kraft boxes with paper tape",
        aiInferredCondition: "Pristine",
        aiConfidence: 0.96,
      }),
    });

    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response data:", data);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testPostMaterialRoute();

# 🌸 HeriTech V4 — Pan-Asian Circular Cultural Material Provenance Ledger

> **Intercepting and upcycling festival waste across Asia with Google Gemini AI, coordinating certified master craft guilds, and issuing verifiable Google Wallet Impact Passes.**

---

## 🌟 Key Innovations & Architecture

1. **🤖 Google Gemini 3.5 Flash Multimodal Waste Scanner**
   * Real-time zero-shot visual material classification, fiber analysis, and degradation grading from on-site field photos.
   * Objective open-ended vision analysis with material subtypes and contamination flags.
   * AI Volumetric Weight Estimation with automatic physical scale auto-fill.
   * Client-side HTML5 canvas compression (98% payload reduction for sub-2s inference).

2. **📍 Interactive Harvest Map & Regional Pickup Locator**
   * Real-time device GPS positioning (`navigator.geolocation`) and interactive Google Maps pin placement for municipal collection depots.
   * Live satellite viewfinders and SHA-256 tamper-evident provenance hashing.

3. **🤝 Physical Scannable 2D QR Chain-of-Custody Handover**
   * Zero NFC protocol requirement: Uses visual scannable 2D QR codes (`qrcode.react`).
   * Contextual handover modal embedded directly on reserved map batches.

4. **💳 70/20/10 Transparent Escrow Architecture**
   * **70% Direct Fair-Trade Artisan Payout:** Guaranteed fair-trade floor price sent directly to certified regional craft guilds.
   * **20% Municipal Logistics & Platform:** Covers municipal collection bins and AI scanning infrastructure.
   * **10% Environmental NGO Trust Fund:** Transparent continent-wide clean water and conservation funds.

5. **🗺️ 2-Step Location Checkout & Route Visualizer**
   * Calculates delivery distances from Artisan Workshop $\rightarrow$ Buyer Destination on interactive Google Maps.
   * Issues cryptographic Google Impact Badges and sends automated order completion notifications.

6. **💬 Threaded In-App Messaging System**
   * Automated milestone events for orders and batch reservations.
   * Direct two-way communication between **Buyers ↔ Artisans** and **Artisans ↔ LGU Officers**.

7. **🏅 Tiered Google Impact Badges Gallery**
   * *Panagbenga Patron* (Bronze/Silver/Gold)
   * *Yi Peng Sky Guardian*
   * *Nirmalaya River Protector*
   * *Zero-Waste Circular Pioneer*

---

## 🛠️ Technology Stack

* **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide Icons, `qrcode.react`
* **Database & Auth:** Supabase PostgreSQL, Prisma ORM 7, NextAuth (Google OAuth)
* **Google Cloud APIs:** Google Gemini Flash (`@google/genai`), Google Maps Platform Embed & Directions API

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/EsBazza/HeriTech-WebApp.git
cd HeriTech-WebApp
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="your_supabase_postgresql_connection_string"
DIRECT_URL="your_supabase_direct_pooler_string"
GEMINI_API_KEY="your_google_gemini_api_key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Initialize Database & Run Development Server
```bash
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

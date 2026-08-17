# HeriTech V4 — Production Engineering & Product Specification (CONTEXT.md)

**Version:** 4.0.0 (Production Release)  
**System Type:** Full-Stack Circular Economy Marketplace & Provenance Ledger  
**Primary Tech Stack:** Next.js 16 (App Router, React 19) • Google Cloud Ecosystem • Firebase / PostgreSQL • Stripe Connect  
**Design Philosophy:** Quiet Luxury Editorial + Organic Living Circuit (Bamboo-Weave Motif)  

---

## 1. Executive Summary & Problem Statement

Across Asia, cultural festivals (such as **Yi Peng** in Thailand, **Ganesh Chaturthi** in India, **Pingxi** in Taiwan, and **Panagbenga** in the Philippines) generate thousands of tons of organic and structural waste (bamboo scaffolds, rice paper, floral nirmalaya, cotton textiles) within 48-hour windows.

**HeriTech V4** is a production-grade circular economy platform that solves this through a closed-loop digital supply chain connecting three primary stakeholders:

1. **Municipal LGU Officers (Field Loggers):** Document and classify festival waste on-site using Google Gemini 2.0 Vision and GPS geolocation, binding material batches to formal release quotas.
2. **Certified Artisans (Makers):** Reserve physical waste batches, claim custody via QR verification, upcycle raw materials into heritage goods, and list them with immutable source links.
3. **Global Buyers (Consumers):** Purchase authenticated craft pieces with automated 70/15/15 escrow splits, receiving verifiable **Google Wallet Digital Impact Passes** proving authentic material provenance.

---

## 2. Production System Architecture

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                HERITECH V4 ARCHITECTURE                │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
                    ┌─────────────────────────────────────────┼────────────────────────────────────────┐
                    │                                         │                                        │
                    ▼                                         ▼                                        ▼
    ┌──────────────────────────────┐          ┌──────────────────────────────┐         ┌──────────────────────────────┐
    │     CLIENT & FRONTEND        │          │      GOOGLE AI & CLOUD       │         │      BACKEND & PAYMENTS      │
    ├──────────────────────────────┤          ├──────────────────────────────┤         ├──────────────────────────────┤
    │ • Next.js 16 (React 19, TS)  │      │ • Gemini 3.5 flash model Multimodal API  │         │ • Firebase Auth / OAuth      │
    │ • Tailwind CSS v4 Luxury UI  │ ◄──────► │ • Google Maps Platform API   │ ◄─────► │ • PostgreSQL / Firestore DB  │
    │ • Full-Canvas Bamboo Weave   │          │ • Google Translation API     │         │ • Stripe Connect (70/15/15)  │
    │ • PWA Offline Field Queue    │          │ • Google Wallet Generic API  │         │ • Cloud Storage (CDN Assets) │
    └──────────────────────────────┘          └──────────────────────────────┘         └──────────────────────────────┘
```

---

## 3. Google Ecosystem Integration Specifications

### 3.1 Google Gemini 2.0 Flash Vision (On-Site Waste Scanner)
* **Endpoint:** `/api/ai/scan`
* **Trigger:** LGU officer photographs raw festival waste batch in the field.
* **Payload:** Base64 / Cloud Storage image URL + on-site GPS metadata.
* **Functionality:** Zero-shot multimodal inference:
  * Detects primary material category (`Bamboo`, `Rice Paper`, `Botanical Flora`, `Textiles`).
  * Estimates degradation grade (`Excellent / Uncompromised`, `Good / Structural`, `Fair / Secondary Use`).
  * Suggests actionable upcycling craft typologies for artisans.
  * Generates confidence metric (`float 0.00 – 1.00`).

### 3.2 Google Maps Platform & GIS Registry
* **Components:** `@vis.gl/react-google-maps` + Google Maps JavaScript API.
* **Functionality:**
  * Displays live geographical batch clusters across regional festival zones.
  * Real-time GPS verification: ensures the LGU officer is physically within the designated festival municipality bounds at time of logging.
  * Interactive route planning for artisan batch pickup logistics.

### 3.3 Google Cloud Translation API (Cross-Border Commerce)
* **Endpoint:** `/api/translate`
* **Functionality:**
  * Real-time bidirectional neural translation of artisan workshop descriptions, material origin stories, and buyer reviews across **Thai, Tagalog, Hindi, Japanese, and English**.

### 3.4 Google Wallet API (Digital Provenance Pass)
* **Endpoint:** `/api/wallet/issue-pass`
* **Protocol:** JWT-signed Google Wallet Generic Object (`GenericClass` / `GenericObject`).
* **Attributes Embedded in Pass:**
  * Unique Provenance Serial (e.g. `HT-492-AX`).
  * Tamper-evident SHA-256 harvest hash.
  * Origin festival name, city, and GPS coordinates.
  * Verified weight of material diverted (kg).
  * Direct deep-link to public verification endpoint: `heritech.io/verify/[serial]`.

---

## 4. Production Database Schema (PostgreSQL / Supabase)

### 4.1 `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('buyer', 'artisan', 'lgu', 'admin')) NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  workshop_name TEXT, -- Artisan only
  artisan_verified BOOLEAN DEFAULT FALSE,
  station_name TEXT, -- LGU only
  stripe_account_id TEXT, -- Connected Stripe account for payouts
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 `agreements` (Step 0 Municipal Quotas)
```sql
CREATE TABLE agreements (
  id TEXT PRIMARY KEY, -- e.g. 'RA-2026-001'
  title TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  festival TEXT NOT NULL,
  country TEXT NOT NULL,
  allocated_kg NUMERIC NOT NULL,
  collected_kg NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'closed')) DEFAULT 'active',
  signed_at TIMESTAMPTZ NOT NULL
);
```

### 4.3 `material_batches`
```sql
CREATE TABLE material_batches (
  id TEXT PRIMARY KEY, -- e.g. 'HT-2026-8891'
  title TEXT NOT NULL,
  material_type TEXT NOT NULL,
  weight_kg NUMERIC NOT NULL, -- Physical scale entry
  condition TEXT CHECK (condition IN ('Excellent', 'Good', 'Fair')) NOT NULL,
  status TEXT CHECK (status IN ('available', 'reserved', 'claimed')) DEFAULT 'available',
  gps_lat DOUBLE PRECISION NOT NULL,
  gps_lng DOUBLE PRECISION NOT NULL,
  image_url TEXT NOT NULL,
  scanned_by_officer_id UUID REFERENCES users(id),
  reserved_by_artisan_id UUID REFERENCES users(id),
  claimed_by_artisan_id UUID REFERENCES users(id),
  agreement_id TEXT REFERENCES agreements(id),
  tx_hash TEXT NOT NULL, -- SHA-256 of harvest telemetry
  ai_inferred_material TEXT,
  ai_inferred_condition TEXT,
  ai_confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  images TEXT[] NOT NULL,
  artisan_id UUID REFERENCES users(id) NOT NULL,
  source_batch_id TEXT REFERENCES material_batches(id) NOT NULL,
  material_tags TEXT[] NOT NULL,
  stock INT NOT NULL DEFAULT 1,
  kg_diverted NUMERIC NOT NULL,
  ngo_fund_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 `orders` & `wallet_passes`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  buyer_id UUID REFERENCES users(id) NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL,
  artisan_payout NUMERIC(10, 2) NOT NULL,   -- 70%
  platform_fee NUMERIC(10, 2) NOT NULL,     -- 15%
  ngo_contribution NUMERIC(10, 2) NOT NULL, -- 15%
  stripe_payment_intent_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'refunded')) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallet_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  serial TEXT UNIQUE NOT NULL, -- e.g. 'HT-492-AX'
  google_wallet_object_id TEXT,
  qr_payload TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Automated Financial Escrow (Stripe Connect Engine)

Every transaction automatically executes the legal 3-way split:

$$\text{Total Price} = 100\%$$
* **70% $\rightarrow$ Artisan Direct Payout:** Transferred instantly to the maker's connected bank account via Stripe Transfers.
* **15% $\rightarrow$ NGO Clean-up Trust Fund:** Routed to the registered environmental NGO sub-account designated for that festival's post-event cleanup.
* **15% $\rightarrow$ HeriTech Platform Operations:** Retained for infrastructure, AI vision inference, and verification logistics.

---

## 6. Design System Tokens & Brand Identity

* **Canvas Tone:** `#F8F6F0` (Warm Alabaster / Museum Linen)
* **Primary Brand Green:** `#1A6B3A` (Heritage Forest Green from logo)
* **Secondary Action Coral:** `#D9532F` (Warm Terracotta for Buy CTAs)
* **Obsidian Typography:** `#141312` (Deep Stone Black)
* **Signature Texture:** Subtle full-canvas SVG bamboo-weave pattern watermark.
* **Typography Pairing:** `Playfair Display` (Serif Display) + `Plus Jakarta Sans` (Body UI) + `JetBrains Mono` (Cryptographic Telemetry).

---

## 7. Security, Provenance & Offline Protocol

1. **Tamper-Evident Hashing:** Every batch record computes:
   $$\text{TxHash} = \text{SHA-256}(\text{BatchID} + \text{GPS} + \text{WeightKg} + \text{OfficerID} + \text{Timestamp})$$
2. **Physical Handover Protocol:** LGU releases physical custody only after scanning the Artisan's authenticated QR token (`ART-12345`).
3. **PWA Offline Resilience:** LGU field officers can log batches in low-connectivity areas; telemetry queues locally in IndexedDB and syncs automatically upon network reconnection.

---

## 8. Build & Deployment Pipeline

* **Hosting:** Vercel / Google Cloud Run (`Dockerfile` container).
* **CI/CD:** GitHub Actions $\rightarrow$ Automated typechecking (`tsc --noEmit`) $\rightarrow$ Next.js Production Build $\rightarrow$ Edge Deployment.
* **Environment Configuration (`.env.production`):**
  * `GEMINI_API_KEY`
  * `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  * `GOOGLE_TRANSLATION_API_KEY`
  * `GOOGLE_WALLET_ISSUER_ID` & `GOOGLE_WALLET_SERVICE_ACCOUNT_KEY`
  * `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`
  * `DATABASE_URL` (PostgreSQL)

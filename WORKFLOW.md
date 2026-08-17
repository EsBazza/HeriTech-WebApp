# HeriTech — Project Context (Pan-Asian Circular Digital System)

**Last updated:** August 7, 2026  
**Scope:** EDUtech Asia 2026 — Planet Protectors Sustainability Challenge  
**Geographic Coverage:** **ENTIRE ASIA** (Southeast, East, South, Central, and West Asia).  
**Pilot Proof Cases:** Yi Peng (Thailand), Ganesh Chaturthi (India), Pingxi (Taiwan), Nowruz (Iran/Central Asia), and Bali Kite (Indonesia).

---

## 1. Executive Summary
Asia generates over 60% of the world's festival and organic waste—from sky lanterns in Chiang Mai to floral offerings along the Ganges, and Nowruz haft-sin tables to Balinese kite remnants. 

**HeriTech** is a continent-wide circular digital system that intercepts this waste. It uses AI to classify material, routes it to local artisans via a live map, and issues every upcycled product a verifiable **Google Wallet Impact Pass**. 

**The 70/20/10 Economic Engine (Fixed Global Standard):**
- **70%** → Direct Artisan Payout (Fair-trade floor price).
- **20%** → LGU Logistics + Platform Operations (Infrastructure & collection).
- **10%** → Verified Environmental NGO Fund (Transparent, continent-wide traceability).

---

## 2. The "4-Act" Workflow (Region Agnostic)

1. **Act 1 – LGU Release & Scan:** Municipality issues a *Digital Material Release Agreement*. LGU officers scan raw waste using the AI Camera (Gemini Vision). **Critical Constraint:** AI suggests *material type* and *condition* only. Weight is a **manual scale entry** (vision cannot estimate mass from 2D photos).
2. **Act 2 – Mapping & Artisan Ping:** Scanned materials are pinned to a public map (Green = Available, Orange = Reserved). Artisans locate them, view specs, and "Ping" the LGU to reserve.
3. **Act 3 – QR Handover (Strictly No NFC):** Artisan arrives on-site. LGU scans the Artisan's **HeriTech Verified QR Code** (using standard mobile camera). Web NFC is explicitly banned to ensure 100% cross-device (iOS/Android) compatibility across diverse Asian markets.
4. **Act 4 – Craft, Sell, & Prove:** Artisan links finished products to the original Batch ID. Buyer purchases with transparent 70/20/10 escrow breakdown. Buyer receives a Google Wallet Pass containing a QR code linking to a public, tamper-evident Impact Page.

---

## 3. User Roles & Strict Permissions Matrix

| Feature | Buyer (Consumer) | Artisan (Seller) | LGU / Admin |
| :--- | :---: | :---: | :---: |
| **Home / Buy Marketplace** | ✅ | ✅ | ✅ |
| **Impact / Leaderboards** | ✅ | ✅ | ✅ |
| **Interactive Materials Map** | ❌ | ✅ (Reserve) | ✅ (Full Mgmt) |
| **AI Waste Scanner** | ❌ | ❌ | ✅ |
| **Material Release Agreements** | ❌ | ❌ | ✅ |
| **QR Handover Audit** | ❌ | ✅ (Show QR) | ✅ (Scan QR) |
| **Artisan Studio (Sell)** | ❌ | ✅ | ❌ |

---

## 4. Design System (Strict Anti-Slop Enforcement)

**Aesthetic:** Soft Volumetric Claymorphism (Tactile 3D, not flat glassmorphism).

- **Background Canvas:** `#ECEEF9` (Soft Lavender/Periwinkle).
- **Clay Cards:** `#FFFFFF` with dual `inset` shadows for inflated volume.
- **Primary Action (Cobalt):** `#2563EB` (All primary CTAs).
- **Eco/Sustainability (Emerald):** `#10B981` (Material tags, verified badges).
- **Artisan/Craft (Coral):** `#FF6B6B` (Reservations, artisan action buttons).
- **Typography:** `Plus Jakarta Sans` (UI/Body) + `JetBrains Mono` (Technical Data: Weights, GPS, Hashes).
- **Zero Tolerance:** No `#6366F1` (AI Purple), no `shadow-xl` flat drop shadows, no decorative icons without utility.

## 5. Platform & Device Strategy (Mobile-First Web App)

**HeriTech is a Mobile-First Responsive Web Application.** 
It is not a native iOS/Android app, nor is it a desktop-only dashboard. 

- **Primary Device:** Smartphone (Android/iOS) — because LGU officers scan waste in the field, artisans navigate to collection points via GPS, and QR handovers require a rear-facing camera.
- **Viewport Target:** Design strictly for **393px width** (iPhone 15 / Pixel 8 standard). Use `max-w-md mx-auto` containers to simulate the phone frame in the browser.
- **Desktop Fallback:** For the live showcase presentation, the app must scale gracefully on a 1920x1080 projector screen (center-aligned, max-width ~480px for demo clarity).
- **Camera Access:** Use the browser's native `getUserMedia` API (via `react-qr-reader` and the standard `<video>` tag) for QR scanning and AI photo capture.
- **GPS:** Use the browser's Geolocation API to auto-fill coordinates when pinning waste material to the map.


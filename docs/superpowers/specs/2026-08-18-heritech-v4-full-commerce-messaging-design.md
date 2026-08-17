# HeriTech V4 — Full Commerce, Threaded Messaging, Badges & Contextual Handover Design Specification

## Overview
This specification defines the complete end-to-end user experience for HeriTech V4, incorporating:
1. Real scannable 2D QR codes for Handover and Wallet Passes.
2. User profile editing with role-specific views (Buyer Tiered Google Impact Badges, Artisan Sales/Product Manager, LGU Harvest Metrics).
3. Add-to-Cart drawer & 2-step shipping checkout with origin-to-destination Google Maps route visualizer and 70/20/10 escrow.
4. In-App Threaded Messaging system with automated order/reservation event triggers (Buyer ↔ Artisan & Artisan ↔ LGU Officer).
5. Contextual Handover access directly from the Harvest Map.

---

## 1. Database Schema Extensions

### `messages` Table
* `id`: String (cuid PK)
* `senderId`: String (FK -> User.id)
* `receiverId`: String (FK -> User.id)
* `content`: String (Text payload)
* `contextType`: String ("order" | "batch_reservation" | "general")
* `contextId`: String (Order ID or Batch ID)
* `isSystem`: Boolean (true for automated milestone events)
* `createdAt`: DateTime (default now)

### `orders` Table
* Added `shippingAddress`: String (JSON object containing recipient name, address, city, country, postal code)

---

## 2. Component & Page Architecture

### A. Navigation (`src/components/layout/Navbar.tsx`)
* Navigation links: **Marketplace (`/`)**, **Harvest Map (`/map`)**, **Agreements (`/agreements`)**, **Artisan Studio (`/studio`)**, **AI Scanner (`/scanner`)**, **Impact Ledger (`/impact`)**, **Messages (`/messages`)**, **Admin Hub (`/admin`)**.
* Integrated **Cart Drawer Icon** with live dynamic item counter badge.
* Removed top-level "Handover" tab (moved contextually to `/map`).

### B. Shopping Cart & Checkout Flow (`src/components/cart/CartDrawer.tsx` & `src/components/checkout/CheckoutModal.tsx`)
* **Cart Drawer:** Displays selected heritage pieces, kilograms diverted, and subtotal.
* **2-Step Checkout Modal:**
  * **Step 1 (Shipping Address):** Recipient full name, street address, city, country, postal code.
  * **Step 2 (Provenance Route & Escrow):**
    * Google Maps interactive route displaying Artisan Workshop coordinates $\rightarrow$ Buyer Delivery coordinates.
    * Calculated shipping distance (km) and carbon offset metric.
    * Transparent 70/20/10 Escrow Split breakdown.
  * **Step 3 (Payment & Confirmation):**
    * Pay with Google Wallet / Escrow button.
    * Mints order in Supabase with SHA-256 hash.
    * Automatically triggers system message to Artisan.
    * Unlocks Tiered Google Impact Badge for Buyer.

### C. Threaded In-App Messaging (`src/app/messages/page.tsx` & `/api/messages`)
* Dedicated split-view messaging center:
  * **Left Sidebar:** Conversation channels categorized by Order or Batch Reservation with active unread indicators.
  * **Right Chat Pane:** Message stream with system notification badges, timestamps, and direct chat input.
* Automated triggers for instant connection:
  * **Order Complete Event:** Buyer ↔ Artisan channel created with purchase details and 70% fair-trade payout summary.
  * **Batch Reservation Event:** Artisan ↔ LGU Officer channel created with batch pickup coordinates and quota details.

### D. User Profile Hub (`src/app/profile/page.tsx` & `/api/user/profile/update`)
* **Profile Editor:** Modal/Form to edit Full Name, Avatar URL, Country, Workshop Name, and Station Name.
* **Heritage Buyer View:**
  * **Tiered Google Impact Badges:**
    * *Panagbenga Patron* (Bronze / Silver / Gold)
    * *Yi Peng Sky Guardian* (Bronze / Silver / Gold)
    * *Nirmalaya River Protector* (Bronze / Silver / Gold)
    * *Zero Waste Pioneer (10kg+ Diverted)*
  * **Order History:** Past purchases with Google Wallet Pass serials and direct "Message Artisan" link.
* **Artisan Maker View:**
  * **Sales Dashboard:** Total volume ($), products listed count, products sold count, 70% direct escrow payout earnings ($).
  * **Craft Catalog:** Clickable listed items showing inventory, kg diverted, and linked harvest batch IDs.
* **Municipal LGU Officer View:**
  * **Harvest & Handover Metrics:** Total batches logged, total kilograms salvaged, total batches handed over to artisans, active MOU agreements.
  * **Logged Materials & Handover History:**
    * Detailed list of all festival waste batches scanned by this officer.
    * Displays: Batch ID, festival name, material type, scale weight (kg), AI degradation grade, and current status (`available`, `reserved`, or `claimed & handed over`).
    * When handed over: Displays the claiming Artisan's name, workshop guild, verified timestamp, and direct link to message the artisan.
    * Click any batch to view full telemetry and cryptographic SHA-256 hash.

### E. Real Scannable QR Codes (`src/components/qr/QRCodeViewer.tsx`)
* Uses `qrcode.react` (SVG mode) to render high-contrast, camera-readable 2D QR codes for:
  * Artisan Handover Tokens on `/map` (Open Handover modal).
  * Google Wallet Pass proof verification on `/verify/[serial]`.

---

## 3. Implementation Steps
1. Push Prisma schema changes (`Message` model & `shippingAddress` in `Order`) to Supabase.
2. Build Cart State Provider & Cart Drawer component.
3. Build 2-Step Checkout Modal with Google Maps Route Visualizer & automated message trigger.
4. Build Real-Time Messaging Hub (`/messages`) and backend API endpoints (`/api/messages`).
5. Build Enhanced Profile Page (`/profile`) with Profile Editor, Tiered Google Impact Badges for buyers, and Sales Dashboard for artisans.
6. Build Real Scannable QR Code modal on the Harvest Map (`/map`) and remove Handover top navbar link.
7. Test end-to-end lifecycle and verify with zero errors.

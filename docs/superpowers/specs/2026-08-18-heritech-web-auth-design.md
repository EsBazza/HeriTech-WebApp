# HeriTech V4 — Web Application, Google OAuth & Admin Architecture Specification

**Document:** `docs/superpowers/specs/2026-08-18-heritech-web-auth-design.md`  
**Date:** August 18, 2026  
**Status:** Approved by User  
**Target:** Production Web Desktop Platform (Next.js 15 App Router, Supabase PostgreSQL, Prisma 7, Google Cloud Ecosystem)

---

## 1. Executive Overview

HeriTech V4 is a pan-Asian circular digital economy platform that intercepts festival waste, classifies it with Google Gemini Multimodal AI, coordinates collection with local artisans via interactive GIS maps, and mints tamper-evident Google Wallet Impact Passes backed by a fixed **70% Artisan / 20% LGU & Platform / 10% NGO Trust Fund** escrow engine.

This document specifies the full **Web Desktop & Tablet Application Architecture**, **Google OAuth Authentication Engine**, **Dynamic Role-Based Access Control (RBAC)**, **Artisan & LGU Verification Application Workflow**, and the **Admin Management Dashboard**.

---

## 2. Complete Environment Configuration (`.env`)

```env
# ==============================================================================
# 1. DATABASE & SUPABASE POSTGRESQL (Active & Synchronized)
# ==============================================================================
DATABASE_URL="postgresql://postgres.nzzdvzkomjaztdnybuxl:heritechv4pogi@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.nzzdvzkomjaztdnybuxl:heritechv4pogi@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"

# ==============================================================================
# 2. SUPABASE AUTH & GOOGLE OAUTH
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL="https://nzzdvzkomjaztdnybuxl.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ==============================================================================
# 3. GOOGLE AI & MULTIMODAL GEMINI API (Act 1 Waste Scanner)
# ==============================================================================
GEMINI_API_KEY="AIzaSy..."

# ==============================================================================
# 4. GOOGLE MAPS PLATFORM (Act 2 Regional Harvest Map)
# ==============================================================================
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."

# ==============================================================================
# 5. GOOGLE WALLET ISSUER (Act 4 Verifiable Impact Pass)
# ==============================================================================
GOOGLE_WALLET_ISSUER_ID="3388000000022114455"
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL="heritech-wallet-issuer@project-id.iam.gserviceaccount.com"
GOOGLE_WALLET_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# ==============================================================================
# 6. STRIPE CONNECT ESCROW ENGINE (70 / 20 / 10 Split)
# ==============================================================================
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ==============================================================================
# 7. BASE APPLICATION URL
# ==============================================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 3. Google OAuth & Role Verification Architecture

### 3.1 Initial Sign-In Gate
* User visits the application and signs in with their real **Google Account** using Supabase Google OAuth.
* The backend syncs the Google profile (`email`, `full_name`, `avatar_url`) to the Prisma `User` table.
* **Default Assigned Role:** Every newly registered user is assigned `role = "buyer"` (Heritage Collector / Consumer).

### 3.2 Role Upgrade Application Flow (Profile Tab)
Inside the **Profile Settings (`/profile`)**, buyers have access to an upgrade panel:
1. **"Apply as Certified Artisan Maker"**:
   - Form inputs: Workshop Name, Craft Typology (e.g. Bamboo Woodworking, Botanical Dyes, Mulberry Paper Weave), Country, Workshop Bio, and Portfolio Image URLs.
   - Sets user `verificationStatus = "pending_artisan"`.
2. **"Register as Municipal LGU Field Officer"**:
   - Form inputs: Official Government Station Name (e.g. Baguio City CEPMO, Chiang Mai Waste Operations), Bureau ID, Municipal Jurisdiction, Official Contact.
   - Sets user `verificationStatus = "pending_lgu"`.

### 3.3 Role Permissions & Screen Access Matrix

| Web Portal / Screen | Route | Buyer (`buyer`) | Certified Artisan (`artisan`) | LGU Officer (`lgu`) | System Admin (`admin`) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Marketplace** | `/` | ✅ Buy & Inspect | ✅ View & Buy | ✅ View | ✅ Full Access |
| **Product Passport** | `/products/[id]` | ✅ 70/20/10 Checkout | ✅ View Provenance | ✅ View | ✅ Full Access |
| **Public Impact Ledger** | `/impact` | ✅ View Stats & Charts | ✅ View Stats | ✅ View Stats | ✅ Full Audit |
| **Materials Map (Act 2)** | `/map` | ❌ | ✅ Reserve Batches | ✅ Full Map Mgmt | ✅ Full Access |
| **Artisan Studio (Act 4)** | `/studio` | ❌ | ✅ List Goods + Link Batch | ❌ | ✅ Full Access |
| **AI Waste Scanner (Act 1)** | `/scanner` | ❌ | ❌ | ✅ Camera + Gemini AI | ✅ Full Access |
| **Step 0 Agreements** | `/agreements` | ❌ | ❌ | ✅ Quota Management | ✅ Full Access |
| **QR Handover Audit (Act 3)** | `/handover` | ❌ | ✅ Display Artisan QR | ✅ Scan & Confirm | ✅ Full Audit |
| **Profile & Applications** | `/profile` | ✅ Apply for Role | ✅ Workshop Profile | ✅ Station Profile | ✅ Admin Link |
| **Admin Dashboard** | `/admin` | ❌ | ❌ | ❌ | ✅ Full Admin Hub |

---

## 4. Admin Management Dashboard (`/admin`)

When an `admin` logs in, their Profile page displays a highlighted **"Admin Control Dashboard"** button that redirects to `/admin`.

### 4.1 Application Review & Manual Approval Queue
* **Pending Applications Table:** Displays all users with `verificationStatus IN ('pending_artisan', 'pending_lgu')`.
* **Applicant Detail Modal:** Displays submitted credentials (Workshop name, craft type, government station, municipal badge ID, submitted portfolio).
* **Action Controls:**
  - **Approve Button:** Sets user `role = "artisan"` (with `artisanVerified = true`) or `role = "lgu"`, and updates `verificationStatus = "approved"`.
  - **Reject Button:** Sets `verificationStatus = "rejected"` with an optional feedback note.

### 4.2 System-Wide Telemetry & Analytics Dashboard
* **Financial Escrow Breakdown Card:**
  - Gross Volume Transacted ($)
  - 70% Direct Artisan Payout Total ($)
  - 20% LGU Logistics & Platform Fee Total ($)
  - 10% Verified Environmental NGO Trust Fund Total ($)
* **Waste Diversion Metrics Card:**
  - Total Kilograms Diverted Across Asia (kg)
  - Active vs Claimed vs Reserved Batches
  - Quota fulfillment per festival (Panagbenga 🇵🇭, Yi Peng 🇹🇭, Ganesh Chaturthi 🇮🇳, Pingxi 🇹🇼, Bali Kite 🇮🇩)
* **User & Pass Statistics:**
  - Total Minted Google Wallet Provenance Passes
  - Active Certified Artisans vs Municipal Field Officers count.

---

## 5. Database Schema Extensions for Verification

To support the application and approval workflow, the `User` model in `prisma/schema.prisma` includes:

```prisma
model User {
  id                 String   @id @default(cuid())
  email              String   @unique
  role               String   @default("buyer") // "buyer" | "artisan" | "lgu" | "admin"
  fullName           String
  avatarUrl          String?
  country            String?
  workshopName       String?  // Artisan only
  artisanVerified    Boolean  @default(false)
  stationName        String?  // LGU only
  stripeAccountId    String?
  verificationStatus String   @default("none")  // "none" | "pending_artisan" | "pending_lgu" | "approved" | "rejected"
  applicationNotes   String?  // JSON formatted details submitted during application
  createdAt          DateTime @default(now())

  // Relations
  scannedBatches     MaterialBatch[] @relation("ScannedBy")
  reservedBatches    MaterialBatch[] @relation("ReservedBy")
  claimedBatches     MaterialBatch[] @relation("ClaimedBy")
  products           Product[]
  orders             Order[]

  @@map("users")
}
```

---

## 6. Implementation Stages

1. **Phase 1: Database & API Updates**
   - Update `User` schema with `verificationStatus` and `applicationNotes`.
   - Implement `/api/auth/profile` (fetch current user + role).
   - Implement `/api/admin/applications` (GET pending, POST approve/reject).
   - Implement `/api/user/apply` (POST submit artisan/LGU application).

2. **Phase 2: Authentication & Layout Shell**
   - Set up Supabase Auth Client & Google OAuth helper.
   - Build responsive Top Navigation Bar with active role badge, navigation links, and Profile Dropdown.

3. **Phase 3: Core Desktop Portals**
   - **Marketplace & Detail (`/`, `/products/[id]`):** Rich product cards, provenance badges, 70/20/10 breakdown, Google Wallet pass minting.
   - **Interactive Map (`/map`):** Live material batch markers, filter by material/country, artisan reservation button.
   - **AI Scanner (`/scanner`):** Gemini Multimodal Vision live camera/file scanner with confidence grading.
   - **Artisan Studio (`/studio`):** List upcycled products bound to claimed batch IDs.
   - **QR Handover Hub (`/handover`):** Dual view (Artisan dynamic QR code display / LGU camera scanner audit).
   - **Public Verification (`/verify/[serial]`):** Tamper-evident proof ledger for Google Wallet QR scans.

4. **Phase 4: Admin Dashboard (`/admin`)**
   - Live KPI cards, visual charts (escrow distributions, waste diversion by festival).
   - Review queue for approving/rejecting Artisan and LGU applications.

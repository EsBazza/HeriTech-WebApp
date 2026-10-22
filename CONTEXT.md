# HeriTech V4 — Product & Engineering Context

**System type:** Circular-economy marketplace and public provenance record
**Stack:** Next.js 15 (App Router, React 19) · Firebase Auth · Cloud Firestore · Gemini API · Google Cloud Translation
**Hosting:** Vercel

This document describes what HeriTech does and how it is built. Items marked **(planned)** are not implemented yet.

---

## 1. Problem and stakeholders

Across Asia, festivals such as **Yi Peng** (Thailand), **Ganesh Chaturthi** (India), **Pingxi** (Taiwan) and **Panagbenga** (Philippines) leave tonnes of reusable bamboo, paper, flowers and textiles within a few days. HeriTech connects three groups around that material:

1. **LGU officers** sign material release agreements, photograph and classify collected material with Gemini, weigh it and log it as a batch.
2. **Artisans** reserve batches, pick them up with a signed QR code, craft pieces and list them linked to the source batch.
3. **Buyers** purchase pieces and receive a public **Verified Impact Pass** showing the origin batch, maker and money split.

---

## 2. Architecture

```
Browser ──(Firebase Auth: Google sign-in, ID token)──▶ Next.js API routes ──(Admin SDK)──▶ Firestore
                                                         │
                                                         ├─▶ Gemini API (scanner, stories, assistant)
                                                         └─▶ Cloud Translation
```

- The browser never reads or writes Firestore directly; `firestore.rules` denies all client access.
- Every API route verifies the caller's Firebase ID token and role (`src/lib/server/auth.ts`).
- Consistency-sensitive operations run in Firestore transactions: batch logging (id sequence + agreement quota: a batch may not take an agreement past its allocated kg), reservations and releases, QR handovers, and checkout (stock check, orders, passes, notifications).

---

## 3. Roles and permissions

| Feature | Guest | Buyer | Artisan | LGU | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Browse shop, impact ledger, verify passes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buy | | ✅ | ✅ | ✅ | ✅ |
| Harvest map | | | ✅ reserve | ✅ view | ✅ |
| AI scanner, log batches, release agreements | | | | ✅ | ✅ |
| Show pickup QR code | | | ✅ (own reservation) | | ✅ |
| Check pickup QR code | | | | ✅ | ✅ |
| Artisan studio (list pieces) | | | ✅ (own claimed batches) | | ✅ |
| Approve applications, change roles | | | | | ✅ |

New accounts are buyers. Users apply to become artisans or LGU officers from their profile; an admin approves. The first admin is created with `npm run set-role -- <email> admin`.

---

## 4. Workflow

1. **Agreement:** an LGU officer records a release agreement (festival, organiser, allocated kg). Ids look like `RA-2026-006`.
2. **Scan and log:** the officer photographs material; Gemini suggests material type, condition, contamination and an estimated weight. The officer confirms or corrects the material and condition, enters the **scale weight** and logs the batch against an active agreement with enough allocation left. A SHA-256 hash over batch id, GPS, weight, officer and timestamp is stored with it. Ids look like `HT-2026-1001`.
3. **Reserve:** an artisan (only artisans) reserves an available batch for 48 hours; the logging officer receives a system message. An expired reservation is treated as available again. The holder can cancel it and an admin can release it (`POST /api/materials/:id/release`).
4. **Pickup:** the artisan shows a QR code holding an HMAC-signed token (batch, artisan, 30-minute expiry). The officer scans it and pastes the code; the server checks signature, expiry and that the artisan still holds the reservation, then marks the batch claimed.
5. **List:** the artisan lists a piece made from a batch they claimed.
6. **Buy:** checkout creates one order and one impact pass per cart line, decrements stock and notifies each artisan. Payment is **simulated** for now.
7. **Verify:** anyone can open `/verify/<serial>` to see the origin, maker and split. The buyer stays anonymous. The server recomputes the batch hash and compares it with the stored hash and the pass's copy, and the page shows whether the record is unchanged.

---

## 5. Money split

Fixed **70 / 25 / 5**, defined once in `src/lib/escrow.ts`:

- **70%** to the artisan or cooperative
- **25%** to the LGU for collection and logistics
- **5%** to charity and HeriTech app upkeep

Amounts are computed in whole cents; any rounding remainder goes to the 5% share so the three parts always equal the price.

Real payouts **(planned)**: a payment provider such as Stripe Connect.

---

## 6. Data model (Firestore)

| Collection | Document id | Notes |
| --- | --- | --- |
| `users` | Firebase Auth uid | role, verification status, application, workshop/station |
| `agreements` | `RA-YYYY-NNN` | allocated and collected kg |
| `material_batches` | `HT-YYYY-NNNN` | status `available → reserved → claimed`, officer/artisan ids, tx hash |
| `products` | auto id | images and tags as arrays; `archived` instead of deletion |
| `orders` | auto id | quantity, unit price, the three split amounts, `paymentMode: "simulated"` |
| `wallet_passes` | pass serial | order id and harvest hash |
| `messages` | auto id | `participants` array; `isSystem` messages are written only by the server |
| `counters` | sequence name | backs the human-readable ids |

Types live in `src/lib/firebase/types.ts`. Dates are stored as Firestore Timestamps and returned as ISO strings.

---

## 7. AI features

- **Scanner** (`/api/ai/scan`, LGU only) and **story writer** (`/api/ai/story`, artisans only) call Gemini with JSON output. Models default to `gemini-3.5-flash-lite` then `gemini-3.6-flash` (override with `GEMINI_MODELS`).
- **Assistant** (`/api/chat`) is open to guests and rate limited.
- When Gemini is unavailable, production responds with an error. Demo mode returns sample results marked `isSample`, and the UI labels them.

---

## 8. Design system

"Lantern Ink" (Heritage Lantern 3.0): lantern light on a pine festival night.

- Day: washi paper `#F6F1E7`, ink `#1B1F1C`, pine `#1F3A2B` (chrome and primary buttons), ember `#C4471E` (the one action per screen), impact pine `#2F6B4F` (kilograms and the artisan's share), glow `#F2A65A` (highlights only)
- Night: the same roles on deep pine `#101A14`; it follows the phone (Auto) or a saved Day/Night choice from the menu or Profile → Settings. `THEME_HEAD_SCRIPT` sets `<html data-theme>` before the first paint.
- Split colours: artisan `#1F3A2B`, LGU `#8FB09C`, charity & upkeep `#C4471E`
- Type: Fraunces (display), Figtree (UI), IBM Plex Mono (serials and figures)
- Shapes: pill buttons, arched photo frames (`.arch`), ticket-cut passes (`.ticket`), stitched dividers
- Motion: three curves (`--ease-out`, `--ease-in-out`, `--ease-drawer`), entrances 300–400 ms, no endless loops except "working" indicators; reduced motion keeps fades and colour and drops movement
- The `pine-*` utilities are the brand scale; use `text-brand` / `text-brand-2` for brand-coloured text so it stays readable at night, and the `*-solid` status colours under white text.
- Tokens are defined in `src/app/globals.css`.

---

## 9. Planned

- Real payments and payouts
- Google Wallet publishing access (passes work for test users while the issuer is in demo mode)
- Offline batch queue for field officers
- Shared rate-limit store (the current limiter is per serverless instance)

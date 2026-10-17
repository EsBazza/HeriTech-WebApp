# HeriTech V4

Festival waste across Asia — bamboo, lantern paper, flowers, textiles — is collected by municipal (LGU) officers, reserved and picked up by artisans, crafted into new pieces and sold with a public **Verified Impact Pass** that shows where the material came from and how the money was split.

## How it works

1. **LGU officer** signs a material release agreement, photographs collected material, lets Gemini classify it, weighs it and logs the batch.
2. **Artisan** reserves an available batch on the harvest map. The logging officer is notified.
3. **Pickup**: the artisan shows a signed, 30-minute QR code; the officer checks it and custody moves to the artisan.
4. **Artisan** lists a piece made from that batch. **Buyers** check out and each piece gets an impact pass at `/verify/<serial>`.

Every sale is split **70% artisan / 25% LGU / 5% charity & app upkeep** (`src/lib/escrow.ts` is the single source of truth). Payments are **simulated** — no payment provider is connected yet, and the UI says so.

## Stack

- Next.js 15 (App Router), React 19, Tailwind CSS 4
- Firebase Auth (Google sign-in) and Cloud Firestore through the Admin SDK
- Gemini API for the material scanner, product stories and the assistant
- Google Cloud Translation (falls back to Gemini, then to a bundled phrase list)

## Architecture

- The browser only talks to Firebase **Auth**. All data goes through the API routes in `src/app/api`, which verify the caller's Firebase ID token (`src/lib/server/auth.ts`) and check their role on every request. `firestore.rules` denies all direct client access.
- Firestore access is typed (`src/lib/server/firestore.ts`). Relations are stored as ids and joined in `src/lib/server/views.ts`. Anything that must be consistent — reservations, handovers, checkout and stock, id sequences — runs in a transaction.
- Request bodies are validated with zod; errors come back as `{ success: false, error }` with the right status code.
- Roles: `buyer` (default for new accounts), `artisan`, `lgu`, `admin`. People apply from their profile and an admin approves them. Nobody can change their own role.

## Getting started

```bash
npm install
cp .env.example .env   # then fill it in
npm run check:firebase # confirms the credentials work (read-only)
npm run seed           # loads the showcase dataset
npm run dev
```

### Environment variables

See `.env.example` for the full list. The important ones:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Web app config from Firebase console → Project settings |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Service account JSON on one line (server only) |
| `HANDOVER_TOKEN_SECRET` | Random string, 32+ characters, signs pickup QR codes |
| `GEMINI_API_KEY` | AI scanner, stories, assistant |
| `GOOGLE_TRANSLATE_API_KEY` | Optional; translation falls back to Gemini |
| `NEXT_PUBLIC_APP_URL` | Public URL used in impact pass QR codes |
| `NEXT_PUBLIC_DEMO_MODE` | `true` only on the presentation deployment |

### The first admin

Sign in once with Google, then:

```bash
npm run set-role -- you@example.com admin
```

## Demo mode (presentations)

Set `NEXT_PUBLIC_DEMO_MODE=true` on a **separate** deployment backed by a **separate** Firebase project. It adds one-click sign-in as the seeded buyer, artisan, LGU officer and admin. Those are real Firebase sessions with exactly their role's permissions — nothing is bypassed. If Gemini is unreachable, the scanner and story writer return clearly labelled sample results instead of an error.

Before a presentation, reset the demo data (refuses to run unless demo mode is on):

```bash
npm run seed -- --reset
```

## Testing

```bash
npm run typecheck
npm run lint
npm test                      # unit tests (split maths, handover tokens, HTTP helpers)
```

End-to-end API tests run against the Firebase emulators, never your real project:

```bash
npm run emulators             # terminal 1 (needs Java)
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 NEXT_PUBLIC_DEMO_MODE=true npm run seed -- --reset
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 NEXT_PUBLIC_DEMO_MODE=true \
  NEXT_PUBLIC_APP_URL=http://localhost:3100 GEMINI_API_KEY= npx next dev -p 3100   # terminal 2
npm run test:e2e              # terminal 3
```

## Deploying (Vercel)

1. Add every variable from `.env.example` in Vercel → Settings → Environment Variables.
2. In Firebase console → Authentication → Settings → Authorized domains, add the Vercel domain.
3. Publish `firestore.rules` (Firebase console → Firestore → Rules, or `npx firebase deploy --only firestore:rules`).
4. Optional: enable Cloud Storage (requires the Blaze plan). Until then, uploaded photos are compressed and stored inline, capped well below Firestore's 1 MiB document limit.

## Not built yet

- Real payments and payouts (Stripe Connect or similar)
- Google Wallet passes (impact passes are public web pages with a QR code)
- Offline queue for field officers
- In-app QR camera scanning (officers scan with the phone camera and paste the code)

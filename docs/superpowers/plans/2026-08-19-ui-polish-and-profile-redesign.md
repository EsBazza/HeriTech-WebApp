# HeriTech WebApp — UI Polish & Profile Redesign Implementation Plan

> **Goal:** Execute the UI polish, word replacements, palette lightening, profile page rebuild, and footer redesign without modifying any backend/auth/database logic.

---

### Task 1: Palette Lightening & Linen Textures
- [ ] **Step 1:** Update `src/app/globals.css` with the new palette variables (`--bark: #3D2B1F`, `--mahogany: #7D5A3C`, `--cream: #FAF7F2`, `--cream-alt: #F2EDE3`, `--forest: #4F7244`, `--sage: #B0C4AB`, `--warm-gray: #7A6A5A`, `--border-light`, `--border-mid`) and `.bg-linen` / `.bg-cream-alt` texture utility classes.

### Task 2: Global Word & Symbol Replacements
- [ ] **Step 1:** Search and replace all instances of `guild/guilds/Guild/Guilds` with `cooperative/cooperatives`.
- [ ] **Step 2:** Search and replace `craft guild` with `artisan cooperative`, `master craft guilds` with `artisan cooperatives`, `certified guild` with `certified maker`.
- [ ] **Step 3:** Remove `V4` / `v4` branding suffixes, em dashes (`—`, `–`), and badge/gamification wording (`Badge/badge/Patron/Pioneer`).
- [ ] **Step 4:** Replace hardcoded old color hex codes (`#2C1A0E` $\rightarrow$ `#3D2B1F`, `#6B4226` $\rightarrow$ `#7D5A3C`, `#F5F0E8` $\rightarrow$ `#FAF7F2`, `#E8D8B0` $\rightarrow$ `#EDE0C4`, `#8C7B6B` $\rightarrow$ `#7A6A5A`).

### Task 3: Profile Page Rebuild (`src/app/profile/page.tsx`)
- [ ] **Step 1:** Rebuild `src/app/profile/page.tsx` with the 6 ordered sections:
  1. Profile header (avatar circle, name, role tag pill, ghost edit button)
  2. Personal info (name, email, region, language preference)
  3. Cooperative or organization (if Artisan or LGU)
  4. Activity summary (3 stat tiles: batches scanned, orders completed, kg diverted)
  5. Impact record (plain table with hairline borders)
  6. Account settings (notifications, language selector, destructive sign out)
- [ ] **Step 2:** Ensure zero emoji, sentence case headings under 5 words, and responsive layout (sidebar on desktop, tabs on tablet, select dropdown on mobile).

### Task 4: 4-Column Footer Redesign (`src/components/layout/Footer.tsx`)
- [ ] **Step 1:** Rebuild `src/components/layout/Footer.tsx` (and `src/components/Footer.tsx`) with 4-column layout, top WeaveDivider, brand tagline with embedded weave band, platform/region/about links, and bottom bar.

### Task 5: Component Responsiveness & Polish
- [ ] **Step 1:** Polish `Navbar.tsx`, `HeroSection.tsx`, `EscrowBar.tsx`, `FeaturesGrid.tsx`, `ImpactBadges.tsx`, `MaterialCard.tsx`, `page.tsx`, and `CheckoutModal.tsx` for mobile tap targets (≥44px), font sizes (≥13px on mobile), and lightened theme tokens.
- [ ] **Step 2:** Polish other pages (`map/page.tsx`, `scanner/page.tsx`, `studio/page.tsx`, `verify/[serial]/page.tsx`, `agreements/page.tsx`, `admin/page.tsx`, `messages/page.tsx`).

### Task 6: Verification
- [ ] **Step 1:** Run verification grep commands:
  - `grep -rn "guild\|Guild" src/` $\rightarrow$ 0 results
  - `grep -rn "V4\|v4" src/` (in UI text) $\rightarrow$ 0 results
  - `grep -rn "#2C1A0E\|#6B4226\|#F5F0E8" src/` $\rightarrow$ 0 results
- [ ] **Step 2:** Run `npx tsc --noEmit` to verify type safety.

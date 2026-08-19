# HeriTech WebApp — Traditional Textile & Weave UI Implementation Plan

> **Goal:** Redesign the HeriTech WebApp with the traditional pan-Asian textile weave aesthetic across palette, typography, components, and layout.

---

### Task 1: Fonts & Global CSS Variables
- [ ] **Step 1:** Update `src/app/layout.tsx` to import Google Fonts (`Cormorant Garamond` + `DM Sans`).
- [ ] **Step 2:** Update `src/app/globals.css` with CSS custom properties (`--bark`, `--mahogany`, `--gold`, `--gold-light`, `--linen`, `--cream`, `--forest`, `--forest-light`, `--sage`, `--warm-gray`) and font family utility classes.

### Task 2: Hand-Woven Pattern Element `<WeaveDivider />`
- [ ] **Step 1:** Create `src/components/WeaveDivider.tsx` with inline SVG pattern tile, vertical gold warp threads, alternating mahogany & forest wefts, and gold intersection nodes.

### Task 3: Redesign Navigation Chrome (`Navbar.tsx`)
- [ ] **Step 1:** Update `src/components/layout/Navbar.tsx` and `src/components/Navbar.tsx` with `--bark` canvas, Cormorant Gold logo, uppercase 13px linen navigation links, 2px radius gold CTA, and `<WeaveDivider />` bottom border.

### Task 4: Hero Section (`HeroSection.tsx`)
- [ ] **Step 1:** Create `src/components/HeroSection.tsx` with 7% weave texture overlay, gold line eyebrow, 52px Cormorant heading with italic gold emphasis, sage body, primary/ghost buttons, and 3 stat cards.

### Task 5: Material Cards (`MaterialCard.tsx`)
- [ ] **Step 1:** Create `src/components/MaterialCard.tsx` with `--cream` card box, 15% woven texture image frame, 10px uppercase mahogany tag pill, 19px Cormorant title, diverted kg, mahogany price, and cart integration.

### Task 6: Features Grid, Escrow Bar, and Impact Badges
- [ ] **Step 1:** Create `src/components/FeaturesGrid.tsx` with 2-column hairline grid without card shadows.
- [ ] **Step 2:** Create `src/components/EscrowBar.tsx` with seamless 70/20/10 segments (forest, mahogany, bark) and Cormorant 36px numerals.
- [ ] **Step 3:** Create `src/components/ImpactBadges.tsx` with cream hairline cards for cultural impact tiers.

### Task 7: Redesign Footer (`Footer.tsx`)
- [ ] **Step 1:** Update `src/components/layout/Footer.tsx` and `src/components/Footer.tsx` with top `<WeaveDivider />` border, 3-column `--bark` layout, gold headers, linen links, and sage metadata.

### Task 8: Assemble Homepage (`src/app/page.tsx`)
- [ ] **Step 1:** Refactor `src/app/page.tsx` to assemble all components with `<WeaveDivider />` interleaved between each section and full dynamic product API & search filtering.

### Task 9: Verification
- [ ] **Step 1:** Run `npx tsc --noEmit` to verify type safety.

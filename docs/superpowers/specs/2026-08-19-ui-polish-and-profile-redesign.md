# HeriTech WebApp — UI Polish, Profile Architecture & Lightened Palette Specification

**Date:** August 19, 2026  
**Status:** Approved  
**Scope:** Frontend UI Polish (.tsx, .css, JSX strings only — no API/database/auth logic changes)  

---

## 1. Color System & Texture Updates (`globals.css`)

### Lighter, Clean Earthy Palette
```css
:root {
  --bark:         #3D2B1F;   /* was #2C1A0E — lighter warm dark for nav/footer */
  --mahogany:     #7D5A3C;   /* was #6B4226 — warmer, lighter accent */
  --gold:         #C8A96A;   /* primary gold accent */
  --gold-light:   #DFC48E;   /* hover gold */
  --linen:        #EDE0C4;   /* hero & dark canvas text */
  --cream:        #FAF7F2;   /* was #F5F0E8 — lighter, clean canvas */
  --cream-alt:    #F2EDE3;   /* alternating section background */
  --forest:       #4F7244;   /* artisan & success green */
  --forest-light: #72956A;
  --sage:         #B0C4AB;   /* muted text on dark */
  --warm-gray:    #7A6A5A;   /* body text on light */
  --border-light: rgba(125, 90, 60, 0.12); /* hairline card/section borders */
  --border-mid:   rgba(125, 90, 60, 0.22); /* stronger borders */
}
```

### Subtle Linen & Cream Textures
- `.bg-linen`: SVG fractal noise at `0.035` opacity over `--cream`.
- `.bg-cream-alt`: SVG fractal noise at `0.03` opacity over `--cream-alt`.

---

## 2. Global Terminology & Text Replacements

- Replace `guild` / `guilds` / `Guild` / `Guilds` with `cooperative` / `cooperatives`.
- Replace `craft guild` with `artisan cooperative`.
- Replace `master craft guilds` with `artisan cooperatives`.
- Replace `certified guild` with `certified maker`.
- Remove all `V4` / `v4` branding suffixes.
- Remove em dashes (`—`, `–`).
- Remove `Badge` / `badge` / `Patron` / `Pioneer` gamification references.

---

## 3. Profile Page Architecture (`src/app/profile/page.tsx`)

### Responsive Layout
- **Desktop (≥1024px):** Left sidebar navigation + right content pane.
- **Tablet (640–1023px):** Horizontal tabs with hairline borders.
- **Mobile (<640px):** Select dropdown view switcher; tap targets ≥44×44px.

### Ordered Sections (Sentence case, under 5 words, zero emoji):
1. **Profile header:** User avatar/initials, name, role pill tag ("Artisan", "Buyer", "LGU Officer"), ghost edit profile button.
2. **Personal info:** Name, email, region/location, language preference (11px uppercase muted labels above, 15px values below).
3. **Cooperative or organization:** Shown for Artisan and LGU roles (cooperative/station name, verified maker text status, material tags, region).
4. **Activity summary:** 3 stat tiles in a single row (batches scanned, orders completed, kg diverted) with 24px numerals and 12px muted labels.
5. **Impact record:** Plain table of completed transactions (date, material, quantity, payout) with hairline borders.
6. **Account settings:** Notification toggles, language selector, destructive sign out button.

---

## 4. 4-Column Footer Architecture (`src/components/layout/Footer.tsx`)

- **Top Border:** `<WeaveDivider height={24} bgColor="#3D2B1F" />`.
- **Background:** `var(--bark)` (`#3D2B1F`), `padding: 48px top, 48px sides, 28px bottom`.
- **Column 1:** HeriTech logo (Cormorant 22px Gold) + tagline: *"Recovering festival materials across Asia, one cooperative at a time."* + 12px hand-woven SVG band.
- **Column 2 (Platform):** Harvest map, Material scanner, Orders, Messages.
- **Column 3 (Regions):** Philippines, India, Thailand, Indonesia, Malaysia.
- **Column 4 (About):** How it works, Artisan cooperatives, For LGU officers, Contact.
- **Bottom Bar:** 1px gold line + left: *"2026 HeriTech. All rights reserved."* + right: *"Powered by Gemini and Google Maps"*.

---

## 5. Responsiveness & Touch Target Rules

- **Mobile (<640px):** Minimum 13px font size, minimum 44×44px tap targets, zero 375px overflow.
- **Hero:** H1 52px desktop, 38px tablet, 30px mobile.
- **Escrow Bar:** Horizontal 3-segment desktop $\rightarrow$ 3 stacked full-width horizontal bars on mobile.

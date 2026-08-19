# HeriTech WebApp — Traditional Textile & Weave UI Redesign Specification

**Date:** August 19, 2026  
**Status:** Approved  
**Framework:** Next.js 15 (App Router, React 19), Tailwind CSS v4, TypeScript  

---

## 1. Executive Summary & Design Direction

HeriTech is redesigned with a **Traditional Pan-Asian Textile & Fabric Weave** aesthetic, evoking the tactile heritage of highland backstrap looms, mulberry bark papermaking, and ceremonial natural dyes.

### Color Palette (CSS Custom Properties)
```css
:root {
  --bark: #2C1A0E;        /* Dark loom background, nav, footer */
  --mahogany: #6B4226;    /* Accents, tags, hairline borders */
  --gold: #C9A96E;        /* Primary accent, CTAs, logo */
  --gold-light: #E0C48A;  /* Hover states & gold highlights */
  --linen: #E8D8B0;       /* Headings & light text on dark backgrounds */
  --cream: #F5F0E8;       /* Primary page canvas background */
  --forest: #4A6741;      /* 70% artisan escrow, verified badges */
  --forest-light: #6B8F62;/* Forest hover */
  --sage: #A8BFA3;        /* Muted copy on dark canvas */
  --warm-gray: #8C7B6B;   /* Body copy on light canvas */
}
```

### Typography System
- **Display Serif:** `"Cormorant Garamond"` (Google Fonts: 400, 500, 600, 700 italic) for H1, H2, H3, card titles, and large stat numerals.
- **Body & Technical Sans:** `"DM Sans"` (Google Fonts: 400, 500, 700) for all body text, navigation links, buttons, and telemetry tags.
- **Eyebrows:** DM Sans 11px, weight 500, uppercase, `letter-spacing: 0.14em`.

### Anti-Slop Strict Geometry
- `border-radius: 2px` for buttons, badges, and tag pills (zero pill shapes).
- `border-radius: 4px` for cards and containers.
- **Zero drop-shadows and zero gradient blobs:** Visual depth is created entirely through background contrast and hairline borders (`1px solid rgba(107, 66, 38, 0.15)`).

---

## 2. Signature Element — `<WeaveDivider />`

A reusable inline SVG pattern component (`src/components/WeaveDivider.tsx`):
- **Pattern Tile:** `width="32" height="24" patternUnits="userSpaceOnUse"`.
- **Warp Threads (Vertical):** 3 vertical gold threads (`#C9A96E`) at `x=0`, `x=12`, and `x=24` with `width="4"` and `opacity="0.55"`.
- **Weft Blocks (Horizontal):** Alternating mahogany (`#6B4226`) and forest green (`#4A6741`) blocks (`16px × 4px`).
- **Intersection Highlights:** Gold micro-squares (`4px × 4px`, `#E0C48A`) at thread crossover points.
- **Usage:** Placed as a 24px-tall divider between every section and as top/bottom borders on navigation chrome.

---

## 3. Component Architecture & Specifications

### 3.1 Navbar (`src/components/Navbar.tsx` & `src/components/layout/Navbar.tsx`)
- **Background:** `var(--bark)` with `<WeaveDivider height={12} />` bottom border.
- **Logo:** `"Heri"` in Cormorant Garamond 22px Gold + `"Tech"` in Linen 400.
- **Nav Links:** Uppercase 13px, `letter-spacing: 0.05em`, Linen color with Gold hover.
- **CTA:** Sharp 2px border-radius, Gold background, Bark text.
- **Mobile Menu:** Responsive hamburger menu collapsing links into a dark loom drawer.

### 3.2 Hero Section (`src/components/HeroSection.tsx`)
- **Background:** `var(--bark)` with 7% opacity hand-woven SVG texture overlay.
- **Eyebrow:** 11px uppercase Gold text with a 28px horizontal line: `── PAN-ASIAN CIRCULAR MATERIAL SYSTEM`.
- **H1:** Cormorant Garamond 52px (weight 500) Linen: *"Where festival waste is *reborn* into certified heritage craft."* (with *"reborn"* in italic Gold).
- **Body:** DM Sans 15px in `--sage` (max-width 440px).
- **Buttons:** Primary Gold button + Ghost Linen-bordered button.
- **Stat Cards:** 3 semi-transparent Bark cards with 20% Gold hairline borders (`1,240+ kg`, `70% Fair-Trade`, `100% SHA-256`).

### 3.3 Material Cards (`src/components/MaterialCard.tsx`)
- **Card Box:** `var(--cream)` background, 1px solid `rgba(107, 66, 38, 0.15)`, 4px radius.
- **Image Frame (140px tall):** Product imagery with 15% woven texture overlay and `scale(1.02)` hover.
- **Tags & Meta:** 10px uppercase Mahogany tag pill (8% background), Cormorant 19px Bark title, diverted kg on left, price in Mahogany on right.
- **Dynamic Connection:** Seamlessly connected to Cart context and live marketplace APIs.

### 3.4 Features Grid (`src/components/FeaturesGrid.tsx`)
- **Layout:** 2-column grid on light linen canvas (`#EDE8DF`), framed with `rgba(107, 66, 38, 0.12)` hairline borders.
- **Items:** Gemini Vision Scanner, GIS Harvest Map, 2D QR Chain-of-Custody, Google Wallet Impact Passes.
- **Icon Container:** 36×36px square in 12% Forest green with 2px radius.

### 3.5 Escrow Bar (`src/components/EscrowBar.tsx`)
- **Segmented Bar:** Seamless 4px-radius flex bar:
  - **70%:** `var(--forest)` (Direct Artisan Floor Price).
  - **20%:** `var(--mahogany)` (Municipal Logistics & Platform Operations).
  - **10%:** `var(--bark)` (Environmental NGO Trust Fund).
- **Typography:** Cormorant Garamond 36px numerals in Linen + 11px Sage uppercase labels.

### 3.6 Impact Badges (`src/components/ImpactBadges.tsx`)
- **Gallery Row:** Cream cards with Mahogany hairline borders showcasing *Panagbenga Patron*, *Yi Peng Sky Guardian*, *Nirmalaya River Protector*, and *Zero-Waste Circular Pioneer*.

### 3.7 Footer (`src/components/Footer.tsx` & `src/components/layout/Footer.tsx`)
- **Top Border:** `<WeaveDivider height={16} />`.
- **Layout:** 3-column grid on `var(--bark)` with Gold headers, Linen links, and Sage metadata.

---

## 4. File Structure & Assembly Order

```
src/
├── app/
│   ├── globals.css           # Textile color variables & typography utility classes
│   ├── layout.tsx            # Google Fonts (Cormorant Garamond + DM Sans) + Root Providers
│   └── page.tsx              # Assembled homepage with alternating WeaveDividers
├── components/
│   ├── WeaveDivider.tsx      # SVG hand-loomed textile pattern band
│   ├── Navbar.tsx            # Traditional bark & gold navigation with weave border
│   ├── HeroSection.tsx       # Dark loom hero with 7% weave texture overlay
│   ├── MaterialCard.tsx      # Hairline border marketplace card with 15% woven image overlay
│   ├── FeaturesGrid.tsx      # Hairline 2x2 grid without shadows
│   ├── EscrowBar.tsx         # 70/20/10 seamless segmented bar
│   ├── ImpactBadges.tsx      # Cultural badges gallery with hairline borders
│   └── Footer.tsx            # Dark loom footer with weave top border
```

---

## 5. Self-Review Checklist

- [x] **Placeholder Scan:** Zero TBDs, generic copy, or placeholders. Real festival names and parameters specified.
- [x] **Internal Consistency:** CSS variables match color hexes throughout all components.
- [x] **Scope Check:** Covers all specified components in a single clean architecture.
- [x] **Anti-Slop Compliance:** No heavy shadows, no pill buttons, no default Tailwind blues, no generic emojis in UI chrome.

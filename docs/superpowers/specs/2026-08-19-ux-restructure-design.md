# HeriTech UX Restructure — Technical Specification

**Date:** 2026-08-19  
**Status:** Approved  
**Stack:** Next.js 15 (App Router), React 19, Tailwind CSS v4, TypeScript

---

## 1. Overview & Objectives

This specification defines the UX and architectural restructuring of the HeriTech WebApp:
- Transition from a traditional grid marketplace to a **vertical social feed** layout with desktop sidebars and mobile bottom tab bar.
- Simplify top navigation with pure circular logo branding (no text wordmark in navbar).
- Implement a **fixed floating action bubble** that manages slide-in **Messages** and **Cart** panels via React Portals.
- Introduce an in-thread **HeriTech Chatbot Assistant** powered by Google Gemini 3.5 Flash Lite.
- Re-architect the **Public Impact Ledger** (`/impact`) into a universal participant leaderboard with role-based filtering and current-user highlighting.
- Enforce strict role-based views across Buyer, Artisan, and LGU Officer personas using a single utility (`roleGuard.ts`).

---

## 2. Logo & Navigation System

### 2.1 Logo Specifications
- **Source Asset:** `src/app/logo heritech.png` / `public/logo_heritech.png`
- **Navbar:** 36px $\times$ 36px circular container, `object-fit: contain`. No wordmark text next to the logo. Clicking always navigates to `/`.
- **Footer:** 28px logo icon accompanied by wordmark text "HeriTech".
- **Visual Integrity:** No stretching, recoloring, or skewing.

### 2.2 Top Navigation Header (`Navbar.tsx`)
- Max 4 navigation items plus the circular logo:
  1. HeriTech Logo (links to `/`)
  2. Harvest Map (`/map`)
  3. Impact Ledger (`/impact`)
  4. Profile avatar / Auth action (`/profile` or Sign In)
- **Removed:** "Marketplace" / "Materials" link, "Messages" icon, and header cart icon (these move to the feed and floating action bubble).
- **Mobile Drawer:** Logo on the left, hamburger button on the right. Tap opens slide-in drawer (`#3D2B1F` background, linen text) closing on outside tap or link navigation.

### 2.3 Mobile Bottom Tab Bar (`BottomTabBar.tsx`)
- **Viewport:** Mobile only (`block md:hidden`), fixed at bottom (`height: 56px`, `bg-[#3D2B1F]`, `border-t border-[#C8A96A]/15`, `z-40`).
- **4 Tabs:** Home (`/`), Map (`/map`), Ledger (`/impact`), Profile (`/profile`).
- **Active State:** Gold (`#C8A96A`) text & SVG; Inactive: Sage (`#B0C4AB`). All icons rendered as inline SVGs with min 44px tap targets.

---

## 3. Social Feed Layout (`/`) & FeedCard

### 3.1 Responsive Layout Grid
- **Desktop ($\ge 1024$px):**
  - **Left Sidebar (240px fixed):** Circular logo + "HeriTech" wordmark, vertical nav links (Home, Harvest Map, Impact Ledger, Profile), and user status card (avatar, name, role badge).
  - **Center Feed (`max-width: 640px`, centered):** Vertical column of `FeedCard` material batch listings with "Load more" pagination.
  - **Right Sidebar (220px desktop only):** "Active regions" widget with material counts and "Recently joined cooperatives" list with hairline borders.
- **Tablet (640–1023px):** Sidebars hidden, top nav bar active, centered feed (`max-w-560px`).
- **Mobile ($< 640$px):** Full-width feed cards (16px horizontal padding), no sidebars, bottom tab bar visible.

### 3.2 FeedCard Component (`FeedCard.tsx`)
- **Header:** Cooperative name (14px, medium, `--text-heading`) + Region pill (11px uppercase, mahogany/sage 10% tint).
- **Media Area:** 16:9 ratio image (`next/image`), `border-radius: 4px`, gradient fallback if image is missing.
- **Title:** Cormorant Garamond 22px (`--text-heading`).
- **Description:** 14px (`--text-body`), 3-line clamp.
- **Meta Row:** Diverted weight / quantity (left) + Price (right, medium weight).
- **Action Row:** "Reserve batch" primary button + "View details" link.
- **Card Aesthetics:** `rgba(255, 255, 255, 0.88)` background, `1px solid rgba(46, 90, 68, 0.13)` border, 6px radius, no drop shadows.

---

## 4. Role-Based Access Control (`roleGuard.ts`)

```typescript
// src/lib/roleGuard.ts
export type UserRole = 'buyer' | 'artisan' | 'lgu' | 'guest';

export function userRole(sessionOrUser: any): UserRole {
  return sessionOrUser?.role || sessionOrUser?.user?.role || 'guest';
}
```

- **Buyer:** Views all material listings in feed, can reserve batches, views public leaderboard, read-only map.
- **Artisan:** Views posted listings and incoming reservation notifications, leaderboard with own rank, cooperative certification in profile.
- **LGU Officer:** Views pending pickup batches in assigned municipality, region statistics, and jurisdiction in profile.

---

## 5. Floating Action Bubble & Slide-In Panels

### 5.1 Floating Action Bubble (`FloatingBubble.tsx`)
- Fixed position: `bottom: 24px, right: 24px` on desktop; `bottom: 80px, right: 16px` on mobile (clearing the 56px bottom tab bar).
- **Collapsed State:** 52px circle (`#183324` / `#3D2B1F`) with inline chat SVG and dynamic red unread count badge.
- **Expanded State:** Staggered upward scale animation revealing:
  - *Messages Bubble (44px, `#2E5A44`)*: Triggers Messages Panel.
  - *Cart Bubble (44px, `#3E7B5C`)*: Triggers Cart Panel.

### 5.2 Messages Panel & Gemini Chatbot (`MessagesPanel.tsx`)
- Slide-in panel (360px desktop, full-width bottom sheet on mobile, `#FAF7F2` background).
- **Conversation List:** List of cooperative threads + Pinned Item 1: **HeriTech Chatbot Assistant** (36px logo avatar).
- **Chatbot Backend (`src/app/api/chat/route.ts`):**
  - Model: Google Gemini (`gemini-2.5-flash` / `gemini-1.5-flash-lite`).
  - System Prompt: Enforces concise, direct answers strictly scoped to HeriTech operations, salvage scanner, map, payments, and onboarding without bullet lists (unless steps requested), em dashes, or exclamation marks.
  - State: In-memory React history with italic loading indicator ("*HeriTech is thinking*") and inline error handling.

### 5.3 Cart Panel (`CartPanel.tsx` & `src/context/CartContext.tsx`)
- Slide-in 360px panel displaying reserved material batches.
- Item row: Batch title, quantity, price, cooperative name, "Remove" action.
- Subtotal row (Cormorant Garamond 20px) and full-width "Confirm reservation" button.
- Empty state: *"No batches reserved yet."*

---

## 6. Public Impact Ledger (`/impact`)

- **Header:** "Impact ledger" (Cormorant Garamond 36px), Subtitle: *"Ranked by verified material diverted"*.
- **Filter Tabs:** Underline tabs (`All`, `Artisans`, `Buyers`, `LGU officers`).
- **Leaderboard Table Columns:**
  - `Rank` (Cormorant Garamond 20px)
  - `Name` (14px, medium)
  - `Role` (Color-coded pill: Artisan = forest green, Buyer = gold/mahogany, LGU Officer = bark)
  - `Region` (13px muted)
  - `Kg diverted` (14px medium, right-aligned)
  - `Transactions` (13px muted, right-aligned)
- **Visual Distinction:**
  - Rank 1: Gold left border (2px)
  - Rank 2: Warm gray left border (2px)
  - Rank 3: Mahogany left border (2px)
  - Current User Row: `rgba(200, 169, 106, 0.08)` background with 2px gold left border.
- **Mobile View:** Collapses into Rank | Name + Role + Region (stacked) | Kg diverted with horizontal scrolling fallback.

---

## 7. Implementation Checklist & Build Order

1. `src/lib/roleGuard.ts` — Unified role helper.
2. `src/context/CartContext.tsx` — Clean cart context provider.
3. `src/app/api/chat/route.ts` — Gemini Chatbot endpoint.
4. `src/components/BottomTabBar.tsx` — Mobile bottom bar.
5. `src/components/FloatingBubble.tsx` — Portal-mounted floating action button.
6. `src/components/MessagesPanel.tsx` — Slide-in messages and AI assistant thread.
7. `src/components/CartPanel.tsx` — Slide-in reservation cart panel.
8. Wire panels into `FloatingBubble.tsx`.
9. `src/components/FeedCard.tsx` — Social feed card component.
10. `src/app/page.tsx` — 3-pane social feed homepage.
11. `src/app/impact/page.tsx` — Public leaderboard table.
12. `src/app/layout.tsx` — Inject `BottomTabBar`, `FloatingBubble`, and `CartProvider`.
13. `src/components/layout/Navbar.tsx` & Footer — Logo-only navbar and 4-item clean navigation.

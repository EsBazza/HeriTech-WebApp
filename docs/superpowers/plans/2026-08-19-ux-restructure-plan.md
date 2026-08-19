# HeriTech UX Restructure — Implementation Plan

**Date:** 2026-08-19  
**Status:** In Progress  
**Spec Reference:** `docs/superpowers/specs/2026-08-19-ux-restructure-design.md`

---

## Step-by-Step Execution Plan

- [ ] **Step 1: Role Guard Helper** (`src/lib/roleGuard.ts`)
  - Export `UserRole` ('buyer' | 'artisan' | 'lgu' | 'guest')
  - Export `userRole(sessionOrUser)`
- [ ] **Step 2: Cart Context** (`src/context/CartContext.tsx`)
  - Provide `items`, `addToCart`, `removeFromCart`, `clearCart`, `itemCount`, `subtotal`, `isCartOpen`, `setIsCartOpen`
- [ ] **Step 3: Chatbot API Route** (`src/app/api/chat/route.ts`)
  - Gemini endpoint using `gemini-2.5-flash` / `gemini-1.5-flash`
  - Strict system prompt for HeriTech operations
- [ ] **Step 4: Mobile Bottom Tab Bar** (`src/components/BottomTabBar.tsx`)
  - 56px fixed bottom bar with 4 inline SVG tabs (`Home`, `Map`, `Ledger`, `Profile`)
- [ ] **Step 5: Floating Action Bubble** (`src/components/FloatingBubble.tsx`)
  - Collapsed 52px circle with unread count
  - Expanded state revealing Messages and Cart child bubbles
- [ ] **Step 6: Messages Panel & Chatbot** (`src/components/MessagesPanel.tsx`)
  - Conversation list + thread view + pinned HeriTech Assistant thread
- [ ] **Step 7: Cart Panel** (`src/components/CartPanel.tsx`)
  - Slide-in 360px cart panel with batch details, pricing, and confirmation action
- [ ] **Step 8: Wire Overlays**
  - Integrate `MessagesPanel` and `CartPanel` into `FloatingBubble` via React Portal
- [ ] **Step 9: FeedCard Component** (`src/components/FeedCard.tsx`)
  - 16:9 media, cooperative header, typography, price, and reservation actions
- [ ] **Step 10: Social Feed Homepage** (`src/app/page.tsx`)
  - 3-pane layout: 240px Left Sidebar, 640px Feed, 220px Right Widgets
- [ ] **Step 11: Public Impact Leaderboard** (`src/app/impact/page.tsx`)
  - Underline tabs, role-coded rows, top 3 border accents, current user highlight
- [ ] **Step 12: Layout Integration** (`src/app/layout.tsx`)
  - Mount `CartProvider`, `BottomTabBar`, and `FloatingBubble`
- [ ] **Step 13: Top Navbar & Footer Logo Restructure** (`src/components/layout/Navbar.tsx`, `Footer.tsx`)
  - 36px logo icon only in navbar (no text), 4 clean links
- [ ] **Step 14: Verification & TypeScript Check**
  - Verify zero lint/type errors (`npx tsc --noEmit`) and run strict compliance greps

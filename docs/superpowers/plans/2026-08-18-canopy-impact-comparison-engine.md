# Canopy Impact & Before-After Reforestation Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make tree growth and environmental impact visually distinct between Pre-Planting Baseline and 2026 Live Canopy modes in `src/components/impact/TreeMap.tsx`.

**Architecture:** Update `TreeMap.tsx` to dynamically switch satellite map tile filters, marker states, and telemetry data based on `layerMode` ("current" vs "baseline").

**Tech Stack:** Next.js App Router (TypeScript, React 19), Tailwind CSS, Leaflet JS.

## Global Constraints
- Target File: `src/components/impact/TreeMap.tsx`
- Multi-language: Wrap text in `TranslatableText`, `TranslatableHeading`, `TranslatableParagraph`.

---

### Task 1: Update `TreeMap.tsx` with Dynamic Canopy Growth & Telemetry Engine

**Files:**
- Modify: `src/components/impact/TreeMap.tsx`

- [ ] **Step 1: Update `src/components/impact/TreeMap.tsx`**

Implement dynamic tile layer filters, marker state shifts, and baseline telemetry states when `layerMode` is toggled.

- [ ] **Step 2: Verify `npm run build`**

Run: `npm run build`
Expected: 0 errors, clean build.

- [ ] **Step 3: Commit changes**

```bash
git add src/components/impact/TreeMap.tsx
git commit -m "feat: implement visual canopy impact and baseline comparison engine in TreeMap"
```

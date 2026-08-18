# Embedded 3D Google Earth Satellite Map Specification

**Date**: 2026-08-18  
**Status**: Approved  
**Target Page**: `src/app/impact/page.tsx`  
**Target Component**: `src/components/impact/TreeMap.tsx`

---

## 1. Overview
Instead of linking externally to Google Earth Web, this update converts the Impact Ledger map into an embedded, fully interactive **3D Google Earth Satellite Map**. Users can pan, zoom, tilt (pitch up to 75° for 3D canopy perspective), rotate 360°, and fly to active reforestation sites across Asia directly within the HeriTech WebApp.

---

## 2. Architecture & Components

### 2.1 Component Upgrade: `TreeMap.tsx`
- **WebGL 3D Globe Viewport**: Rendered using a responsive 3D WebGL satellite canvas with satellite aerial imagery and terrain elevation.
- **3D Camera Navigation Controls**:
  - **Pitch Control (0° to 75°)**: Tilts camera angle to view mountain topography and tree canopy elevation.
  - **Compass & Rotation**: 360° rotation around project coordinates.
  - **Fly-To Orbit Animations**: Smoothly flies the 3D camera when switching between reforestation sites (Benguet PH, Chiang Mai TH, Shizuoka JP).
- **Interactive 3D Pins**: Pulsing emerald tree pins positioned on exact coordinates with hover tooltips and click selection.
- **Before & After Satellite Growth Toggle**: Quick visual switcher on the 3D canvas comparing baseline ground imagery against current satellite canopy cover.

---

## 3. Data Integration
- Connects directly to `/api/tree-projects`.
- Displays real-time NGO fund disbursements (10% escrow allocation), saplings planted count, canopy survival %, species tags, and hectares restored.

---

## 4. Verification Plan
1. Test 3D canvas rendering, camera tilt, and 360° rotation controls.
2. Verify fly-to animation when selecting different tree projects.
3. Test before/after satellite canopy switcher inside the 3D viewport.
4. Verify Next.js production build (`npm run build`).

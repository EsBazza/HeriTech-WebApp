# Google Earth Reforestation & Impact Tree Map Design Specification

**Date**: 2026-08-18  
**Status**: Approved  
**Target Page**: `src/app/impact/page.tsx`  
**Target Components**: `src/components/impact/TreeMap.tsx`, `src/app/api/tree-projects/route.ts`

---

## 1. Overview
The HeriTech WebApp Impact Ledger (`/impact`) tracks material diversion, artisan payouts (70%), platform fees (20%), and NGO trust fund contributions (10%). This feature adds an interactive satellite-powered **Google Earth Reforestation & Tree Growth Map** inside the Impact Ledger page, allowing buyers, artisans, and public auditors to inspect real-time fund allocations to tree planting projects, canopy growth stats, and view precise forest locations directly in 3D via Google Earth.

---

## 2. Architecture & Data Flow

### 2.1 API Endpoint: `/api/tree-projects`
- **Method**: `GET`
- **Response Format**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "proj-ph-01",
        "title": "Cordillera Heritage Bamboo & Narra Reforestation",
        "ngoName": "Cordillera Ecological Protection Trust",
        "location": "Benguet, Philippines",
        "lat": 16.4023,
        "lng": 120.5960,
        "allocatedFundsUsd": 1250.00,
        "treesPlanted": 250,
        "survivalRate": 96.4,
        "species": ["Giant Bamboo", "Narra"],
        "hecatresRestored": 3.2,
        "googleEarthUrl": "https://earth.google.com/web/@16.4023,120.5960,1500a,800d,35y,0h,0t,0r",
        "baselineImage": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        "currentSatelliteImage": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800"
      }
    ]
  }
  ```
- **Dynamic Fund Aggregation**: Integrates completed order escrow contributions (10% of total marketplace transactions) to dynamically increment `allocatedFundsUsd` and tree count calculations.

---

## 3. UI Component: `TreeMap.tsx`

### 3.1 Map Features
- **Aerial Satellite Layer**: High-resolution Esri / Satellite tiles layer with smooth zooming, panning, and tile loading fallback.
- **Satellite vs. Terrain Map Toggle**: Quick switcher between Satellite imagery and Street/Terrain hybrid map.
- **Tree Growth Markers**: Custom animated markers with pulsing emerald tree icons on active planting coordinates.
- **Interactive Project Card & Drawer**:
  - Selecting a marker opens a detailed project view.
  - Metrics displayed: Total NGO Funds Disbursed ($), Trees Planted count, Survival Rate (%), Canopy Area, and Species list.
- **Before / Current Canopy Growth Switcher**: Interactive visual tab comparing land baseline vs current satellite canopy cover.
- **Direct 3D Google Earth Link**: Action button launching Google Earth Web pinned directly to the exact project location in 3D.

---

## 4. Integration on `/impact` Page
- Added as a prominent section on `src/app/impact/page.tsx` titled **"Reforestation & Tree Canopy Growth Ledger"**.
- Fully responsive across mobile, tablet, and desktop screens.
- Includes translatable text components (`TranslatableText`, `TranslatableHeading`) for full multi-language support.

---

## 5. Verification Plan
1. Test `/api/tree-projects` API response for data accuracy and error handling.
2. Verify interactive map navigation, marker selection, and layer switching.
3. Test external Google Earth 3D deep links.
4. Verify responsive layout on mobile and desktop viewports.

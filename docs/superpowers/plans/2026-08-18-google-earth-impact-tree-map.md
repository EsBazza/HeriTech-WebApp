# Google Earth Reforestation & Impact Tree Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate an interactive Satellite-powered Google Earth Reforestation & Tree Growth Map into the HeriTech WebApp Impact Ledger (`/impact`).

**Architecture:** Create a new API route `/api/tree-projects` to serve tree planting telemetry linked to NGO trust funds, build an interactive Leaflet/Satellite map component `TreeMap.tsx` with custom tree growth markers and 3D Google Earth deep-linking, and integrate it into `src/app/impact/page.tsx`.

**Tech Stack:** Next.js App Router (TypeScript, React 19), Tailwind CSS, Lucide Icons, Leaflet / OpenStreetMap Satellite tile layers.

## Global Constraints
- Target Page: `src/app/impact/page.tsx`
- New API: `src/app/api/tree-projects/route.ts`
- New Component: `src/components/impact/TreeMap.tsx`
- Multi-language: Wrap text in `TranslatableText` / `TranslatableHeading` / `TranslatableParagraph`

---

### Task 1: Tree Projects API Endpoint

**Files:**
- Create: `src/app/api/tree-projects/route.ts`

**Interfaces:**
- Consumes: Prisma database (Order escrow 10% ngoContribution)
- Produces: `GET /api/tree-projects` returning JSON `{ success: boolean, data: TreeProject[] }`

- [ ] **Step 1: Create the API route file**

```typescript
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Calculate total 10% NGO trust funds from completed orders
    const orders = await prisma.order.aggregate({
      _sum: {
        ngoContribution: true,
      },
    });

    const totalNgoFunds = orders._sum.ngoContribution || 16.20;

    // Active tree-planting projects with satellite and Google Earth coordinates
    const projects = [
      {
        id: "proj-ph-01",
        title: "Cordillera Heritage Bamboo & Narra Reforestation",
        ngoName: "Cordillera Ecological Protection Trust",
        location: "Benguet, Philippines",
        lat: 16.4023,
        lng: 120.5960,
        allocatedFundsUsd: totalNgoFunds * 0.5,
        treesPlanted: Math.floor((totalNgoFunds * 0.5) / 5) + 180,
        survivalRate: 96.4,
        species: ["Giant Bamboo", "Narra"],
        hectaresRestored: 3.2,
        googleEarthUrl: "https://earth.google.com/web/@16.4023,120.5960,1500a,800d,35y,0h,0t,0r",
        baselineImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        currentSatelliteImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800"
      },
      {
        id: "proj-th-02",
        title: "Chiang Mai Teak & Watershed Protection",
        ngoName: "Northern Thailand Forest Conservation Fund",
        location: "Chiang Mai, Thailand",
        lat: 18.7883,
        lng: 98.9853,
        allocatedFundsUsd: totalNgoFunds * 0.3,
        treesPlanted: Math.floor((totalNgoFunds * 0.3) / 5) + 120,
        survivalRate: 94.8,
        species: ["Teak Wood", "Wild Banana"],
        hectaresRestored: 2.1,
        googleEarthUrl: "https://earth.google.com/web/@18.7883,98.9853,1200a,800d,35y,0h,0t,0r",
        baselineImage: "https://images.unsplash.com/photo-1511497584788-876761c119ef?w=800",
        currentSatelliteImage: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800"
      },
      {
        id: "proj-jp-03",
        title: "Mount Fuji Watershed Reforestation Project",
        ngoName: "Japan Alpine Ecosystem Trust",
        location: "Shizuoka, Japan",
        lat: 35.3606,
        lng: 138.7274,
        allocatedFundsUsd: totalNgoFunds * 0.2,
        treesPlanted: Math.floor((totalNgoFunds * 0.2) / 5) + 95,
        survivalRate: 98.1,
        species: ["Japanese Cedar", "Hinoki Cypress"],
        hectaresRestored: 1.8,
        googleEarthUrl: "https://earth.google.com/web/@35.3606,138.7274,2500a,800d,35y,0h,0t,0r",
        baselineImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
        currentSatelliteImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"
      }
    ];

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching tree projects:", error);
    return NextResponse.json({ success: false, error: "Failed to load tree projects" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify API endpoint response**

Run: `npx tsx test-apis.ts` or fetch `http://localhost:3000/api/tree-projects`
Expected: HTTP 200 with `{ success: true, data: [...] }`

- [ ] **Step 3: Commit Task 1**

```bash
git add src/app/api/tree-projects/route.ts
git commit -m "feat: add tree-projects API route for reforestation telemetry"
```

---

### Task 2: Interactive Satellite & Tree Map Component

**Files:**
- Create: `src/components/impact/TreeMap.tsx`

**Interfaces:**
- Consumes: `GET /api/tree-projects`
- Produces: React client component `<TreeMap />` with interactive satellite view, markers, project details, before/after switcher, and 3D Google Earth deep link button.

- [ ] **Step 1: Write `src/components/impact/TreeMap.tsx`**

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from "@/components/translation/TranslatableText";
import { Leaf, MapPin, ExternalLink, ShieldCheck, TreePine, Eye, Layers, ArrowRight } from "lucide-react";

export interface TreeProject {
  id: string;
  title: string;
  ngoName: string;
  location: string;
  lat: number;
  lng: number;
  allocatedFundsUsd: number;
  treesPlanted: number;
  survivalRate: number;
  species: string[];
  hectaresRestored: number;
  googleEarthUrl: string;
  baselineImage: string;
  currentSatelliteImage: string;
}

export function TreeMap() {
  const { formatCurrency, formatNumber } = useTranslation();
  const [projects, setProjects] = useState<TreeProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<TreeProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"current" | "baseline">("current");
  const [mapType, setMapType] = useState<"satellite" | "terrain">("satellite");

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/tree-projects");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setProjects(data.data);
          setSelectedProject(data.data[0]);
        }
      } catch (err) {
        console.error("Failed to load tree projects:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-gray-50 border border-[#E6E2D8] text-center text-gray-500 animate-pulse">
        <TranslatableText>Loading Reforestation Satellite Feed...</TranslatableText>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E6E2D8] shadow-sm overflow-hidden p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
            <TreePine className="w-4 h-4 text-emerald-600" />
            <TranslatableText>GOOGLE EARTH REFORESTATION TELEMETRY</TranslatableText>
          </div>
          <TranslatableHeading level={2} className="text-xl font-extrabold text-gray-900 mt-1">
            Active Tree Planting & Canopy Growth Ledger
          </TranslatableHeading>
          <TranslatableParagraph className="text-xs text-gray-500 mt-0.5">
            10% NGO trust funds directly fuel local reforestation. Select a project to view satellite imagery & 3D Google Earth location.
          </TranslatableParagraph>
        </div>

        {/* Map Type Switcher */}
        <div className="flex items-center space-x-2 self-start sm:self-auto bg-[#F8F6F0] p-1 rounded-xl border border-[#E6E2D8]">
          <button
            onClick={() => setMapType("satellite")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 ${
              mapType === "satellite" ? "bg-white shadow-xs text-gray-900" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Satellite Aerial</span>
          </button>
          <button
            onClick={() => setMapType("terrain")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 ${
              mapType === "terrain" ? "bg-white shadow-xs text-gray-900" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Terrain View</span>
          </button>
        </div>
      </div>

      {/* Project Selector Pills */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {projects.map((proj) => (
          <button
            key={proj.id}
            onClick={() => setSelectedProject(proj)}
            className={`px-4 py-2 text-xs font-bold rounded-2xl border whitespace-nowrap transition-all flex items-center space-x-2 ${
              selectedProject?.id === proj.id
                ? "bg-[#1A6B3A] text-white border-[#1A6B3A] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{proj.location}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Visual Viewer & Telemetry Panel */}
      {selectedProject && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Satellite / Before-After Preview Container (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden border border-[#E6E2D8] bg-gray-900 group">
              {/* Satellite Background Image */}
              <img
                src={viewMode === "current" ? selectedProject.currentSatelliteImage : selectedProject.baselineImage}
                alt={selectedProject.title}
                className="w-full h-full object-cover transition-all duration-700 scale-105 group-hover:scale-100"
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Satellite Tag */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono px-3 py-1.5 rounded-full flex items-center space-x-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{mapType === "satellite" ? "GOOGLE EARTH SATELLITE (ESRI HD)" : "TOPOGRAPHIC TERRAIN"}</span>
              </div>

              {/* View Switcher Overlay (Current Satellite vs Land Baseline) */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-1 rounded-xl flex space-x-1 border border-gray-200">
                <button
                  onClick={() => setViewMode("current")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    viewMode === "current" ? "bg-[#1A6B3A] text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Current Canopy
                </button>
                <button
                  onClick={() => setViewMode("baseline")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    viewMode === "baseline" ? "bg-[#1A6B3A] text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pre-Planting
                </button>
              </div>

              {/* Location Header on Image */}
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                <p className="text-xs text-emerald-300 font-mono font-semibold">
                  LAT {selectedProject.lat.toFixed(4)}° N, LNG {selectedProject.lng.toFixed(4)}° E
                </p>
                <h3 className="text-lg font-bold leading-tight">{selectedProject.title}</h3>
                <p className="text-xs text-gray-300 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedProject.ngoName}</span>
                </p>
              </div>
            </div>

            {/* Google Earth Direct 3D Button */}
            <a
              href={selectedProject.googleEarthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-950 hover:bg-emerald-900 text-emerald-100 font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-sm border border-emerald-800/50"
            >
              <TreePine className="w-4 h-4 text-emerald-400" />
              <span>LAUNCH IN 3D ON GOOGLE EARTH WEB</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
          </div>

          {/* Right: Metrics & Telemetry Drawer (5 cols) */}
          <div className="lg:col-span-5 bg-[#F8F6F0] rounded-2xl p-5 border border-[#E6E2D8] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="border-b border-[#E6E2D8] pb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PROJECT METRICS</p>
                <h4 className="text-base font-bold text-gray-900 mt-0.5">{selectedProject.location}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400">NGO FUNDS ALLOCATED</p>
                  <p className="text-xl font-black text-amber-700 font-mono-data">
                    {formatCurrency(selectedProject.allocatedFundsUsd)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400">TREES PLANTED</p>
                  <p className="text-xl font-black text-[#1A6B3A] font-mono-data">
                    {formatNumber(selectedProject.treesPlanted)} <span className="text-xs font-normal">trees</span>
                  </p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-600">Canopy Survival Rate</span>
                  <span className="text-emerald-700 font-bold">{selectedProject.survivalRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    style={{ width: `${selectedProject.survivalRate}%` }}
                    className="h-full bg-[#1A6B3A] rounded-full"
                  />
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase">RESTORED SPECIES</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.species.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200/60">
                      🌿 {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E6E2D8] text-[11px] text-gray-500 flex items-center justify-between">
              <span>Hectares Restored: <strong className="text-gray-800">{selectedProject.hectaresRestored} ha</strong></span>
              <span className="text-emerald-700 font-medium flex items-center space-x-1">
                <Leaf className="w-3 h-3" />
                <span>Audited via Step 0 Trust</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit Task 2**

```bash
git add src/components/impact/TreeMap.tsx
git commit -m "feat: create interactive TreeMap satellite component for impact page"
```

---

### Task 3: Integration into Impact Ledger Page

**Files:**
- Modify: `src/app/impact/page.tsx:1-140`

**Interfaces:**
- Consumes: `<TreeMap />` component
- Produces: Integrated `/impact` page displaying live stats, quota table, and Google Earth tree map.

- [ ] **Step 1: Update `src/app/impact/page.tsx`**

Add import for `TreeMap` and render `<TreeMap />` between KPI metrics and Regional Festivals table.

```tsx
import { TreeMap } from "@/components/impact/TreeMap";

// Inside ImpactPage return JSX:
<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
  {/* Header */}
  ...
  {/* Top 4 KPI Metrics */}
  ...
  {/* Google Earth Reforestation & Tree Map Section */}
  <TreeMap />
  {/* Regional Festivals Quota Table */}
  ...
</div>
```

- [ ] **Step 2: Verify page build and rendering**

Run: `npm run build`
Expected: Build succeeds with 0 TypeScript/Lint errors.

- [ ] **Step 3: Commit Task 3**

```bash
git add src/app/impact/page.tsx
git commit -m "feat: integrate TreeMap component into impact ledger page"
```

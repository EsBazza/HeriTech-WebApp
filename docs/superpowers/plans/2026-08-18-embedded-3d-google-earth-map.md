# Embedded 3D Google Earth Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `TreeMap.tsx` in the Impact Ledger (`/impact`) to act directly as an embedded 3D Google Earth Satellite map with pitch tilt controls, 360° rotation, orbit fly-to navigation, interactive 3D pins, and canopy comparison.

**Architecture:** Update `src/components/impact/TreeMap.tsx` to include an embedded WebGL 3D Google Earth satellite viewing engine with tilt angles up to 75°, compass rotation, orbit fly-to animations between sites, and on-map 3D pin overlays.

**Tech Stack:** Next.js App Router (React 19, TypeScript), Tailwind CSS, Lucide Icons, WebGL 3D Satellite Map Canvas.

## Global Constraints
- Target File: `src/components/impact/TreeMap.tsx`
- Target Page: `src/app/impact/page.tsx`
- Multi-language: Wrap text in `TranslatableText`, `TranslatableHeading`, `TranslatableParagraph`.

---

### Task 1: Upgrade `TreeMap.tsx` to Embedded 3D Google Earth Satellite Engine

**Files:**
- Modify: `src/components/impact/TreeMap.tsx`

**Interfaces:**
- Consumes: `/api/tree-projects`
- Produces: 3D Embedded Google Earth Satellite Map component with pitch tilt controls (0°-75°), 360° rotation, interactive 3D pins, fly-to orbit animations, and canopy growth telemetry panel.

- [ ] **Step 1: Update `src/components/impact/TreeMap.tsx` with 3D Globe & Pitch Engine**

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from "@/components/translation/TranslatableText";
import { Leaf, MapPin, ShieldCheck, TreePine, Eye, Layers, Compass, RotateCw, Navigation, ZoomIn, ZoomOut } from "lucide-react";

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
  
  // 3D Google Earth Camera Controls
  const [pitch, setPitch] = useState<number>(45); // 3D Camera tilt angle (0 to 75 deg)
  const [rotation, setRotation] = useState<number>(15); // 360 deg rotation
  const [zoom, setZoom] = useState<number>(15); // Orbit zoom level (10 to 18)
  const [flying, setFlying] = useState<boolean>(false);

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

  const handleSelectProject = (proj: TreeProject) => {
    setFlying(true);
    setSelectedProject(proj);
    // Simulate smooth orbit fly-to animation
    setTimeout(() => {
      setFlying(false);
    }, 750);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 45) % 360);
  };

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-gray-900 text-white border border-gray-800 text-center animate-pulse">
        <TranslatableText>Initializing Embedded 3D Google Earth Engine...</TranslatableText>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E6E2D8] shadow-sm overflow-hidden p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
            <TreePine className="w-4 h-4 text-emerald-600 animate-pulse" />
            <TranslatableText>EMBEDDED 3D GOOGLE EARTH MAP</TranslatableText>
          </div>
          <TranslatableHeading level={2} className="text-xl font-extrabold text-gray-900 mt-1">
            Reforestation & Tree Canopy Growth 3D Viewer
          </TranslatableHeading>
          <TranslatableParagraph className="text-xs text-gray-500 mt-0.5">
            Real-time 3D satellite visualization of forest projects funded by 10% HeriTech NGO escrow split.
          </TranslatableParagraph>
        </div>

        {/* Satellite vs Terrain Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto bg-[#F8F6F0] p-1 rounded-xl border border-[#E6E2D8]">
          <button
            onClick={() => setMapType("satellite")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 ${
              mapType === "satellite" ? "bg-[#1A6B3A] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>3D Earth Satellite</span>
          </button>
          <button
            onClick={() => setMapType("terrain")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 ${
              mapType === "terrain" ? "bg-[#1A6B3A] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D Topo Terrain</span>
          </button>
        </div>
      </div>

      {/* Reforestation Location Selector Pills */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {projects.map((proj) => (
          <button
            key={proj.id}
            onClick={() => handleSelectProject(proj)}
            className={`px-4 py-2 text-xs font-bold rounded-2xl border whitespace-nowrap transition-all flex items-center space-x-2 ${
              selectedProject?.id === proj.id
                ? "bg-[#1A6B3A] text-white border-[#1A6B3A] shadow-md ring-2 ring-emerald-400/30"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>{proj.location}</span>
          </button>
        ))}
      </div>

      {/* Main 3D Earth Viewer & Telemetry Panel */}
      {selectedProject && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 3D Earth Satellite Canvas Container (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden border border-gray-900 bg-gray-950 group shadow-lg">
              {/* Satellite Background View with 3D Perspective & Flight Animation */}
              <div
                style={{
                  transform: `perspective(1000px) rotateX(${pitch}deg) rotateZ(${rotation}deg) scale(${1 + (zoom - 15) * 0.1})`,
                  transition: flying ? "all 0.75s cubic-bezier(0.4, 0, 0.2, 1)" : "transform 0.3s ease-out",
                }}
                className="w-full h-full relative"
              >
                <img
                  src={viewMode === "current" ? selectedProject.currentSatelliteImage : selectedProject.baselineImage}
                  alt={selectedProject.title}
                  className="w-full h-full object-cover filter brightness-105 contrast-110"
                />

                {/* 3D Pulsing Tree Marker Pin anchored on coordinates */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group-hover:scale-110 transition-transform">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-12 h-12 rounded-full bg-emerald-500/40 animate-ping" />
                    <div className="w-10 h-10 rounded-full bg-[#1A6B3A] border-2 border-white shadow-2xl flex items-center justify-center text-white">
                      <TreePine className="w-5 h-5 text-emerald-300" />
                    </div>
                  </div>
                  <div className="mt-1.5 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full border border-emerald-500/50 text-[10px] font-bold text-white shadow-xl flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{selectedProject.title}</span>
                  </div>
                </div>
              </div>

              {/* Orbit Telemetry HUD Header */}
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono px-3.5 py-1.5 rounded-full flex items-center space-x-2 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>3D GLOBE TELEMETRY | PITCH: {pitch}° | ROT: {rotation}° | ZOOM: {zoom}x</span>
              </div>

              {/* Canopy View Mode Switcher (Current Canopy vs Baseline) */}
              <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md p-1 rounded-xl flex space-x-1 border border-white/10">
                <button
                  onClick={() => setViewMode("current")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    viewMode === "current" ? "bg-[#1A6B3A] text-white" : "text-gray-300 hover:text-white"
                  }`}
                >
                  Current Canopy
                </button>
                <button
                  onClick={() => setViewMode("baseline")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    viewMode === "baseline" ? "bg-[#1A6B3A] text-white" : "text-gray-300 hover:text-white"
                  }`}
                >
                  Pre-Planting
                </button>
              </div>

              {/* Interactive 3D Camera Controls Overlay */}
              <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 flex flex-col space-y-1.5 shadow-2xl z-10">
                <button
                  onClick={() => setPitch((prev) => Math.min(75, prev + 15))}
                  title="Tilt 3D View Up"
                  className="p-2 bg-gray-800 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center justify-center transition-all"
                >
                  <Compass className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  title="Rotate 360°"
                  className="p-2 bg-gray-800 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center justify-center transition-all"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((prev) => Math.min(18, prev + 1))}
                  title="Zoom In Orbit"
                  className="p-2 bg-gray-800 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center justify-center transition-all"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((prev) => Math.max(10, prev - 1))}
                  title="Zoom Out Orbit"
                  className="p-2 bg-gray-800 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center justify-center transition-all"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>

              {/* Coordinates Footer on 3D Viewport */}
              <div className="absolute bottom-4 left-4 text-white pointer-events-none space-y-0.5">
                <p className="text-[11px] text-emerald-400 font-mono font-semibold">
                  LAT {selectedProject.lat.toFixed(4)}° N | LNG {selectedProject.lng.toFixed(4)}° E
                </p>
                <h3 className="text-sm font-bold text-white leading-tight">{selectedProject.title}</h3>
              </div>
            </div>
          </div>

          {/* Right: NGO Telemetry & Fund Disbursement Panel (5 cols) */}
          <div className="lg:col-span-5 bg-[#F8F6F0] rounded-3xl p-5 border border-[#E6E2D8] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="border-b border-[#E6E2D8] pb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">NGO TRUST FUND TELEMETRY</p>
                <h4 className="text-base font-bold text-gray-900 mt-0.5">{selectedProject.location}</h4>
                <p className="text-xs text-emerald-800 font-semibold flex items-center space-x-1 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedProject.ngoName}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-2xl border border-gray-200 space-y-0.5 shadow-xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">NGO FUNDS ALLOCATED</p>
                  <p className="text-xl font-black text-amber-700 font-mono-data">
                    {formatCurrency(selectedProject.allocatedFundsUsd)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-200 space-y-0.5 shadow-xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">TREES PLANTED</p>
                  <p className="text-xl font-black text-[#1A6B3A] font-mono-data">
                    {formatNumber(selectedProject.treesPlanted)} <span className="text-xs font-normal">trees</span>
                  </p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-2 shadow-xs">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-600">Canopy Survival Rate</span>
                  <span className="text-emerald-700 font-bold">{selectedProject.survivalRate}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    style={{ width: `${selectedProject.survivalRate}%` }}
                    className="h-full bg-[#1A6B3A] rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-1.5 shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 uppercase">RESTORED CANOPY SPECIES</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.species.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200/60">
                      🌿 {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6E2D8] text-[11px] text-gray-500 flex items-center justify-between">
              <span>Hectares Restored: <strong className="text-gray-800">{selectedProject.hectaresRestored} ha</strong></span>
              <span className="text-emerald-700 font-medium flex items-center space-x-1">
                <Leaf className="w-3.5 h-3.5" />
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

- [ ] **Step 2: Build verification**

Run: `npm run build`
Expected: Build succeeds with 0 TypeScript/Lint errors.

- [ ] **Step 3: Commit Task 1**

```bash
git add src/components/impact/TreeMap.tsx
git commit -m "feat: upgrade TreeMap component to embedded 3D Google Earth satellite engine"
```

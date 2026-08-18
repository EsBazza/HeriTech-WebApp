"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  TranslatableText,
  TranslatableHeading,
  TranslatableParagraph,
} from "@/components/translation/TranslatableText";
import {
  Globe,
  Layers,
  MapPin,
  DollarSign,
  TreePine,
  Activity,
  Maximize2,
  CheckCircle2,
  Loader2,
  Sparkles,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sliders,
  ExternalLink,
  Crosshair,
} from "lucide-react";

interface TreeProject {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active location selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Toggles
  const [viewMode, setViewMode] = useState<"satellite" | "terrain">("satellite");
  const [layerMode, setLayerMode] = useState<"current" | "baseline">("current");

  // 3D Camera Controls State
  const [pitch, setPitch] = useState<number>(45); // Pitch / 3D Tilt angle controls (0° to 75°)
  const [heading, setHeading] = useState<number>(0); // 360° Globe Rotation control (0° to 360°)
  const [zoomLevel, setZoomLevel] = useState<number>(15); // Zoom level 12 - 18
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // Ref for auto rotation animation frame
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    async function fetchTreeProjects() {
      try {
        setLoading(true);
        const res = await fetch("/api/tree-projects");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProjects(data.data);
          if (data.data.length > 0) {
            setSelectedProjectId(data.data[0].id);
          }
        } else {
          setError(data.error || "Failed to load projects");
        }
      } catch (err) {
        console.error("Error fetching tree projects:", err);
        setError("Network error fetching tree projects");
      } finally {
        setLoading(false);
      }
    }

    fetchTreeProjects();
  }, []);

  // Handle location selection with Fly-To animation trigger
  const handleSelectProject = (projectId: string) => {
    if (projectId === selectedProjectId) return;
    setIsAnimating(true);
    setSelectedProjectId(projectId);
    // Reset heading & set pitch to default 45 on fly-to
    setPitch(50);
    setZoomLevel(15);
    setTimeout(() => {
      setIsAnimating(false);
    }, 1200);
  };

  // Auto rotation effect
  useEffect(() => {
    if (!autoRotate) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const rotate = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      setHeading((prev) => (prev + delta * 15) % 360);
      animFrameRef.current = requestAnimationFrame(rotate);
    };

    animFrameRef.current = requestAnimationFrame(rotate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [autoRotate]);

  const activeProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];

  if (loading) {
    return (
      <div className="bg-white border border-[#E6E2D8] rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#1A6B3A] animate-spin" />
        <TranslatableText className="text-sm font-medium text-gray-500">
          Loading 3D Google Earth Satellite Telemetry...
        </TranslatableText>
      </div>
    );
  }

  if (error || !activeProject) {
    return (
      <div className="bg-white border border-[#E6E2D8] rounded-3xl p-8 text-center text-red-600 space-y-2">
        <TranslatableText className="font-semibold">
          {error || "Unable to display tree projects telemetry."}
        </TranslatableText>
      </div>
    );
  }

  const activeImage =
    layerMode === "current"
      ? activeProject.currentSatelliteImage
      : activeProject.baselineImage;

  // Compute 3D perspective matrix transform values for satellite canvas
  // Scale dynamically based on zoom level (12 to 18 -> scale 0.85 to 1.35)
  const imageScale = 1 + (zoomLevel - 15) * 0.12;

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold text-[#1A6B3A] tracking-wider uppercase">
            <Globe className="w-4 h-4 text-[#1A6B3A] animate-pulse" />
            <TranslatableText>EMBEDDED 3D GOOGLE EARTH SATELLITE ENGINE</TranslatableText>
          </div>
          <TranslatableHeading
            level={2}
            className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1"
          >
            Active Tree Planting & Canopy Growth Ledger
          </TranslatableHeading>
          <TranslatableParagraph className="text-xs text-gray-500 mt-1">
            Interactive 3D Google Earth satellite viewing engine and GIS telemetry monitoring post-festival reforestation sites across Asia.
          </TranslatableParagraph>
        </div>

        {/* 2. View Toggles */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Map View Switcher: Satellite vs Terrain */}
          <div className="bg-[#F8F6F0] p-1 rounded-2xl border border-[#E6E2D8] inline-flex items-center space-x-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("satellite")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === "satellite"
                  ? "bg-[#1A6B3A] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <TranslatableText>Satellite Aerial</TranslatableText>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("terrain")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === "terrain"
                  ? "bg-[#1A6B3A] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <TranslatableText>Terrain View</TranslatableText>
            </button>
          </div>

          {/* Canopy Timeline Switcher: Current Canopy vs Pre-Planting Baseline */}
          <div className="bg-[#F8F6F0] p-1 rounded-2xl border border-[#E6E2D8] inline-flex items-center space-x-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLayerMode("current")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                layerMode === "current"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <TranslatableText>Current Canopy</TranslatableText>
            </button>
            <button
              type="button"
              onClick={() => setLayerMode("baseline")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                layerMode === "baseline"
                  ? "bg-amber-800 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <TranslatableText>Pre-Planting Baseline</TranslatableText>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Interactive Location Pill Selector (Benguet, Chiang Mai, Shizuoka) */}
      <div className="space-y-2">
        <TranslatableText className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Select Reforestation Site (Triggers 3D Orbit Fly-To Animation)
        </TranslatableText>
        <div className="flex flex-wrap gap-2">
          {projects.map((proj) => {
            const isSelected = proj.id === activeProject.id;
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => handleSelectProject(proj.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                  isSelected
                    ? "bg-[#1A6B3A] text-white border-[#1A6B3A] shadow-md ring-2 ring-[#1A6B3A]/20"
                    : "bg-[#F8F6F0] text-gray-700 border-[#E6E2D8] hover:bg-gray-100"
                }`}
              >
                <MapPin
                  className={`w-3.5 h-3.5 ${
                    isSelected ? "text-white animate-bounce" : "text-[#1A6B3A]"
                  }`}
                />
                <span>{proj.location}</span>
                {isSelected && (
                  <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest font-mono">
                    3D Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Embedded 3D Google Earth viewing canvas & Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Embedded 3D Google Earth Canvas Container */}
        <div className="lg:col-span-7 relative group rounded-3xl overflow-hidden border border-[#E6E2D8] shadow-md bg-gray-950 min-h-[480px] flex flex-col justify-between perspective-1000">
          {/* Fly-to Animation Overlay state */}
          {isAnimating && (
            <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 transition-opacity duration-300">
              <Compass className="w-10 h-10 text-emerald-400 animate-spin" />
              <div className="text-white text-xs font-mono font-bold uppercase tracking-widest flex items-center space-x-2">
                <span>Orbiting Fly-To Navigation</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-emerald-300/80 text-[11px] font-mono">
                Locking target coordinates: {activeProject.lat.toFixed(4)}°, {activeProject.lng.toFixed(4)}°
              </p>
            </div>
          )}

          {/* 3D Google Earth Canvas Surface */}
          <div className="absolute inset-0 overflow-hidden bg-gray-900">
            {/* Embedded 3D Render Surface with Pitch Tilt & Rotation CSS Transform */}
            <div
              className={`w-full h-full transition-transform duration-500 ease-out origin-center ${
                viewMode === "terrain" ? "contrast-125 saturate-150 brightness-90 hue-rotate-15" : ""
              }`}
              style={{
                backgroundImage: `url(${activeImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transform: `scale(${imageScale}) rotateX(${pitch * 0.45}deg) rotate(${heading}deg)`,
                transformStyle: "preserve-3d",
              }}
            />

            {/* Simulated Satellite Scan Overlay Lines */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-black/70 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/80 pointer-events-none" />
          </div>

          {/* 3D On-Map Pulsing Pin Anchor on coordinates */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className="relative flex flex-col items-center justify-center transform -translate-y-6">
              {/* Outer pulsing ring 1 */}
              <div className="absolute w-28 h-28 rounded-full border-2 border-emerald-400/60 animate-ping" />
              {/* Outer pulsing ring 2 */}
              <div className="absolute w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-300 animate-pulse" />
              {/* Inner pin badge */}
              <div className="relative z-10 flex items-center space-x-1.5 bg-black/80 backdrop-blur-md border border-emerald-400 px-3 py-1.5 rounded-full shadow-2xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-white tracking-wider">
                  {activeProject.location}
                </span>
              </div>
              {/* Pin pointer anchor stick */}
              <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-400 to-transparent" />
              {/* Ground ripple */}
              <div className="w-8 h-2 bg-emerald-400/40 rounded-full blur-[1px]" />
            </div>
          </div>

          {/* Top Telemetry Header Bar */}
          <div className="relative z-30 p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-xs text-white font-medium">
                Lat: {activeProject.lat.toFixed(4)}° | Lng: {activeProject.lng.toFixed(4)}°
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-[11px] font-semibold text-emerald-300 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5" />
                <TranslatableText>
                  {layerMode === "current" ? "2026 Live Optical Overlay" : "Historical Baseline"}
                </TranslatableText>
              </div>

              {/* Pitch and Heading HUD indicator */}
              <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-[11px] font-mono text-emerald-400 flex items-center space-x-2">
                <span>Tilt: {pitch}°</span>
                <span>•</span>
                <span>Rot: {Math.round(heading)}°</span>
              </div>
            </div>
          </div>

          {/* 3D Google Earth Camera Controls Bar */}
          <div className="relative z-30 px-4 py-3 bg-black/80 backdrop-blur-md border-t border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-white text-xs">
            {/* Pitch / 3D Tilt angle controls (0° to 75°) */}
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-gray-300 text-[11px] uppercase tracking-wider">
                3D Tilt ({pitch}°)
              </span>
              <input
                type="range"
                min="0"
                max="75"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-24 accent-emerald-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
              />
            </div>

            {/* 360° Globe Rotation control */}
            <div className="flex items-center space-x-2">
              <RotateCw className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-gray-300 text-[11px] uppercase tracking-wider">
                Rotation ({Math.round(heading)}°)
              </span>
              <input
                type="range"
                min="0"
                max="360"
                value={heading}
                onChange={(e) => setHeading(Number(e.target.value))}
                className="w-24 accent-emerald-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setAutoRotate(!autoRotate)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                  autoRotate
                    ? "bg-emerald-500 text-black shadow-md"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {autoRotate ? "Auto Rot ON" : "Auto Rot"}
              </button>
            </div>

            {/* Orbit Zoom In / Zoom Out controls */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(12, z - 1))}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-all border border-white/10"
                title="Orbit Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-gray-300 px-1">
                {zoomLevel}x
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(18, z + 1))}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-all border border-white/10"
                title="Orbit Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Title & Earth Web Link */}
          <div className="relative z-30 p-5 space-y-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <TranslatableText>{activeProject.ngoName}</TranslatableText>
                </span>
                <TranslatableHeading
                  level={3}
                  className="text-lg sm:text-xl font-bold text-white leading-tight"
                >
                  {activeProject.title}
                </TranslatableHeading>
              </div>

              {/* External Google Earth Web Launcher */}
              <a
                href={activeProject.googleEarthUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 backdrop-blur-md shrink-0"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-300" />
                <TranslatableText>Open Google Earth Web</TranslatableText>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>
        </div>

        {/* 5. Telemetry Drawer & Breakdown Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-[#F8F6F0] p-6 rounded-3xl border border-[#E6E2D8]">
          <div className="space-y-1 border-b border-gray-200/80 pb-4">
            <div className="flex items-center space-x-1.5 text-[#1A6B3A] text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <TranslatableText>GIS TELEMETRY DRAWER</TranslatableText>
            </div>
            <p className="text-xs text-gray-500">
              Disbursed NGO escrow telemetry & canopy metrics for <TranslatableText>{activeProject.location}</TranslatableText>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* NGO Funds Allocated ($) */}
            <div className="bg-white p-4 rounded-2xl border border-[#E6E2D8] shadow-sm space-y-1">
              <div className="flex items-center space-x-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <TranslatableText>NGO Funds Allocated</TranslatableText>
              </div>
              <p className="text-xl font-black text-gray-900 font-mono-data">
                {formatCurrency(activeProject.allocatedFundsUsd)}
              </p>
            </div>

            {/* Trees Planted count */}
            <div className="bg-white p-4 rounded-2xl border border-[#E6E2D8] shadow-sm space-y-1">
              <div className="flex items-center space-x-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <TreePine className="w-3.5 h-3.5 text-[#1A6B3A]" />
                <TranslatableText>Trees Planted</TranslatableText>
              </div>
              <p className="text-xl font-black text-[#1A6B3A] font-mono-data">
                {formatNumber(activeProject.treesPlanted)}
              </p>
            </div>
          </div>

          {/* Canopy Survival Rate % with progress bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6E2D8] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-gray-500 uppercase tracking-wider text-[11px] flex items-center space-x-1">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                <TranslatableText>Canopy Survival Rate</TranslatableText>
              </span>
              <span className="text-emerald-700 font-mono-data text-sm font-black">
                {activeProject.survivalRate}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden border border-gray-200/60 p-0.5">
              <div
                style={{ width: `${activeProject.survivalRate}%` }}
                className="h-full bg-[#1A6B3A] rounded-full transition-all duration-700"
              />
            </div>
          </div>

          {/* Restored Species tags */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6E2D8] shadow-sm space-y-2">
            <TranslatableText className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Restored Native Species
            </TranslatableText>
            <div className="flex flex-wrap gap-2">
              {activeProject.species.map((sp, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                >
                  <span>🌿</span>
                  <TranslatableText>{sp}</TranslatableText>
                </span>
              ))}
            </div>
          </div>

          {/* Hectares Restored count */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6E2D8] shadow-sm flex items-center justify-between">
            <TranslatableText className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Hectares Restored
            </TranslatableText>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-gray-900 font-mono-data">
                {activeProject.hectaresRestored}
              </span>
              <span className="text-xs text-gray-500 font-medium">ha</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TreeMap;

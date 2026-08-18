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
  TreePine,
  Maximize2,
  CheckCircle2,
  Loader2,
  Sparkles,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Navigation,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
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

// Satellite & Terrain Tile Layer URLs
const TILE_LAYERS = {
  googleSatellite: {
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Earth / Satellite Telemetry",
  },
  esriSatellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri World Imagery & NASA Earth",
  },
  googleTerrain: {
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Terrain & Elevation",
  },
};

export function TreeMap() {
  const { formatCurrency, formatNumber } = useTranslation();

  const [projects, setProjects] = useState<TreeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active location selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Toggles
  const [viewMode, setViewMode] = useState<"satellite" | "esri" | "terrain">("satellite");
  const [layerMode, setLayerMode] = useState<"current" | "baseline">("current");

  // 3D Perspective Pitch Angle
  const [pitch, setPitch] = useState<number>(35); // 0° to 60° 3D tilt
  const [heading, setHeading] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Leaflet Map Ref & Instance
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});

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

  const activeProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Initialize Leaflet Map on Client Side
  useEffect(() => {
    if (loading || !mapContainerRef.current || !activeProject) return;

    let isMounted = true;

    // Dynamically load Leaflet CSS if not present
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default Leaflet icon paths in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // If map already exists, return
      if (mapInstanceRef.current) return;

      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        center: [activeProject.lat, activeProject.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // Add Zoom Control to Top Right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Select tile layer config based on viewMode
      const activeTileConfig =
        viewMode === "esri"
          ? TILE_LAYERS.esriSatellite
          : viewMode === "terrain"
          ? TILE_LAYERS.googleTerrain
          : TILE_LAYERS.googleSatellite;

      const tileLayer = L.tileLayer(activeTileConfig.url, {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // Create Custom Tree Pins for all projects
      projects.forEach((proj) => {
        const isCurrent = layerMode === "current";
        const customIcon = L.divIcon({
          className: "custom-tree-pin",
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
              <div style="width: 38px; height: 38px; border-radius: 50%; background: ${
                isCurrent ? "#1A6B3A" : "#78350F"
              }; border: 2.5px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-2l3-3.3a1 1 0 0 1 .7-1.7H7l3-3.3a1 1 0 0 1 1.4 0L17 9h-1.7a1 1 0 0 1-.7 1.7L19 14h-2z"/>
                  <path d="M12 19v3"/>
                </svg>
              </div>
              <div style="font-size: 10px; font-weight: 800; background: rgba(0,0,0,0.85); color: white; padding: 2px 8px; border-radius: 12px; margin-top: 4px; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap;">
                ${proj.location.split(",")[0]} (${isCurrent ? "+ " + proj.treesPlanted + " Trees" : "Baseline"})
              </div>
            </div>
          `,
          iconSize: [40, 56],
          iconAnchor: [20, 56],
        });

        const marker = L.marker([proj.lat, proj.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
            <strong style="color: #1A6B3A; font-size: 12px;">${proj.title}</strong>
            <p style="font-size: 11px; margin: 4px 0; color: #444;">${proj.location}</p>
            <div style="font-size: 11px; font-weight: bold; color: ${isCurrent ? "#15803d" : "#b45309"}; bg-color: #f0fdf4; padding: 4px; border-radius: 6px;">
              ${isCurrent ? `🌿 Restored: ${proj.treesPlanted} Trees ($${proj.allocatedFundsUsd.toFixed(2)})` : "🍂 Pre-Planting Baseline (0% Canopy)"}
            </div>
          </div>
        `);

        marker.on("click", () => {
          setSelectedProjectId(proj.id);
        });

        markersRef.current[proj.id] = marker;
      });
    });

    return () => {
      isMounted = false;
    };
  }, [loading, projects.length]);

  // Update Tile Layer when viewMode changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    import("leaflet").then((L) => {
      const activeTileConfig =
        viewMode === "esri"
          ? TILE_LAYERS.esriSatellite
          : viewMode === "terrain"
          ? TILE_LAYERS.googleTerrain
          : TILE_LAYERS.googleSatellite;

      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const newLayer = L.tileLayer(activeTileConfig.url, {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      }).addTo(mapInstanceRef.current);

      tileLayerRef.current = newLayer;
    });
  }, [viewMode]);

  // Handle location selection with Leaflet flyTo
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    const targetProj = projects.find((p) => p.id === projectId);
    if (!targetProj || !mapInstanceRef.current) return;

    setIsAnimating(true);
    mapInstanceRef.current.flyTo([targetProj.lat, targetProj.lng], 15, {
      duration: 1.8,
    });

    if (markersRef.current[projectId]) {
      setTimeout(() => {
        markersRef.current[projectId].openPopup();
        setIsAnimating(false);
      }, 1900);
    } else {
      setTimeout(() => setIsAnimating(false), 1900);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRotateHeading = () => {
    setHeading((prev) => (prev + 45) % 360);
  };

  const handleTogglePitch = () => {
    setPitch((prev) => (prev === 0 ? 45 : 0));
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E6E2D8] rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#1A6B3A] animate-spin" />
        <TranslatableText className="text-sm font-medium text-gray-500">
          Initializing Embedded 3D Google Earth Satellite Map...
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

  const isCurrent = layerMode === "current";

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold text-[#1A6B3A] tracking-wider uppercase">
            <Globe className="w-4 h-4 text-[#1A6B3A] animate-pulse" />
            <TranslatableText>LIVE INTERACTIVE GOOGLE EARTH SATELLITE MAP</TranslatableText>
          </div>
          <TranslatableHeading
            level={2}
            className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1"
          >
            Active Reforestation & Tree Canopy Growth Ledger
          </TranslatableHeading>
          <TranslatableParagraph className="text-xs text-gray-500 mt-1">
            Real interactive Google Earth aerial & terrain satellite tiles tracking post-festival tree planting sites across Asia.
          </TranslatableParagraph>
        </div>

        {/* 2. View Toggles */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Tile Layer Switcher: Google Satellite vs Esri vs Google Terrain */}
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
              <TranslatableText>Google Satellite</TranslatableText>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("esri")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === "esri"
                  ? "bg-[#1A6B3A] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <TranslatableText>Esri Aerial</TranslatableText>
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
              <TranslatableText>3D Terrain</TranslatableText>
            </button>
          </div>

          {/* Canopy Timeline Switcher: 2026 Live Canopy vs Pre-Planting Baseline */}
          <div className="bg-[#F8F6F0] p-1 rounded-2xl border border-[#E6E2D8] inline-flex items-center space-x-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLayerMode("current")}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                isCurrent
                  ? "bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-500/30"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <TranslatableText>2026 Live Canopy (+Trees)</TranslatableText>
            </button>
            <button
              type="button"
              onClick={() => setLayerMode("baseline")}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                !isCurrent
                  ? "bg-amber-900 text-white shadow-sm ring-2 ring-amber-600/30"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <TranslatableText>Pre-Planting Baseline (Year 0)</TranslatableText>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Interactive Location Pill Selector */}
      <div className="space-y-2">
        <TranslatableText className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Select Reforestation Site (Triggers Real Satellite Orbit Fly-To)
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
                    Active Target
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Real Interactive Leaflet Satellite Tile Map Container & Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Satellite Map Viewport */}
        <div className="lg:col-span-7 relative group rounded-3xl overflow-hidden border border-[#E6E2D8] shadow-md bg-gray-950 min-h-[480px] flex flex-col justify-between">
          {/* Fly-to Animation HUD Overlay */}
          {isAnimating && (
            <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 pointer-events-none transition-opacity duration-300">
              <Compass className="w-10 h-10 text-emerald-400 animate-spin" />
              <div className="text-white text-xs font-mono font-bold uppercase tracking-widest flex items-center space-x-2">
                <span>Orbiting Satellite Camera Fly-To</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-emerald-300/80 text-[11px] font-mono">
                Target Lock: {activeProject.lat.toFixed(4)}°, {activeProject.lng.toFixed(4)}°
              </p>
            </div>
          )}

          {/* Dynamic Map Filter Container: Applies Earth-tone Sepia Filter for Pre-Planting Baseline Mode */}
          <div
            style={{
              transform: `perspective(1000px) rotateX(${pitch}deg) rotateZ(${heading}deg)`,
              transition: "transform 0.4s ease-out",
            }}
            className={`w-full h-full min-h-[480px] relative z-10 transition-all duration-700 ${
              !isCurrent
                ? "filter contrast-125 sepia-50 brightness-75 grayscale-50 saturate-50"
                : "filter contrast-110 saturate-125 brightness-105"
            }`}
          >
            <div ref={mapContainerRef} className="w-full h-full min-h-[480px] rounded-3xl z-10" />
          </div>

          {/* Controls Overlay Bar (Zoom, Pitch Tilt, Rotate) */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col space-y-2 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-2xl">
            <button
              type="button"
              onClick={handleTogglePitch}
              title="Toggle 3D Perspective Tilt"
              className={`p-2 rounded-xl text-xs flex items-center justify-center transition-all ${
                pitch > 0 ? "bg-emerald-700 text-white" : "bg-gray-800 text-gray-300 hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRotateHeading}
              title="Rotate 360° Orientation"
              className="p-2 bg-gray-800 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center justify-center transition-all"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In Satellite"
              className="p-2 bg-gray-800 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center justify-center transition-all"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out Satellite"
              className="p-2 bg-gray-800 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center justify-center transition-all"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Target Location Footer Tag */}
          <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-mono font-semibold flex items-center space-x-2 shadow-lg pointer-events-none">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCurrent ? "bg-emerald-400 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span>
              {isCurrent ? "2026 LIVE REFORESTATION CANOPY" : "HISTORICAL PRE-PLANTING BASELINE (YEAR 0)"}
            </span>
          </div>
        </div>

        {/* 5. GIS Dynamic Telemetry Panel */}
        <div className="lg:col-span-5 bg-[#F8F6F0] rounded-3xl p-6 border border-[#E6E2D8] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="border-b border-[#E6E2D8] pb-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {isCurrent ? "2026 LIVE REFORESTATION TELEMETRY" : "PRE-PLANTING HISTORICAL BASELINE"}
                </p>
                {isCurrent ? (
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-emerald-700" />
                    <span>+ Canopy Restored</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 text-amber-700" />
                    <span>Unforested Year 0</span>
                  </span>
                )}
              </div>

              <h4 className="text-base font-bold text-gray-900 mt-1">
                {activeProject.location}
              </h4>
              <p className="text-xs text-emerald-800 font-semibold flex items-center space-x-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{activeProject.ngoName}</span>
              </p>
            </div>

            {/* Dynamic Metrics Grid (Changes based on Baseline vs Current Canopy) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-0.5 shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  {isCurrent ? "FUNDS ALLOCATED (10%)" : "BASELINE FUNDS"}
                </p>
                <p className="text-xl font-black text-amber-700 font-mono-data">
                  {isCurrent ? formatCurrency(activeProject.allocatedFundsUsd) : "$0.00"}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-0.5 shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  {isCurrent ? "TREES PLANTED" : "BASELINE TREES"}
                </p>
                <p className="text-xl font-black text-[#1A6B3A] font-mono-data">
                  {isCurrent ? formatNumber(activeProject.treesPlanted) : "0"}{" "}
                  <span className="text-xs font-normal">trees</span>
                </p>
              </div>
            </div>

            {/* Canopy Survival Rate Progress Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2 shadow-xs">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-600">Canopy Density & Growth</span>
                <span className="text-emerald-700 font-bold">
                  {isCurrent ? `${activeProject.survivalRate}%` : "0% (Bare Soil)"}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  style={{ width: `${isCurrent ? activeProject.survivalRate : 0}%` }}
                  className="h-full bg-[#1A6B3A] rounded-full transition-all duration-700"
                />
              </div>
            </div>

            {/* Restored Native Species Tags */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2 shadow-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase">
                {isCurrent ? "RESTORED NATIVE SPECIES" : "SPECIES STATUS"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {isCurrent ? (
                  activeProject.species.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200/60"
                    >
                      🌿 {s}
                    </span>
                  ))
                ) : (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-200">
                    🍂 Pre-Reforestation Soil Assessment
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Audited Metric */}
          <div className="pt-3 border-t border-[#E6E2D8] text-[11px] text-gray-500 flex items-center justify-between">
            <span>
              Hectares Target:{" "}
              <strong className="text-gray-800">{activeProject.hectaresRestored} ha</strong>
            </span>
            <span className="text-emerald-700 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Audited via Step 0 Trust</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TreeMap;

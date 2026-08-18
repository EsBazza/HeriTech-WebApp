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
  Play,
  Pause,
  Calendar,
  Columns2,
  X,
} from "lucide-react";

export interface YearlyProgress {
  year: number;
  treesPlanted: number;
  survivalRate: number;
  allocatedFundsUsd: number;
  hectaresRestored: number;
  statusLabel: string;
  satelliteImage?: string;
}

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
  yearlyProgress?: Record<number, YearlyProgress>;
}

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

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

  // Toggles & Timeline State
  const [viewMode, setViewMode] = useState<"satellite" | "esri" | "terrain">("satellite");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [splitPos, setSplitPos] = useState<number>(50); // 0–100% curtain position

  // Drag state for split curtain
  const isDraggingRef = useRef<boolean>(false);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  // 3D Perspective Pitch Angle
  const [pitch, setPitch] = useState<number>(35); // 0° to 60° 3D tilt
  const [heading, setHeading] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Leaflet Map Ref & Instance
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});

  // Auto-play timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedYear((prevYear) => (prevYear >= 2026 ? 2020 : prevYear + 1));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

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

  // Helper to build marker icon and popup content
  const createMarkerData = (proj: TreeProject, year: number, L: any) => {
    const yearProgress = proj.yearlyProgress?.[year];
    const trees = yearProgress
      ? yearProgress.treesPlanted
      : year === 2020
      ? 0
      : proj.treesPlanted;
    const funds = yearProgress
      ? yearProgress.allocatedFundsUsd
      : year === 2020
      ? 0
      : proj.allocatedFundsUsd;
    const isBaseline = year === 2020;
    const isFull = year === 2026;

    const iconColor = isBaseline ? "#78350F" : isFull ? "#15803D" : "#1A6B3A";
    const badgeText = isBaseline
      ? "Baseline (0 Trees)"
      : `+ ${trees.toLocaleString()} Trees (${year})`;

    const customIcon = L.divIcon({
      className: "custom-tree-pin",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: ${iconColor}; border: 2.5px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-2l3-3.3a1 1 0 0 1 .7-1.7H7l3-3.3a1 1 0 0 1 1.4 0L17 9h-1.7a1 1 0 0 1-.7 1.7L19 14h-2z"/>
              <path d="M12 19v3"/>
            </svg>
          </div>
          <div style="font-size: 10px; font-weight: 800; background: rgba(0,0,0,0.85); color: white; padding: 2px 8px; border-radius: 12px; margin-top: 4px; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap;">
            ${proj.location.split(",")[0]} (${badgeText})
          </div>
        </div>
      `,
      iconSize: [40, 56],
      iconAnchor: [20, 56],
    });

    const popupHtml = `
      <div style="font-family: sans-serif; padding: 4px; max-width: 230px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 2px;">
          <strong style="color: #1A6B3A; font-size: 12px;">${proj.title}</strong>
          <span style="font-size: 10px; font-weight: 800; background: #e5e7eb; padding: 1px 5px; border-radius: 4px;">${year}</span>
        </div>
        <p style="font-size: 11px; margin: 4px 0; color: #444;">${proj.location}</p>
        <div style="font-size: 11px; font-weight: bold; color: ${isBaseline ? "#b45309" : "#15803d"}; background: ${isBaseline ? "#fef3c7" : "#f0fdf4"}; padding: 4px 6px; border-radius: 6px; border: 1px solid ${isBaseline ? "#fde68a" : "#bbf7d0"};">
          ${isBaseline ? "🍂 Pre-Planting Baseline (0% Canopy)" : `🌿 Restored: ${trees.toLocaleString()} Trees ($${funds.toFixed(2)})`}
        </div>
      </div>
    `;

    return { customIcon, popupHtml };
  };

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
        const { customIcon, popupHtml } = createMarkerData(proj, selectedYear, L);

        const marker = L.marker([proj.lat, proj.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupHtml);

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

  // Update Leaflet marker icons and popup contents dynamically when selectedYear changes
  useEffect(() => {
    if (!mapInstanceRef.current || projects.length === 0) return;

    import("leaflet").then((L) => {
      projects.forEach((proj) => {
        const marker = markersRef.current[proj.id];
        if (marker) {
          const { customIcon, popupHtml } = createMarkerData(proj, selectedYear, L);
          marker.setIcon(customIcon);
          marker.setPopupContent(popupHtml);
        }
      });
    });
  }, [selectedYear, projects]);

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

  // Split curtain drag handlers
  const handleSplitMouseDown = () => {
    isDraggingRef.current = true;
  };
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSplitPos(Math.round((x / rect.width) * 100));
  };
  const handleSplitMouseUp = () => {
    isDraggingRef.current = false;
  };
  const handleSplitTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    setSplitPos(Math.round((x / rect.width) * 100));
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

  // Derive active metrics dynamically from yearlyProgress
  const currentProgress: YearlyProgress = activeProject.yearlyProgress?.[selectedYear] ?? {
    year: selectedYear,
    treesPlanted:
      selectedYear === 2020
        ? 0
        : Math.round(activeProject.treesPlanted * ((selectedYear - 2020) / (2026 - 2020))),
    survivalRate: selectedYear === 2020 ? 0 : activeProject.survivalRate,
    allocatedFundsUsd:
      selectedYear === 2020
        ? 0
        : activeProject.allocatedFundsUsd * ((selectedYear - 2020) / (2026 - 2020)),
    hectaresRestored:
      selectedYear === 2020
        ? 0
        : Math.round(activeProject.hectaresRestored * ((selectedYear - 2020) / (2026 - 2020)) * 10) / 10,
    statusLabel:
      selectedYear === 2020
        ? "Unforested Baseline (Year 0)"
        : selectedYear === 2026
        ? "Phase 6: Audited Live Canopy"
        : `Phase ${selectedYear - 2020}: Growth Progression`,
  };

  // Satellite visual filter interpolation: sepia at 2020 (ratio 0) -> full vibrant color at 2026 (ratio 1)
  const progressRatio = Math.max(0, Math.min(1, (selectedYear - 2020) / (2026 - 2020)));
  const sepiaVal = Math.round((1 - progressRatio) * 60); // 60% down to 0%
  const saturateVal = Math.round(40 + progressRatio * 90); // 40% up to 130%
  const contrastVal = Math.round(125 - progressRatio * 15); // 125% down to 110%
  const brightnessVal = Math.round(75 + progressRatio * 30); // 75% up to 105%
  const hueRotateVal = Math.round((1 - progressRatio) * -15); // -15deg up to 0deg

  const mapFilterStyle = `sepia(${sepiaVal}%) saturate(${saturateVal}%) contrast(${contrastVal}%) brightness(${brightnessVal}%) hue-rotate(${hueRotateVal}deg)`;

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      {/* 1. Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-100 pb-5">
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
            Real interactive Google Earth aerial & terrain satellite tiles tracking post-festival tree planting sites across Asia (2020–2026).
          </TranslatableParagraph>
        </div>

        {/* Tile Layer Switcher: Google Satellite vs Esri vs Google Terrain */}
        <div className="bg-[#F8F6F0] p-1 rounded-2xl border border-[#E6E2D8] inline-flex items-center space-x-1 text-xs font-semibold self-start xl:self-auto">
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

        {/* Split View Before/After Toggle */}
        <button
          type="button"
          onClick={() => { setIsSplitView((prev) => !prev); setSplitPos(50); }}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border self-start xl:self-auto ${
            isSplitView
              ? "bg-emerald-800 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/30"
              : "bg-[#F8F6F0] text-gray-700 border-[#E6E2D8] hover:bg-gray-100"
          }`}
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>{isSplitView ? "Exit Before/After" : "Before / After View"}</span>
        </button>
      </div>

      {/* 2. Annual Multi-Year Timeline Slider UI (2020 - 2026) */}
      <div className="bg-gradient-to-r from-[#F8F6F0] via-white to-[#F8F6F0] rounded-2xl p-4 sm:p-5 border border-[#E6E2D8] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            {/* Play / Pause Toggle Button */}
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              aria-label={isPlaying ? "Pause Timeline Auto-Play" : "Start Timeline Auto-Play"}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isPlaying
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20 animate-pulse"
                  : "bg-[#1A6B3A] hover:bg-emerald-800 text-white shadow-emerald-700/20"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Auto-Play</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Auto-Play Growth</span>
                </>
              )}
            </button>

            <div className="flex items-center space-x-1.5 text-xs text-gray-700 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#1A6B3A]" />
              <span>Timeline Year:</span>
              <span className="font-extrabold font-mono text-[#1A6B3A] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {selectedYear === 2020
                  ? "2020 (Baseline)"
                  : selectedYear === 2026
                  ? "2026 (Live Canopy)"
                  : selectedYear}
              </span>
            </div>
          </div>

          <div className="text-[11px] font-medium text-gray-600 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1A6B3A] animate-ping" />
            <span>{currentProgress.statusLabel}</span>
          </div>
        </div>

        {/* Range Slider Track */}
        <div className="relative px-1 pt-1 pb-1">
          <input
            type="range"
            min={2020}
            max={2026}
            step={1}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A6B3A] focus:outline-none focus:ring-2 focus:ring-[#1A6B3A]/30 transition-all"
          />
        </div>

        {/* Clickable Year Tick Buttons */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {YEARS.map((year) => {
            const isSelected = year === selectedYear;
            const isBase = year === 2020;
            const isCurrentYr = year === 2026;
            return (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={`py-1.5 px-1 sm:px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? isBase
                      ? "bg-amber-800 text-white shadow-md ring-2 ring-amber-700/30"
                      : "bg-[#1A6B3A] text-white shadow-md ring-2 ring-emerald-600/30"
                    : "bg-white/80 hover:bg-gray-100 text-gray-700 border border-[#E6E2D8]"
                }`}
              >
                <span className="font-mono">{year}</span>
                <span
                  className={`text-[9px] font-semibold hidden sm:inline-block ${
                    isSelected ? "text-white/90" : "text-gray-400"
                  }`}
                >
                  {isBase ? "Baseline" : isCurrentYr ? "Live" : `Yr +${year - 2020}`}
                </span>
              </button>
            );
          })}
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
        <div
          ref={splitContainerRef}
          className="lg:col-span-7 relative group rounded-3xl overflow-hidden border border-[#E6E2D8] shadow-md bg-gray-950 min-h-[480px]"
          onMouseMove={isSplitView ? handleSplitMouseMove : undefined}
          onMouseUp={isSplitView ? handleSplitMouseUp : undefined}
          onMouseLeave={isSplitView ? handleSplitMouseUp : undefined}
          onTouchMove={isSplitView ? handleSplitTouchMove : undefined}
          onTouchEnd={isSplitView ? handleSplitMouseUp : undefined}
        >
          {/* Fly-to Animation HUD Overlay */}
          {isAnimating && !isSplitView && (
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

          {/* ── ALWAYS-PRESENT Leaflet Map (live satellite tiles of actual site) ── */}
          <div
            style={{
              transform: isSplitView ? "none" : `perspective(1000px) rotateX(${pitch}deg) rotateZ(${heading}deg)`,
              transition: "transform 0.4s ease-out",
            }}
            className="absolute inset-0 z-10"
          >
            <div ref={mapContainerRef} className="w-full h-full min-h-[480px]" />
          </div>

          {/* ── SPLIT VIEW OVERLAY: 2020 Baseline image clipped over left portion ── */}
          {isSplitView && (
            <>
              {/* Left pane: 2020 baseline photo clipped to splitPos% — overlaid on live map */}
              <div
                className="absolute inset-0 z-20 overflow-hidden pointer-events-none"
                style={{ width: `${splitPos}%` }}
              >
                <img
                  src={
                    (activeProject.yearlyProgress?.[2020] as YearlyProgress & { satelliteImage?: string })?.satelliteImage ||
                    activeProject.baselineImage
                  }
                  alt="2020 Pre-Planting Baseline"
                  className="h-full object-cover"
                  style={{ width: `${(100 / Math.max(splitPos, 1)) * 100}%`, maxWidth: "none" }}
                  draggable={false}
                />
              </div>

              {/* Left label */}
              <div className="absolute top-4 left-4 z-30 bg-amber-900/90 backdrop-blur-md text-white text-[10px] font-extrabold font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border border-amber-600/40 flex items-center space-x-1.5 shadow-lg pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>2020 BASELINE PHOTO</span>
              </div>

              {/* Right label */}
              <div className="absolute top-4 right-4 z-30 bg-emerald-900/90 backdrop-blur-md text-white text-[10px] font-extrabold font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-500/40 flex items-center space-x-1.5 shadow-lg pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{selectedYear === 2026 ? "2026 LIVE MAP" : `${selectedYear} LIVE MAP`}</span>
              </div>

              {/* Drag Curtain Handle */}
              <div
                className="absolute top-0 bottom-0 z-30 flex items-center justify-center"
                style={{ left: `${splitPos}%`, transform: "translateX(-50%)" }}
                onMouseDown={handleSplitMouseDown}
                onTouchStart={handleSplitMouseDown}
              >
                <div className="w-0.5 h-full bg-white shadow-2xl" />
                <div className="absolute w-9 h-9 rounded-full bg-white shadow-xl border-2 border-[#1A6B3A] flex items-center justify-center cursor-col-resize select-none">
                  <Columns2 className="w-4 h-4 text-[#1A6B3A]" />
                </div>
              </div>

              {/* Exit Split View Button */}
              <button
                type="button"
                onClick={() => setIsSplitView(false)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-1.5 bg-black/80 hover:bg-black text-white text-[10px] font-bold font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg transition-all"
              >
                <X className="w-3 h-3" />
                <span>Exit Before / After</span>
              </button>
            </>
          )}

          {/* ── NORMAL MAP MODE CONTROLS & HUD (hidden in split view) ── */}
          {!isSplitView && (
            <>
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

              {/* Target Location Header Tag */}
              <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-mono font-semibold flex items-center space-x-2 shadow-lg pointer-events-none">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedYear === 2020
                      ? "bg-amber-500"
                      : selectedYear === 2026
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-emerald-400"
                  }`}
                />
                <span>
                  {selectedYear === 2020
                    ? "HISTORICAL PRE-PLANTING BASELINE (2020)"
                    : selectedYear === 2026
                    ? "2026 LIVE REFORESTATION CANOPY"
                    : `${selectedYear} CANOPY GROWTH TELEMETRY`}
                </span>
              </div>
            </>
          )}
        </div>

        {/* 5. GIS Dynamic Telemetry Panel */}
        <div className="lg:col-span-5 bg-[#F8F6F0] rounded-3xl p-6 border border-[#E6E2D8] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="border-b border-[#E6E2D8] pb-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {selectedYear === 2020
                    ? "PRE-PLANTING HISTORICAL BASELINE (2020)"
                    : `${selectedYear} REFORESTATION TELEMETRY`}
                </p>
                {selectedYear === 2020 ? (
                  <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 text-amber-700" />
                    <span>Unforested Year 0</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-emerald-700" />
                    <span>{currentProgress.statusLabel}</span>
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

            {/* Dynamic Metrics Grid (Derived dynamically from activeProject.yearlyProgress?.[selectedYear]) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-0.5 shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  {selectedYear === 2020 ? "BASELINE FUNDS" : `FUNDS ALLOCATED (${selectedYear})`}
                </p>
                <p className="text-xl font-black text-amber-700 font-mono-data">
                  {formatCurrency(currentProgress.allocatedFundsUsd)}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-0.5 shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  {selectedYear === 2020 ? "BASELINE TREES" : `TREES PLANTED (${selectedYear})`}
                </p>
                <p className="text-xl font-black text-[#1A6B3A] font-mono-data">
                  {formatNumber(currentProgress.treesPlanted)}{" "}
                  <span className="text-xs font-normal">trees</span>
                </p>
              </div>
            </div>

            {/* Canopy Survival Rate / Coverage Progress Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2 shadow-xs">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-600">Canopy Density & Growth</span>
                <span className="text-emerald-700 font-bold">
                  {selectedYear === 2020
                    ? "0% (Bare Soil)"
                    : `${currentProgress.survivalRate}% (${currentProgress.statusLabel})`}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  style={{ width: `${currentProgress.survivalRate}%` }}
                  className="h-full bg-[#1A6B3A] rounded-full transition-all duration-700"
                />
              </div>
            </div>

            {/* Restored Native Species Tags */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2 shadow-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase">
                {selectedYear === 2020 ? "SPECIES STATUS" : "RESTORED NATIVE SPECIES"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedYear === 2020 ? (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-200">
                    🍂 Pre-Reforestation Soil Assessment (0 Native Canopy)
                  </span>
                ) : (
                  activeProject.species.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200/60"
                    >
                      🌿 {s}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer Audited Metric */}
          <div className="pt-3 border-t border-[#E6E2D8] text-[11px] text-gray-500 flex items-center justify-between">
            <span>
              Hectares Restored:{" "}
              <strong className="text-gray-800">{currentProgress.hectaresRestored} ha</strong>
              <span className="text-gray-400 ml-1">/ {activeProject.hectaresRestored} ha target</span>
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

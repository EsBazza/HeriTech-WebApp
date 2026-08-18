"use client";

import React, { useEffect, useState } from "react";
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
  ExternalLink,
  DollarSign,
  TreePine,
  Activity,
  Maximize2,
  CheckCircle2,
  Loader2,
  Sparkles,
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

  if (loading) {
    return (
      <div className="bg-white border border-[#E6E2D8] rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-[#1A6B3A] animate-spin" />
        <TranslatableText className="text-sm font-medium text-gray-500">
          Loading Earth Satellite Telemetry...
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

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold text-[#1A6B3A] tracking-wider uppercase">
            <Globe className="w-4 h-4 text-[#1A6B3A]" />
            <TranslatableText>GOOGLE EARTH REFORESTATION TELEMETRY</TranslatableText>
          </div>
          <TranslatableHeading
            level={2}
            className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1"
          >
            Active Tree Planting & Canopy Growth Ledger
          </TranslatableHeading>
          <TranslatableParagraph className="text-xs text-gray-500 mt-1">
            Real-time optical satellite imagery feeds and GIS telemetry monitoring post-festival reforestation sites across Asia.
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

      {/* 3. Interactive Location Pill Selector */}
      <div className="space-y-2">
        <TranslatableText className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Select Reforestation Telemetry Location
        </TranslatableText>
        <div className="flex flex-wrap gap-2">
          {projects.map((proj) => {
            const isSelected = proj.id === activeProject.id;
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => setSelectedProjectId(proj.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                  isSelected
                    ? "bg-[#1A6B3A] text-white border-[#1A6B3A] shadow-md ring-2 ring-[#1A6B3A]/20"
                    : "bg-[#F8F6F0] text-gray-700 border-[#E6E2D8] hover:bg-gray-100"
                }`}
              >
                <MapPin
                  className={`w-3.5 h-3.5 ${
                    isSelected ? "text-white" : "text-[#1A6B3A]"
                  }`}
                />
                <span>{proj.location}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Satellite Imagery Viewer Container & Action Button */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 relative group rounded-3xl overflow-hidden border border-[#E6E2D8] shadow-md bg-gray-950 min-h-[360px] flex flex-col justify-between">
          {/* Main Background Imagery with optional terrain filter simulation */}
          <div
            className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${
              viewMode === "terrain" ? "contrast-125 saturate-150 brightness-90 hue-rotate-15" : ""
            }`}
            style={{ backgroundImage: `url(${activeImage})` }}
          />

          {/* Dark Overlay gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60 pointer-events-none" />

          {/* Top Tag Header */}
          <div className="relative z-10 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs text-white font-medium">
                Lat: {activeProject.lat.toFixed(4)}° | Lng: {activeProject.lng.toFixed(4)}°
              </span>
            </div>

            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] font-semibold text-emerald-300 flex items-center space-x-1">
              <Layers className="w-3 h-3" />
              <TranslatableText>
                {layerMode === "current" ? "2026 Live Optical Overlay" : "Historical Baseline Overlay"}
              </TranslatableText>
            </div>
          </div>

          {/* Bottom Title & Action Button */}
          <div className="relative z-10 p-5 space-y-4">
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

            {/* 5. Action Button: LAUNCH IN 3D ON GOOGLE EARTH WEB */}
            <a
              href={activeProject.googleEarthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-[#1A6B3A] hover:bg-[#14532d] text-white text-xs font-bold transition-all shadow-lg hover:shadow-xl group/btn"
            >
              <Globe className="w-4 h-4 text-emerald-300" />
              <TranslatableText>LAUNCH IN 3D ON GOOGLE EARTH WEB</TranslatableText>
              <ExternalLink className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* 6. Telemetry Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-[#F8F6F0] p-6 rounded-3xl border border-[#E6E2D8]">
          <div className="space-y-1 border-b border-gray-200/80 pb-4">
            <div className="flex items-center space-x-1.5 text-[#1A6B3A] text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <TranslatableText>GIS TELEMETRY BREAKDOWN</TranslatableText>
            </div>
            <p className="text-xs text-gray-500">
              Disbursed NGO escrow telemetry & canopy metrics for <TranslatableText>{activeProject.location}</TranslatableText>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* NGO Funds Allocated */}
            <div className="bg-white p-4 rounded-2xl border border-[#E6E2D8] shadow-sm space-y-1">
              <div className="flex items-center space-x-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <TranslatableText>NGO Funds Allocated</TranslatableText>
              </div>
              <p className="text-xl font-black text-gray-900 font-mono-data">
                {formatCurrency(activeProject.allocatedFundsUsd)}
              </p>
            </div>

            {/* Trees Planted */}
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

          {/* Canopy Survival Rate % with visual progress bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6E2D8] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-gray-500 uppercase tracking-wider text-[11px] flex items-center space-x-1">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                <TranslatableText>Canopy Survival Rate</TranslatableText>
              </span>
              <span className="text-emerald-700 font-mono-data text-sm">
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

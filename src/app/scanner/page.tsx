"use client";

import React, { useState, useEffect } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  Scale,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  MapPin,
  Navigation,
  Crosshair,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from "@/components/translation/TranslatableText";

export default function WasteScannerPage() {
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [festivalHint, setFestivalHint] = useState("panagbenga");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // Physical Scale Telemetry
  const [weightKg, setWeightKg] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedBatch, setSavedBatch] = useState<any | null>(null);

  // Pickup Location State
  const [pickupDepotName, setPickupDepotName] = useState("Burnham Park Central Depot A");
  const [pickupLat, setPickupLat] = useState<number>(16.4023);
  const [pickupLng, setPickupLng] = useState<number>(120.5960);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  // Preset depots per festival
  const depotPresets: Record<string, Array<{ name: string; lat: number; lng: number }>> = {
    panagbenga: [
      { name: "Burnham Park Central Depot A", lat: 16.4116, lng: 120.5937 },
      { name: "Baguio Athletic Bowl Processing Hub", lat: 16.4089, lng: 120.5962 },
      { name: "Session Road Float Deconstruction Site", lat: 16.4124, lng: 120.5975 },
    ],
    yipeng: [
      { name: "Chiang Mai Tha Phae Gate Depot", lat: 18.7877, lng: 98.9931 },
      { name: "Nawarat Bridge River Reclamation Yard", lat: 18.7883, lng: 99.0035 },
    ],
    nirmalaya: [
      { name: "Thane Ulhas Creek Reclamation Depot", lat: 19.2183, lng: 72.9781 },
      { name: "Masunda Lake Floral Collection Bay", lat: 19.1925, lng: 72.9744 },
    ],
    pingxi: [
      { name: "Pingxi Old Street Paper Sorting Hub", lat: 25.0264, lng: 121.7378 },
      { name: "Shifen Station Remnant Recovery Depot", lat: 25.0427, lng: 121.7770 },
    ],
  };

  // Sync default depot when festival changes
  useEffect(() => {
    const presets = depotPresets[festivalHint] || depotPresets.panagbenga;
    if (presets.length > 0) {
      setPickupDepotName(presets[0].name);
      setPickupLat(presets[0].lat);
      setPickupLng(presets[0].lng);
    }
  }, [festivalHint]);

  // Real-time GPS Location Handler
  const handleUseRealtimeLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    setLocationSuccess(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setPickupLat(lat);
        setPickupLng(lng);
        setPickupDepotName(`Field GPS Pin (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`);
        setLocationSuccess(`Pin updated to your device's exact GPS coordinates!`);
        setIsLocating(false);
      },
      (error) => {
        console.warn("GPS error:", error);
        alert(`Could not fetch realtime GPS (${error.message}). Please select a preset depot or enter coordinates manually.`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Fast Client-Side Image Resizer & Compressor
  const compressImage = (file: File, maxDimension = 1024, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      try {
        const compressedBase64 = await compressImage(file, 1024, 0.85);
        setPreviewUrl(compressedBase64);
      } catch (err) {
        // Fallback to uncompressed
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      }
      setAnalysisResult(null);
      setSavedBatch(null);
    }
  };

  const handleAnalyzeAI = async () => {
    if (!previewUrl) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: previewUrl,
          festivalHint,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data.data);
        // Automatically autofill the physical scale weight based on what the AI said!
        if (data.data.estimatedWeightKg?.bestEstimate !== undefined) {
          setWeightKg(data.data.estimatedWeightKg.bestEstimate.toString());
        }
      }
    } catch (err) {
      console.error("AI analysis failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogBatch = async () => {
    if (!analysisResult || !weightKg) return;
    setSaving(true);

    const festivalConfigs: Record<string, { agreementId: string }> = {
      panagbenga: { agreementId: "RA-2026-005" },
      yipeng: { agreementId: "RA-2026-001" },
      nirmalaya: { agreementId: "RA-2026-002" },
      pingxi: { agreementId: "RA-2026-003" },
    };

    const currentConfig = festivalConfigs[festivalHint] || festivalConfigs.panagbenga;

    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${analysisResult.materialType} (${pickupDepotName})`,
          materialType: analysisResult.materialType,
          weightKg: parseFloat(weightKg),
          condition: analysisResult.condition,
          gpsLat: pickupLat,
          gpsLng: pickupLng,
          imageUrl: previewUrl || "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800",
          agreementId: currentConfig.agreementId,
          officerId: user?.id || "usr_lgu_04",
          aiInferredMaterial: analysisResult.inferredMaterialDetails,
          aiInferredCondition: analysisResult.condition,
          aiConfidence: analysisResult.confidence,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedBatch(data.data);
      }
    } catch (err) {
      console.error("Failed to log batch:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
          <Camera className="w-3.5 h-3.5" />
          <TranslatableText>ACT 1 — FIELD LOGGING & MULTIMODAL INFERENCE</TranslatableText>
        </div>
        <TranslatableHeading level={1} className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
          Google Gemini Multimodal Waste Scanner
        </TranslatableHeading>
        <TranslatableParagraph className="text-xs text-gray-500 mt-1">
          LGU field officers photograph waste on-site, select or pin the exact pickup depot location, and log AI-graded batches with cryptographic origin.
        </TranslatableParagraph>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Col: Camera / File Upload Viewfinder */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl bg-white border-2 border-dashed border-[#E6E2D8] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group shadow-xs">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Captured Waste"
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#1A6B3A] flex items-center justify-center mx-auto shadow-sm">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900"><TranslatableText>Upload or Snap Material Photo</TranslatableText></p>
                  <p className="text-xs text-gray-500 mt-0.5"><TranslatableText>Supports high-res PNG, JPG from field camera</TranslatableText></p>
                </div>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Festival Selection Hint */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-gray-700"><TranslatableText>Festival Origin Context</TranslatableText></label>
            <select
              value={festivalHint}
              onChange={(e) => setFestivalHint(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E6E2D8] bg-white text-xs font-semibold text-gray-800"
            >
              <option value="panagbenga">Panagbenga Flower Festival 🇵🇭 (Baguio, Philippines)</option>
              <option value="yipeng">Yi Peng Sky Lantern Festival 🇹🇭 (Chiang Mai, Thailand)</option>
              <option value="nirmalaya">Ganesh Chaturthi Nirmalaya 🇮🇳 (Thane, India)</option>
              <option value="pingxi">Pingxi Lantern Paper 🇹🇼 (New Taipei, Taiwan)</option>
            </select>
          </div>

          <button
            onClick={handleAnalyzeAI}
            disabled={!previewUrl || analyzing}
            className="w-full py-3.5 rounded-xl bg-[#1A6B3A] hover:bg-[#14532D] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span><TranslatableText>Running Gemini Multimodal Inference...</TranslatableText></span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span><TranslatableText>Analyze Material with Gemini 3.6 Flash</TranslatableText></span>
              </>
            )}
          </button>
        </div>

        {/* Right Col: AI Inference & Pickup Depot Form */}
        <div className="space-y-4">
          {analysisResult ? (
            <div className="bg-white rounded-3xl border border-[#E6E2D8] p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Gemini Confidence: {Math.round(analysisResult.confidence * 100)}%
                  </span>
                </span>
                <span className="text-xs font-mono-data text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                  LIVE OBJECTIVE VISION
                </span>
              </div>

              {/* Inferred Category */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Classified Material Type
                </span>
                <p className="text-lg font-black text-gray-900">{analysisResult.materialType}</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {analysisResult.inferredMaterialDetails}
                </p>

                {/* Material Subtypes */}
                {analysisResult.materialSubtypes && analysisResult.materialSubtypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {analysisResult.materialSubtypes.map((subtype: string) => (
                      <span
                        key={subtype}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold"
                      >
                        {subtype}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Degradation Condition */}
              <div className="p-3 bg-[#F8F6F0] rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">Structural Degradation Grade:</span>
                <span className="font-bold text-[#1A6B3A] bg-emerald-100 px-2 py-0.5 rounded">
                  {analysisResult.condition}
                </span>
              </div>

              {/* AI Volumetric Weight Estimation WITH Integrated Physical Scale Input */}
              <div className="p-4 bg-gradient-to-br from-blue-50/80 to-emerald-50/50 rounded-2xl border border-blue-200 text-xs space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <span className="font-bold text-blue-900 flex items-center space-x-1.5">
                    <Scale className="w-4 h-4 text-blue-700" />
                    <span>AI Volumetric Weight Estimation & Scale Input</span>
                  </span>
                  {analysisResult.estimatedWeightKg && (
                    <span className="font-mono-data font-black text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded">
                      ~{analysisResult.estimatedWeightKg.bestEstimate} kg ({analysisResult.estimatedWeightKg.low} - {analysisResult.estimatedWeightKg.high} kg)
                    </span>
                  )}
                </div>

                {analysisResult.estimatedWeightKg?.visualRationale && (
                  <p className="text-[11px] text-blue-900/80 leading-relaxed italic">
                    "{analysisResult.estimatedWeightKg.visualRationale}"
                  </p>
                )}

                {/* Integrated Scale Input inside Card */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 flex items-center space-x-1">
                      <span>Verified Physical Scale Weight (kg):</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (analysisResult.estimatedWeightKg?.bestEstimate !== undefined) {
                          setWeightKg(analysisResult.estimatedWeightKg.bestEstimate.toString());
                        }
                      }}
                      className="text-[10px] text-blue-700 hover:text-blue-900 font-bold flex items-center space-x-1 underline"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Reset to AI Best Estimate ({analysisResult.estimatedWeightKg?.bestEstimate} kg)</span>
                    </button>
                  </div>

                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full p-3 rounded-xl border border-blue-200 bg-white font-mono-data font-black text-xl text-gray-900 shadow-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    placeholder="e.g. 24.5"
                  />
                </div>
              </div>

              {/* ======================================================== */}
              {/* PICKUP PLACE & REALTIME LOCATION MAP PIN SELECTOR */}
              {/* ======================================================== */}
              <div className="p-4 bg-[#F8F6F0] rounded-2xl border border-[#E6E2D8] text-xs space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center space-x-1.5 text-gray-900 font-bold">
                    <MapPin className="w-4 h-4 text-[#1A6B3A]" />
                    <TranslatableText>Designated Artisan Pickup Place & GPS Coordinates</TranslatableText>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseRealtimeLocation}
                    disabled={isLocating}
                    className="px-2.5 py-1 rounded-lg bg-[#1A6B3A] hover:bg-[#14532D] text-white font-bold text-[10px] flex items-center space-x-1 shadow-xs transition-all disabled:opacity-50"
                  >
                    <Crosshair className={`w-3 h-3 ${isLocating ? "animate-spin" : ""}`} />
                    <TranslatableText>{isLocating ? "Acquiring GPS..." : "Use Realtime Location"}</TranslatableText>
                  </button>
                </div>

                {locationSuccess && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-semibold">
                    ✓ <TranslatableText>{locationSuccess}</TranslatableText>
                  </p>
                )}

                {/* Preset Depot Selector */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700"><TranslatableText>Select Collection Depot / Station:</TranslatableText></label>
                  <select
                    value={pickupDepotName}
                    onChange={(e) => {
                      const selected = (depotPresets[festivalHint] || depotPresets.panagbenga).find(
                        (d) => d.name === e.target.value
                      );
                      if (selected) {
                        setPickupDepotName(selected.name);
                        setPickupLat(selected.lat);
                        setPickupLng(selected.lng);
                      } else {
                        setPickupDepotName(e.target.value);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold text-gray-900 text-xs"
                  >
                    {(depotPresets[festivalHint] || depotPresets.panagbenga).map((depot) => (
                      <option key={depot.name} value={depot.name}>
                        {depot.name} ({depot.lat.toFixed(4)}°, {depot.lng.toFixed(4)}°)
                      </option>
                    ))}
                    <option value="Custom Pin Location">{translateSync("Custom Pin Location (Manual GPS / Pin below)")}</option>
                  </select>
                </div>

                {/* Coordinates & Custom Name Input */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="space-y-1">
                    <label className="text-gray-500 font-medium"><TranslatableText>Latitude</TranslatableText></label>
                    <input
                      type="number"
                      step="0.0001"
                      value={pickupLat}
                      onChange={(e) => setPickupLat(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-lg border border-gray-200 bg-white font-mono-data font-bold text-gray-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-500 font-medium"><TranslatableText>Longitude</TranslatableText></label>
                    <input
                      type="number"
                      step="0.0001"
                      value={pickupLng}
                      onChange={(e) => setPickupLng(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-lg border border-gray-200 bg-white font-mono-data font-bold text-gray-900"
                    />
                  </div>
                </div>

                {/* Live Embedded Map Viewfinder for the Pin */}
                <div className="h-36 rounded-xl overflow-hidden border border-gray-300 bg-gray-100 relative">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
                      }&q=${pickupLat},${pickupLng}&zoom=15`}
                  />
                </div>
              </div>

              {/* Save Batch Result */}
              {savedBatch ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <TranslatableText>Batch Logged & Cryptographically Hashed!</TranslatableText>
                  </div>
                  <p className="font-mono-data text-[10px] text-gray-600 break-all">
                    <TranslatableText>Batch ID</TranslatableText>: <strong>{savedBatch.id}</strong> | <TranslatableText>Depot</TranslatableText>: <strong><TranslatableText>{pickupDepotName}</TranslatableText></strong> | TxHash: {savedBatch.txHash}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleLogBatch}
                  disabled={saving || !weightKg}
                  className="w-full py-3.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <TranslatableText>Minting SHA-256 Batch Telemetry...</TranslatableText>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <TranslatableText>Log Batch to Live Harvest Map</TranslatableText> ({weightKg || 0} kg)
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#E6E2D8] text-center text-gray-400 space-y-2">
              <Sparkles className="w-8 h-8 text-gray-300" />
              <TranslatableParagraph className="text-xs font-semibold">
                Upload a field photo and click "Analyze Material" to view AI grading telemetry, select pickup depot, and log the batch.
              </TranslatableParagraph>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

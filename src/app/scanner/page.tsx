"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Camera, Upload, Sparkles, FileCheck2, AlertTriangle, Crosshair, MapPin, Minus, Plus, RotateCcw } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Gauge, Leaf as LeafIcon } from "lucide-react";
import { AccessGuard } from "@/components/AccessGuard";
import { Badge, Button, Card, EmptyState, Input, LinkButton, RoleHero, Select, StickyActionBar, buttonClass, cn, controlClass } from "@/components/ui";
import { apiJson } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { classifyOffline } from "@/lib/offlineClassifier";
import { SuccessBurst } from "@/components/motion/SuccessBurst";
import { reverseGeocode } from "@/lib/googleMaps";
import { MATERIAL_CATEGORIES, MATERIAL_CONDITIONS } from "@/lib/materials";
import type { ScanAnalysis } from "@/lib/server/aiSamples";
import type { BatchView } from "@/lib/server/views";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker").then((m) => m.LocationPicker), { ssr: false });

/** The list entry matching the AI's answer (case-insensitive), or "" so the officer chooses. */
function pick(list: readonly string[], value: string | undefined): string {
  return list.find((c) => c.toLowerCase() === (value ?? "").trim().toLowerCase()) ?? "";
}

/** A typed coordinate, or null while the field is empty, half-typed or out of range. */
function toCoordinate(raw: string, limit: number): number | null {
  const n = parseFloat(raw);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

const formatKg = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** A scan as the screen shows it: Gemini's answer, a labelled sample, or an on-device estimate. */
type ScanResult = ScanAnalysis & { isSample?: boolean; isOffline?: boolean; model?: string };

function WasteScannerPageContent() {
  const { translateSync, formatNumber } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ScanResult | null>(null);

  // Physical Scale Telemetry
  const [weightKg, setWeightKg] = useState("");
  // "ai_estimate" while the field still holds Gemini's number; any manual change makes it a scale reading.
  const [weightSource, setWeightSource] = useState<"scale" | "ai_estimate">("scale");
  const [saving, setSaving] = useState(false);
  const [savedBatch, setSavedBatch] = useState<BatchView | null>(null);

  // Pickup Location State
  const [collectionPoint, setCollectionPoint] = useState("");
  // Once the officer types their own place name, GPS updates stop overwriting it.
  const [collectionPointEdited, setCollectionPointEdited] = useState(false);
  const [lookingUpPlace, setLookingUpPlace] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  // Active release agreements the batch can be logged against.
  const [agreements, setAgreements] = useState<
    Array<{ id: string; title: string; festival: string; status: string; allocatedKg: number; collectedKg: number }>
  >([]);
  // What gets logged: the AI's answer, corrected by the officer where needed.
  const [material, setMaterial] = useState("");
  const [condition, setCondition] = useState("");
  const [agreementId, setAgreementId] = useState("");
  // Each error shows next to the control that caused it, so it isn't off-screen on a phone.
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [logError, setLogError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiJson<typeof agreements>("/api/agreements").then((result) => {
      if (result.success) setAgreements((result.data ?? []).filter((a) => a.status === "active"));
      else setError(result.error ?? "Couldn't load release agreements.");
    });
  }, []);

  // Default to the first active agreement; the officer can pick another.
  useEffect(() => {
    // "Scan a batch for it" from the agreements page preselects that agreement.
    const wanted = new URLSearchParams(window.location.search).get("agreement");
    setAgreementId((current) =>
      agreements.some((a) => a.id === current) ? current : agreements.find((a) => a.id === wanted)?.id ?? agreements[0]?.id ?? ""
    );
  }, [agreements]);

  // Ask for the position as soon as the page opens, so the pickup point is ready by the time the photo is analysed.
  useEffect(() => {
    handleUseRealtimeLocation(true);
  }, []);

  // Name the pickup point from its coordinates, waiting for the pin to settle first.
  useEffect(() => {
    if (pickupLat === null || pickupLng === null || collectionPointEdited) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLookingUpPlace(true);
      reverseGeocode(pickupLat, pickupLng)
        .then((place) => {
          if (!cancelled && place) setCollectionPoint(place);
        })
        .catch(() => {})
        .finally(() => !cancelled && setLookingUpPlace(false));
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pickupLat, pickupLng, collectionPointEdited]);

  const selectedAgreement = agreements.find((a) => a.id === agreementId);
  const festivalHint = selectedAgreement?.festival ?? "";
  const remainingKg = selectedAgreement ? Math.max(0, Math.round((selectedAgreement.allocatedKg - selectedAgreement.collectedKg) * 10) / 10) : null;
  const overQuota = remainingKg !== null && parseFloat(weightKg) > remainingKg;

  // Pins the batch to the device's GPS position. `silent` skips the error message on failure.
  const handleUseRealtimeLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) setLocationError("This browser can't share its location. Type the coordinates instead.");
      setShowCoordinates(true);
      return;
    }
    setIsLocating(true);
    setLocationSuccess(null);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setPickupLat(lat);
        setPickupLng(lng);
        setLocationSuccess("Pinned to your current location.");
        setIsLocating(false);
      },
      (gpsError) => {
        if (!silent) setLocationError(`Couldn't get your location (${gpsError.message}). Type the coordinates instead.`);
        setShowCoordinates(true);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // On phones the result stacks under the capture card, so bring it into view.
  const showResult = () =>
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1023px)").matches) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

  const analyze = async (imageBase64: string) => {
    setAnalyzing(true);
    setError(null);
    const result = await apiJson<ScanResult>("/api/ai/scan", {
      method: "POST",
      body: JSON.stringify({ imageBase64, festivalHint }),
    });
    // The weight field is left for the physical scale reading; the AI estimate is one click away.
    if (result.success && result.data) {
      setAnalysisResult(result.data);
      // A sample was not analysed, so the officer must choose; otherwise start from the AI's answer.
      setMaterial(result.data.isSample ? "" : pick(MATERIAL_CATEGORIES, result.data.materialType));
      setCondition(result.data.isSample ? "" : pick(MATERIAL_CONDITIONS, result.data.condition));
      setAnalyzing(false);
      showResult();
      return;
    }

    // No signal or Gemini down: fall back to the on-device Teachable Machine model, if installed.
    const offline = await classifyOffline(imageBase64).catch(() => null);
    if (offline) {
      setAnalysisResult({
        materialType: offline.label,
        confidence: offline.probability,
        condition: "Not assessed on-device. Check by eye.",
        inferredMaterialDetails: "",
        isOffline: true,
      });
      setMaterial(pick(MATERIAL_CATEGORIES, offline.label));
      setCondition("");
      showResult();
    } else {
      setError(result.error ?? "The AI scan failed.");
    }
    setAnalyzing(false);
  };

  // Demo: run the scanner on a bundled sample photo (no camera needed at the booth).
  const runSamplePhoto = async (name: "paper" | "fabric" | "flowers" | "wood") => {
    setAnalysisResult(null);
    setSavedBatch(null);
    setError(null);
    try {
      const img = new window.Image();
      img.src = `/demo/${name}.svg`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 768;
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      setPreviewUrl(dataUrl);
      handleUseRealtimeLocation(true);
      await analyze(dataUrl);
    } catch {
      setError("Couldn't load the sample photo.");
    }
  };

  // Taking the photo starts the analysis and the GPS lookup straight away.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalysisResult(null);
    setSavedBatch(null);
    setError(null);
    try {
      const compressed = await compressImage(file, 1024, 0.85);
      setPreviewUrl(compressed);
      handleUseRealtimeLocation(true);
      await analyze(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That photo couldn't be read.");
    }
  };

  const stepWeight = (delta: number) => {
    const next = Math.max(0, (parseFloat(weightKg) || 0) + delta);
    setWeightKg(String(Math.round(next * 10) / 10));
    setWeightSource("scale");
  };

  const handleAnalyzeAI = () => previewUrl && analyze(previewUrl);

  const handleLogBatch = async () => {
    if (!analysisResult || !material || !condition || !weightKg || !agreementId || pickupLat === null || pickupLng === null || analysisResult.peopleVisible) return;
    setSaving(true);
    setLogError(null);
    const result = await apiJson<BatchView>("/api/materials", {
      method: "POST",
      body: JSON.stringify({
        title: material,
        materialType: material,
        weightKg: parseFloat(weightKg),
        weightSource,
        pickupAddress: collectionPoint.trim() || undefined,
        condition,
        gpsLat: pickupLat,
        gpsLng: pickupLng,
        imageUrl: previewUrl,
        agreementId,
        aiInferredMaterial: analysisResult.inferredMaterialDetails,
        aiInferredCondition: analysisResult.condition,
        aiConfidence: analysisResult.isOffline ? analysisResult.confidence : undefined,
        aiSource: analysisResult.isSample ? undefined : analysisResult.isOffline ? "on_device" : "gemini",
        alsoContains: analysisResult.alsoContains ?? [],
      }),
    });
    if (result.success && result.data) {
      setSavedBatch(result.data);
      // Keep the agreement's remaining amount current for the next batch.
      setAgreements((prev) => prev.map((a) => (a.id === agreementId ? { ...a, collectedKg: a.collectedKg + parseFloat(weightKg) } : a)));
    } else setLogError(result.error ?? "Couldn't log the batch.");
    setSaving(false);
  };

  const startOver = () => {
    setPreviewUrl(null);
    setAnalysisResult(null);
    setSavedBatch(null);
    setMaterial("");
    setCondition("");
    setWeightKg("");
    setWeightSource("scale");
    setError(null);
    setLogError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const flags: string[] = analysisResult?.contaminationFlags ?? [];
  const aiWeight = analysisResult?.estimatedWeightKg;
  const crafts: string[] = analysisResult?.suggestedCraftTypologies ?? [];
  const stepNow = savedBatch ? 3 : analysisResult ? 2 : 1;
  const steps = [translateSync("Capture"), translateSync("Review AI result"), translateSync("Log batch")];
  // Everything "Log batch" waits for, in words, so a grey button is never a mystery.
  const missingToLog = [
    !material && translateSync("material"),
    !condition && translateSync("condition"),
    !weightKg && translateSync("weight"),
    !agreementId && translateSync("release agreement"),
    (pickupLat === null || pickupLng === null) && translateSync("pickup location"),
    overQuota && translateSync("weight within the agreement's limit"),
    analysisResult?.peopleVisible && translateSync("a photo without people in it"),
  ].filter((x): x is string => Boolean(x));

  return (
    <div>
      <RoleHero
        width="6xl"
        eyebrow={translateSync("Collection point")}
        title={translateSync("AI material scanner")}
        description={translateSync("Photograph recovered festival material. Gemini identifies it, estimates the weight and flags contamination before it is offered to artisans.")}
        stats={[
          { icon: FileCheck2, label: translateSync("Active agreements"), hint: translateSync("Festivals you may collect from"), value: formatNumber(agreements.length) },
          { icon: LeafIcon, label: translateSync("Collected so far"), unit: "kg", hint: translateSync("Under your active agreements"), value: formatNumber(agreements.reduce((t, a) => t + (a.collectedKg || 0), 0)) },
          { icon: Gauge, label: translateSync("Still allowed"), unit: "kg", hint: translateSync("Left on the agreed amounts"), value: formatNumber(Math.max(0, agreements.reduce((t, a) => t + (a.allocatedKg || 0) - (a.collectedKg || 0), 0))) },
        ]}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">

        <ol className="grid grid-cols-3 gap-2 sm:gap-4" aria-label={translateSync("Progress")}>
          {steps.map((label, i) => {
            const n = i + 1;
            const active = stepNow >= n;
            return (
              <li key={label} className="space-y-2">
                <div className={cn("h-1 rounded-full", active ? "bg-brand" : "bg-paper-2")} />
                <span className={cn("text-sm", stepNow === n ? "text-ink font-medium" : "text-ink-3")}>
                  {n}. {label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Capture */}
          <Card className="p-5 sm:p-6 space-y-5">
            <label className="relative block aspect-[4/3] rounded-md border-2 border-dashed border-line-strong bg-paper hover:border-pine-300 transition-colors overflow-hidden cursor-pointer">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={translateSync("Captured material")} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <span className="w-14 h-14 rounded-full bg-pine-100 text-brand flex items-center justify-center">
                    <Camera className="w-7 h-7" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-medium text-ink">{translateSync("Take or upload a photo")}</p>
                    <p className="text-sm text-ink-3 mt-0.5">{translateSync("Fill the frame with the material. Photograph the material, not the crowd.")}</p>
                  </div>
                </div>
              )}
              {previewUrl && analyzing && (
                // Warm light sweeps across the photo while Gemini looks at it
                <span className="analyse-sweep absolute inset-0 pointer-events-none" aria-hidden />
              )}
              {previewUrl && (
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-surface/95 px-3 h-9 text-sm font-medium text-ink shadow-card">
                  <Upload className="w-4 h-4" />
                  {translateSync("Replace photo")}
                </span>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="sr-only" />
            </label>

            {!previewUrl && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-ink-3">{translateSync("No camera? Try a sample:")}</span>
                {(["paper", "fabric", "flowers", "wood"] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => runSamplePhoto(n)}
                    disabled={analyzing}
                    className="inline-flex items-center h-8 px-3 rounded-full border border-line bg-surface text-ink-2 hover:border-pine-300 hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {translateSync(n === "paper" ? "Paper" : n === "fabric" ? "Fabric" : n === "flowers" ? "Flowers" : "Wood")}
                  </button>
                ))}
              </div>
            )}

            <Select label={translateSync("Release agreement")} value={agreementId} onChange={(e) => setAgreementId(e.target.value)}>
              {agreements.length === 0 && <option value="">{translateSync("No active agreements")}</option>}
              {agreements.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} · {a.title}
                </option>
              ))}
            </Select>
            {remainingKg !== null && (
              <p className="-mt-3 text-sm text-ink-3 tabular">
                {formatKg(remainingKg)} kg {translateSync("still allowed under this agreement")}
              </p>
            )}
            {agreements.length === 0 && (
              <p className="-mt-3 text-sm text-ink-3">
                {translateSync("A batch must be logged against a release agreement.")}{" "}
                <Link href="/agreements" className="text-brand font-medium underline underline-offset-2">
                  {translateSync("Create one")}
                </Link>
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-danger">
                {translateSync(error)}
              </p>
            )}

            <Button size="lg" className="w-full" onClick={handleAnalyzeAI} disabled={!previewUrl} loading={analyzing}>
              {!analyzing && <Sparkles className="w-4 h-4" />}
              {analyzing ? translateSync("Gemini is analysing…") : analysisResult ? translateSync("Analyse again") : translateSync("Analyse with Gemini")}
            </Button>
          </Card>

          {/* Result */}
          {analysisResult ? (
            <div ref={resultRef} className="space-y-6 scroll-mt-20">
              <Card className="p-5 sm:p-6 space-y-5 stagger-in">
                {analysisResult.peopleVisible && (
                  <p role="alert" className="rounded-md bg-danger-100 border border-danger/20 p-3 text-sm text-danger">
                    {translateSync("People are visible in this photo. Batch photos are public, so retake it close-up on the material before logging.")}
                  </p>
                )}
                {analysisResult.isOffline && (
                  <p className="rounded-md bg-paper-2 border border-line p-3 text-sm text-ink-2">
                    {translateSync("On-device estimate (Teachable Machine): Gemini couldn't be reached, so only the material type was identified. Check condition and contamination by eye.")}
                  </p>
                )}
                {analysisResult.isSample && (
                  <p className="rounded-md bg-warn-100 border border-warn/20 p-3 text-sm text-warn">
                    {translateSync("Demo sample: Gemini was unavailable, so this photo was not analysed. Check the material and enter its details by hand.")}
                  </p>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-[28px] leading-tight font-semibold text-ink">{translateSync(analysisResult.materialType)}</h2>
                    {analysisResult.alsoContains && analysisResult.alsoContains.length > 0 && (
                      <p className="text-sm text-ink-2 mt-0.5">
                        {translateSync("Also contains")}: {analysisResult.alsoContains.map((c) => translateSync(c).toLowerCase()).join(", ")}
                      </p>
                    )}
                    {analysisResult.inferredMaterialDetails && <p className="text-sm text-ink-3 mt-0.5">{translateSync(analysisResult.inferredMaterialDetails)}</p>}
                  </div>
                  {!analysisResult.isSample && (
                    <Badge tone="pine" className="shrink-0">
                      {analysisResult.isOffline
                        ? `${translateSync("On-device")} · ${Math.round((analysisResult.confidence ?? 0) * 100)}%`
                        : translateSync("Gemini's guess")}
                    </Badge>
                  )}
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border border-line rounded-md overflow-hidden text-sm">
                  <div className="bg-surface p-3">
                    <dt className="text-xs text-ink-3">{translateSync("Condition")}</dt>
                    <dd className="mt-0.5 font-medium text-ink">{translateSync(analysisResult.condition)}</dd>
                  </div>
                  <div className="bg-surface p-3">
                    <dt className="text-xs text-ink-3">{translateSync("Weight")}</dt>
                    <dd className="tabular mt-0.5 font-medium text-ink">
                      {analysisResult.estimatedWeightKg ? `~${analysisResult.estimatedWeightKg.bestEstimate} kg` : "—"}
                    </dd>
                  </div>
                  <div className="bg-surface p-3">
                    <dt className="text-xs text-ink-3">{translateSync("Status")}</dt>
                    <dd className={cn("mt-0.5 font-medium", analysisResult.isSample || analysisResult.isOffline ? "text-ink-3" : flags.length ? "text-warn" : "text-success")}>
                      {analysisResult.isSample || analysisResult.isOffline
                        ? translateSync("Check by eye")
                        : flags.length
                        ? translateSync("Clean first")
                        : translateSync("Ready")}
                    </dd>
                  </div>
                </dl>

                {/* Contamination: only when Gemini actually assessed the photo */}
                {!analysisResult.isSample && !analysisResult.isOffline && flags.length > 0 && (
                  <p className="flex items-start gap-2 rounded-md bg-warn-100 border border-warn/20 px-3 py-2.5 text-sm text-warn">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      {translateSync("Remove first")}: {flags.map((f) => translateSync(f)).join(", ")}
                    </span>
                  </p>
                )}

                {crafts.length > 0 && (
                  <p className="text-sm text-ink-2">
                    <span className="text-ink-3">{translateSync("Good for")}: </span>
                    {crafts.map((c) => translateSync(c)).join(" · ")}
                  </p>
                )}
              </Card>

              <Card className="p-5 sm:p-6 space-y-5">
                <h3 className="text-base font-semibold text-ink font-sans">{translateSync("Check, weigh and locate")}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label={translateSync("Material")}
                    required
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    hint={analysisResult.isSample ? translateSync("Gemini didn't analyse this photo. Choose by eye.") : translateSync("Change it if the AI got it wrong.")}
                  >
                    <option value="" disabled>
                      {translateSync("Choose a material")}
                    </option>
                    {MATERIAL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {translateSync(c)}
                      </option>
                    ))}
                  </Select>
                  <Select label={translateSync("Condition")} required value={condition} onChange={(e) => setCondition(e.target.value)}>
                    <option value="" disabled>
                      {translateSync("Choose a condition")}
                    </option>
                    {MATERIAL_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {translateSync(c)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="scale-weight" className="text-sm font-medium text-ink">
                    {translateSync("Weight")}
                  </label>
                  <div className="flex items-stretch gap-2">
                    <button
                      type="button"
                      onClick={() => stepWeight(-0.5)}
                      aria-label={translateSync("Remove 0.5 kg")}
                      className="w-12 shrink-0 rounded-md border border-line bg-surface text-ink hover:bg-paper-2 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="relative flex-1 min-w-0">
                      <input
                        id="scale-weight"
                        type="number"
                        step="0.1"
                        min="0"
                        inputMode="decimal"
                        value={weightKg}
                        onChange={(e) => {
                          setWeightKg(e.target.value);
                          setWeightSource("scale");
                        }}
                        className={cn(controlClass, "h-14 pr-12 tabular text-2xl sm:text-2xl font-semibold text-center")}
                        placeholder="0.0"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-3">kg</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => stepWeight(0.5)}
                      aria-label={translateSync("Add 0.5 kg")}
                      className="w-12 shrink-0 rounded-md border border-line bg-surface text-ink hover:bg-paper-2 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {aiWeight && (
                    <button
                      type="button"
                      onClick={() => {
                        setWeightKg(aiWeight.bestEstimate.toString());
                        setWeightSource("ai_estimate");
                      }}
                      className={cn(
                        "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                        weightSource === "ai_estimate" ? "border-pine-300 bg-pine-50 text-brand" : "border-line bg-paper hover:border-pine-300"
                      )}
                    >
                      <span className="flex flex-wrap items-center gap-x-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5" />
                        {translateSync("AI estimate")}: ~{aiWeight.bestEstimate} kg
                        <span className="font-normal text-ink-3">
                          ({aiWeight.low}–{aiWeight.high} kg)
                        </span>
                      </span>
                    </button>
                  )}
                  {overQuota && (
                    <p role="alert" className="text-sm text-warn">
                      {translateSync("This is more than the agreement still allows. Log it against another agreement or create a new one.")}
                    </p>
                  )}
                  <p className="text-xs text-ink-3">
                    {weightSource === "ai_estimate"
                      ? translateSync("Logged as an AI estimate. Weigh the batch and type the scale reading if you can.")
                      : translateSync("Type the scale reading, or tap the AI estimate if there is no scale.")}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-md border border-line bg-paper p-3">
                    <span className="mt-0.5 w-8 h-8 shrink-0 rounded-full bg-pine-100 text-brand flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-ink-3">{translateSync("Collection point")}</p>
                      {pickupLat !== null && pickupLng !== null ? (
                        <>
                          <input
                            value={collectionPoint}
                            onChange={(e) => {
                              setCollectionPoint(e.target.value);
                              setCollectionPointEdited(true);
                            }}
                            placeholder={lookingUpPlace ? translateSync("Finding the place name…") : translateSync("Name this pickup point")}
                            aria-label={translateSync("Collection point")}
                            className={cn(controlClass, "mt-1 h-11 font-medium")}
                          />
                          <p className="text-xs text-ink-3 tabular">
                            {pickupLat.toFixed(5)}°, {pickupLng.toFixed(5)}°
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-ink-2">
                          {isLocating ? translateSync("Finding your location…") : translateSync("Location not shared yet.")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setCollectionPointEdited(false);
                        handleUseRealtimeLocation();
                      }}
                      disabled={isLocating}
                    >
                      <Crosshair className="w-4 h-4" />
                      {translateSync(isLocating ? "Locating…" : "Use my location")}
                    </Button>
                    {!showCoordinates && (
                      <Button variant="ghost" size="sm" onClick={() => setShowCoordinates(true)}>
                        {translateSync("Enter coordinates manually")}
                      </Button>
                    )}
                  </div>
                  {locationSuccess && <p className="text-sm text-success">{translateSync(locationSuccess)}</p>}
                  {locationError && (
                    <p role="alert" className="text-sm text-danger">
                      {translateSync(locationError)}
                    </p>
                  )}

                  {pickupLat !== null && pickupLng !== null && (
                    <LocationPicker
                      lat={pickupLat}
                      lng={pickupLng}
                      onMove={(lat, lng) => {
                        setPickupLat(lat);
                        setPickupLng(lng);
                        setCollectionPointEdited(false);
                        setLocationSuccess(null);
                      }}
                    />
                  )}

                  {showCoordinates && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={translateSync("Latitude")} type="number" step="0.0001" min={-90} max={90} value={pickupLat ?? ""} onChange={(e) => setPickupLat(toCoordinate(e.target.value, 90))} className="tabular" />
                      <Input label={translateSync("Longitude")} type="number" step="0.0001" min={-180} max={180} value={pickupLng ?? ""} onChange={(e) => setPickupLng(toCoordinate(e.target.value, 180))} className="tabular" />
                    </div>
                  )}
                </div>

                {savedBatch ? (
                  <div className="rounded-md bg-success-100 border border-success/20 p-4 space-y-2" role="status">
                    <p className="flex items-center gap-3 text-[15px] font-medium text-success">
                      <SuccessBurst size={40} scraps />
                      {translateSync("Batch saved")}
                    </p>
                    <dl className="text-xs text-ink-2 space-y-1">
                      <div className="flex gap-2">
                        <dt className="text-ink-3 w-16 shrink-0">{translateSync("Batch")}</dt>
                        <dd className="font-mono-data break-all">{savedBatch.id}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-ink-3 w-16 shrink-0">{translateSync("Location")}</dt>
                        <dd className="font-mono-data">{collectionPoint ? `${collectionPoint} · ` : ""}{pickupLat?.toFixed(4)}°, {pickupLng?.toFixed(4)}°</dd>
                      </div>
                      {savedBatch.txHash && (
                        <div className="flex gap-2">
                          <dt className="text-ink-3 w-16 shrink-0">{translateSync("Tamper check")}</dt>
                          <dd className="font-mono-data break-all">{savedBatch.txHash}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <LinkButton href="/map" size="sm">
                        <MapPin className="w-4 h-4" />
                        {translateSync("View on map")}
                      </LinkButton>
                      <button type="button" onClick={startOver} className={buttonClass("secondary", "sm")}>
                        <RotateCcw className="w-4 h-4" />
                        {translateSync("Scan another")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <StickyActionBar className="-mx-5 px-5 sm:-mx-6 sm:px-6 space-y-2">
                    {logError && (
                      <p role="alert" className="text-sm text-danger">
                        {translateSync(logError)}
                      </p>
                    )}
                    {missingToLog.length > 0 && (
                      <p className="text-sm text-ink-3" aria-live="polite">
                        <span className="font-medium text-ink-2">{translateSync("Still needed:")}</span> {missingToLog.join(" · ")}
                      </p>
                    )}
                    <Button size="lg" className="w-full" onClick={handleLogBatch} disabled={missingToLog.length > 0} loading={saving}>
                      {!saving && <FileCheck2 className="w-4 h-4" />}
                      {saving ? translateSync("Logging batch…") : `${translateSync("Log batch")} · ${weightKg || 0} kg`}
                    </Button>
                  </StickyActionBar>
                )}
              </Card>
            </div>
          ) : (
            <EmptyState
              className="hidden lg:flex lg:min-h-[420px] justify-center"
              icon={<Sparkles className="w-5 h-5" />}
              title={translateSync("Results appear here")}
              description={translateSync("Add a photo and run the analysis. You'll see the material type, condition, contamination flags and an estimated weight.")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function WasteScannerPage() {
  return (
    <AccessGuard allowedRoles={["lgu", "admin"]} pageTitle="AI material scanner">
      <WasteScannerPageContent />
    </AccessGuard>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Camera, Upload, Sparkles, FileCheck2, AlertTriangle, CheckCircle2, Crosshair, MapPin, Minus, Plus } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { AccessGuard } from "@/components/AccessGuard";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, cn, controlClass } from "@/components/ui";
import { apiJson } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { classifyOffline } from "@/lib/offlineClassifier";
import { reverseGeocode } from "@/lib/googleMaps";
import { LocationPicker } from "@/components/map/LocationPicker";


function WasteScannerPageContent() {
  const { translateSync } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // Physical Scale Telemetry
  const [weightKg, setWeightKg] = useState("");
  // "ai_estimate" while the field still holds Gemini's number; any manual change makes it a scale reading.
  const [weightSource, setWeightSource] = useState<"scale" | "ai_estimate">("scale");
  const [saving, setSaving] = useState(false);
  const [savedBatch, setSavedBatch] = useState<any | null>(null);

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
  const [agreements, setAgreements] = useState<Array<{ id: string; title: string; festival: string; status: string }>>([]);
  const [agreementId, setAgreementId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<typeof agreements>("/api/agreements").then((result) => {
      if (result.success) setAgreements((result.data ?? []).filter((a) => a.status === "active"));
      else setError(result.error ?? "Couldn't load release agreements.");
    });
  }, []);

  // Default to the first active agreement; the officer can pick another.
  useEffect(() => {
    setAgreementId((current) => (agreements.some((a) => a.id === current) ? current : agreements[0]?.id ?? ""));
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

  const festivalHint = agreements.find((a) => a.id === agreementId)?.festival ?? "";

  // Pins the batch to the device's GPS position. `silent` skips the error message on failure.
  const handleUseRealtimeLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) setError("This browser can't share its location. Type the coordinates instead.");
      setShowCoordinates(true);
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
        setLocationSuccess("Pinned to your current location.");
        setIsLocating(false);
      },
      (gpsError) => {
        if (!silent) setError(`Couldn't get your location (${gpsError.message}). Type the coordinates instead.`);
        setShowCoordinates(true);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const analyze = async (imageBase64: string) => {
    setAnalyzing(true);
    setError(null);
    const result = await apiJson<any>("/api/ai/scan", {
      method: "POST",
      body: JSON.stringify({ imageBase64, festivalHint }),
    });
    // The weight field is left for the physical scale reading; the AI estimate is one click away.
    if (result.success) {
      setAnalysisResult(result.data);
      setAnalyzing(false);
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
    } else {
      setError(result.error ?? "The AI scan failed.");
    }
    setAnalyzing(false);
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
    if (!analysisResult || !weightKg || !agreementId || pickupLat === null || pickupLng === null || analysisResult.peopleVisible) return;
    setSaving(true);
    setError(null);
    const result = await apiJson<any>("/api/materials", {
      method: "POST",
      body: JSON.stringify({
        title: analysisResult.materialType,
        materialType: analysisResult.materialType,
        weightKg: parseFloat(weightKg),
        weightSource,
        pickupAddress: collectionPoint.trim() || undefined,
        condition: analysisResult.condition,
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
    if (result.success) setSavedBatch(result.data);
    else setError(result.error ?? "Couldn't log the batch.");
    setSaving(false);
  };

  const flags: string[] = analysisResult?.contaminationFlags ?? [];
  const crafts: string[] = analysisResult?.suggestedCraftTypologies ?? [];
  const stepNow = savedBatch ? 3 : analysisResult ? 2 : 1;
  const steps = [translateSync("Capture"), translateSync("Review AI result"), translateSync("Log batch")];

  return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <PageHeader
          eyebrow={translateSync("Collection point")}
          title={translateSync("AI material scanner")}
          description={translateSync("Photograph recovered festival material. Gemini identifies it, estimates weight and flags contamination before it is offered to artisans.")}
        />

        <ol className="grid grid-cols-3 gap-2 sm:gap-4" aria-label={translateSync("Progress")}>
          {steps.map((label, i) => {
            const n = i + 1;
            const active = stepNow >= n;
            return (
              <li key={label} className="space-y-2">
                <div className={cn("h-1 rounded-full", active ? "bg-pine-700" : "bg-paper-2")} />
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
                  <span className="w-14 h-14 rounded-full bg-pine-100 text-pine-700 flex items-center justify-center">
                    <Camera className="w-7 h-7" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-medium text-ink">{translateSync("Take or upload a photo")}</p>
                    <p className="text-sm text-ink-3 mt-0.5">{translateSync("Fill the frame with the material. Photograph the material, not the crowd.")}</p>
                  </div>
                </div>
              )}
              {previewUrl && (
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-surface/95 px-3 h-9 text-sm font-medium text-ink shadow-card">
                  <Upload className="w-4 h-4" />
                  {translateSync("Replace photo")}
                </span>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="sr-only" />
            </label>

            <Select label={translateSync("Release agreement")} value={agreementId} onChange={(e) => setAgreementId(e.target.value)}>
              {agreements.length === 0 && <option value="">{translateSync("No active agreements")}</option>}
              {agreements.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} · {a.title}
                </option>
              ))}
            </Select>

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
            <div className="space-y-6">
              <Card className="p-5 sm:p-6 space-y-5">
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
                    {analysisResult.alsoContains?.length > 0 && (
                      <p className="text-sm text-ink-2 mt-0.5">
                        {translateSync("Also contains")}: {analysisResult.alsoContains.map((c: string) => translateSync(c).toLowerCase()).join(", ")}
                      </p>
                    )}
                    {analysisResult.inferredMaterialDetails && <p className="text-sm text-ink-3 mt-0.5">{translateSync(analysisResult.inferredMaterialDetails)}</p>}
                  </div>
                  {!analysisResult.isSample && (
                    <Badge tone="pine" className="shrink-0">
                      {analysisResult.isOffline
                        ? `${translateSync("On-device")} · ${Math.round(analysisResult.confidence * 100)}%`
                        : translateSync("Gemini's guess")}
                    </Badge>
                  )}
                </div>

                <dl className="grid grid-cols-3 gap-px bg-line border border-line rounded-md overflow-hidden text-sm">
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
                <h3 className="text-base font-semibold text-ink font-sans">{translateSync("Weigh and locate")}</h3>

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
                        className={cn(controlClass, "h-14 pr-12 tabular text-2xl font-semibold text-center")}
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
                  {analysisResult.estimatedWeightKg?.bestEstimate !== undefined && (
                    <button
                      type="button"
                      onClick={() => {
                        setWeightKg(analysisResult.estimatedWeightKg.bestEstimate.toString());
                        setWeightSource("ai_estimate");
                      }}
                      className={cn(
                        "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                        weightSource === "ai_estimate" ? "border-pine-300 bg-pine-50 text-pine-800" : "border-line bg-paper hover:border-pine-300"
                      )}
                    >
                      <span className="flex flex-wrap items-center gap-x-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5" />
                        {translateSync("AI estimate")}: ~{analysisResult.estimatedWeightKg.bestEstimate} kg
                        <span className="font-normal text-ink-3">
                          ({analysisResult.estimatedWeightKg.low}–{analysisResult.estimatedWeightKg.high} kg)
                        </span>
                      </span>
                    </button>
                  )}
                  <p className="text-xs text-ink-3">
                    {weightSource === "ai_estimate"
                      ? translateSync("Logged as an AI estimate. Weigh the batch and type the scale reading if you can.")
                      : translateSync("Type the scale reading, or tap the AI estimate if there is no scale.")}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-md border border-line bg-paper p-3">
                    <span className="mt-0.5 w-8 h-8 shrink-0 rounded-full bg-pine-100 text-pine-700 flex items-center justify-center">
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
                            className="w-full bg-transparent font-medium text-ink outline-none border-b border-transparent focus:border-pine-300"
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
                    <button
                      type="button"
                      onClick={() => {
                        setCollectionPointEdited(false);
                        handleUseRealtimeLocation();
                      }}
                      disabled={isLocating}
                      className="shrink-0 inline-flex items-center gap-1 text-xs text-pine-600 hover:text-pine-700 cursor-pointer disabled:opacity-50"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      {translateSync(isLocating ? "Locating…" : "Use my location")}
                    </button>
                  </div>
                  {locationSuccess && <p className="text-xs text-success">{translateSync(locationSuccess)}</p>}

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

                  {showCoordinates ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={translateSync("Latitude")} type="number" step="0.0001" min={-90} max={90} value={pickupLat ?? ""} onChange={(e) => setPickupLat(e.target.value === "" ? null : parseFloat(e.target.value))} className="tabular" />
                      <Input label={translateSync("Longitude")} type="number" step="0.0001" min={-180} max={180} value={pickupLng ?? ""} onChange={(e) => setPickupLng(e.target.value === "" ? null : parseFloat(e.target.value))} className="tabular" />
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowCoordinates(true)} className="text-xs text-ink-3 underline underline-offset-2 hover:text-ink cursor-pointer">
                      {translateSync("Enter coordinates manually")}
                    </button>
                  )}
                </div>

                {savedBatch ? (
                  <div className="rounded-md bg-success-100 border border-success/20 p-4 space-y-2" role="status">
                    <p className="flex items-center gap-2 text-sm font-medium text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      {translateSync("Batch logged to the ledger")}
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
                          <dt className="text-ink-3 w-16 shrink-0">{translateSync("Fingerprint")}</dt>
                          <dd className="font-mono-data break-all">{savedBatch.txHash}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                ) : (
                  <Button size="lg" className="w-full" onClick={handleLogBatch} disabled={!weightKg || !agreementId || pickupLat === null || pickupLng === null || analysisResult.peopleVisible} loading={saving}>
                    {!saving && <FileCheck2 className="w-4 h-4" />}
                    {saving ? translateSync("Logging batch…") : `${translateSync("Log batch")} · ${weightKg || 0} kg`}
                  </Button>
                )}
              </Card>
            </div>
          ) : (
            <EmptyState
              className="lg:min-h-[420px] justify-center"
              icon={<Sparkles className="w-5 h-5" />}
              title={translateSync("Results appear here")}
              description={translateSync("Add a photo and run the analysis. You'll see the material type, condition, contamination flags and an estimated weight.")}
            />
          )}
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

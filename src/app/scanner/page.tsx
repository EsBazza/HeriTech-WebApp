"use client";

import React, { useState, useEffect } from "react";
import { Camera, Upload, Sparkles, FileCheck2, AlertTriangle, CheckCircle2, RefreshCw, Crosshair } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { AccessGuard } from "@/components/AccessGuard";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, cn, controlClass } from "@/components/ui";
import { apiJson } from "@/lib/api";
import { compressImage } from "@/lib/image";

/** Words that identify each festival preset's agreement by its festival name. */
const FESTIVAL_KEYWORDS: Record<string, string> = {
  panagbenga: "panagbenga",
  yipeng: "yi peng",
  nirmalaya: "ganesh",
  pingxi: "pingxi",
};

function WasteScannerPageContent() {
  const { translateSync } = useTranslation();
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

  // Sync default depot and matching agreement when festival changes
  useEffect(() => {
    const presets = depotPresets[festivalHint] || depotPresets.panagbenga;
    if (presets.length > 0) {
      setPickupDepotName(presets[0].name);
      setPickupLat(presets[0].lat);
      setPickupLng(presets[0].lng);
    }
    const keyword = FESTIVAL_KEYWORDS[festivalHint];
    const match = agreements.find((a) => a.festival.toLowerCase().includes(keyword));
    setAgreementId((current) => match?.id ?? (agreements.some((a) => a.id === current) ? current : agreements[0]?.id ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festivalHint, agreements]);

  // Pins the batch to the device's GPS position. `silent` keeps the preset depot on failure.
  const handleUseRealtimeLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) setError("This browser can't share its location. Pick a depot instead.");
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
        setPickupDepotName(`Field GPS pin (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`);
        setLocationSuccess("Pinned to your current location.");
        setIsLocating(false);
      },
      (gpsError) => {
        if (!silent) setError(`Couldn't get your location (${gpsError.message}). Pick a depot instead.`);
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
    if (result.success) setAnalysisResult(result.data);
    else setError(result.error ?? "The AI scan failed.");
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

  const handleAnalyzeAI = () => previewUrl && analyze(previewUrl);

  const handleLogBatch = async () => {
    if (!analysisResult || !weightKg || !agreementId) return;
    setSaving(true);
    setError(null);
    const result = await apiJson<any>("/api/materials", {
      method: "POST",
      body: JSON.stringify({
        title: `${analysisResult.materialType} (${pickupDepotName})`,
        materialType: analysisResult.materialType,
        weightKg: parseFloat(weightKg),
        condition: analysisResult.condition,
        gpsLat: pickupLat,
        gpsLng: pickupLng,
        imageUrl: previewUrl,
        agreementId,
        aiInferredMaterial: analysisResult.inferredMaterialDetails,
        aiInferredCondition: analysisResult.condition,
        aiConfidence: analysisResult.confidence,
      }),
    });
    if (result.success) setSavedBatch(result.data);
    else setError(result.error ?? "Couldn't log the batch.");
    setSaving(false);
  };

  const presets = depotPresets[festivalHint] || depotPresets.panagbenga;
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
                    <p className="text-sm text-ink-3 mt-0.5">{translateSync("JPG or PNG. Fill the frame with the material.")}</p>
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

            <Select label={translateSync("Festival")} value={festivalHint} onChange={(e) => setFestivalHint(e.target.value)}>
              <option value="panagbenga">Panagbenga Flower Festival (Baguio, Philippines)</option>
              <option value="yipeng">Yi Peng Sky Lantern Festival (Chiang Mai, Thailand)</option>
              <option value="nirmalaya">Ganesh Chaturthi Nirmalaya (Thane, India)</option>
              <option value="pingxi">Pingxi Lantern Paper (New Taipei, Taiwan)</option>
            </Select>

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
                {analysisResult.isSample && (
                  <p className="rounded-md bg-warn-100 border border-warn/20 p-3 text-sm text-warn">
                    {translateSync("Demo sample: Gemini was unavailable, so this is a prepared example result, not an analysis of your photo.")}
                  </p>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-ink-3">{translateSync("Identified material")}</p>
                    <h2 className="font-display text-[28px] leading-tight font-semibold text-ink">{translateSync(analysisResult.materialType)}</h2>
                  </div>
                  <Badge tone="pine" className="shrink-0">
                    {Math.round(analysisResult.confidence * 100)}% {translateSync("confidence")}
                  </Badge>
                </div>
                {analysisResult.inferredMaterialDetails && <p className="text-sm text-ink-2 leading-relaxed">{translateSync(analysisResult.inferredMaterialDetails)}</p>}
                {analysisResult.materialSubtypes?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.materialSubtypes.map((subtype: string) => (
                      <Badge key={subtype}>{translateSync(subtype)}</Badge>
                    ))}
                  </div>
                )}
                <dl className="grid grid-cols-2 gap-px bg-line border border-line rounded-md overflow-hidden text-sm">
                  <div className="bg-surface p-3.5">
                    <dt className="text-xs text-ink-3">{translateSync("Condition")}</dt>
                    <dd className="mt-0.5 font-medium text-ink">{translateSync(analysisResult.condition)}</dd>
                  </div>
                  <div className="bg-surface p-3.5">
                    <dt className="text-xs text-ink-3">{translateSync("Estimated weight")}</dt>
                    <dd className="tabular mt-0.5 font-medium text-ink">
                      {analysisResult.estimatedWeightKg
                        ? `~${analysisResult.estimatedWeightKg.bestEstimate} kg (${analysisResult.estimatedWeightKg.low}–${analysisResult.estimatedWeightKg.high})`
                        : "—"}
                    </dd>
                  </div>
                </dl>

                {/* Safety triage */}
                <div className={cn("rounded-md border p-4", flags.length ? "bg-warn-100 border-warn/20" : "bg-success-100 border-success/20")}>
                  <p className={cn("flex items-center gap-2 text-sm font-medium", flags.length ? "text-warn" : "text-success")}>
                    {flags.length ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {flags.length
                      ? `${translateSync("Check before release")}: ${flags.length} ${flags.length === 1 ? translateSync("contaminant flagged") : translateSync("contaminants flagged")}`
                      : translateSync("No contamination detected. Safe to offer to artisans.")}
                  </p>
                  {flags.length > 0 && (
                    <>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {flags.map((f) => (
                          <li key={f}>
                            <Badge tone="warn">{translateSync(f)}</Badge>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-ink-2 mt-2">{translateSync("Remove contaminants, or route the batch to recycling instead of the artisan marketplace.")}</p>
                    </>
                  )}
                </div>

                {crafts.length > 0 && (
                  <div>
                    <p className="text-xs text-ink-3 mb-1.5">{translateSync("Suggested uses")}</p>
                    <p className="text-sm text-ink-2">{crafts.map((c) => translateSync(c)).join(" · ")}</p>
                  </div>
                )}
              </Card>

              <Card className="p-5 sm:p-6 space-y-5">
                <h3 className="text-base font-semibold text-ink font-sans">{translateSync("Weigh and locate")}</h3>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="scale-weight" className="text-sm font-medium text-ink">
                      {translateSync("Scale weight (kg)")}
                    </label>
                    {analysisResult.estimatedWeightKg?.bestEstimate !== undefined && (
                      <button
                        type="button"
                        onClick={() => setWeightKg(analysisResult.estimatedWeightKg.bestEstimate.toString())}
                        className="inline-flex items-center gap-1 text-xs text-pine-600 hover:text-pine-700 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {translateSync("Use AI estimate")}
                      </button>
                    )}
                  </div>
                  <input
                    id="scale-weight"
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className={cn(controlClass, "h-12 tabular text-lg font-medium")}
                    placeholder="24.5"
                  />
                  {analysisResult.estimatedWeightKg?.visualRationale && (
                    <p className="text-xs text-ink-3">
                      {translateSync("AI basis")}: {translateSync(analysisResult.estimatedWeightKg.visualRationale)}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <Select
                      wrapperClassName="flex-1 min-w-0"
                      label={translateSync("Pickup depot")}
                      value={pickupDepotName}
                      onChange={(e) => {
                        const selected = presets.find((d) => d.name === e.target.value);
                        if (selected) {
                          setPickupDepotName(selected.name);
                          setPickupLat(selected.lat);
                          setPickupLng(selected.lng);
                        } else {
                          setPickupDepotName(e.target.value);
                        }
                      }}
                    >
                      {presets.map((depot) => (
                        <option key={depot.name} value={depot.name}>
                          {depot.name}
                        </option>
                      ))}
                      {!presets.some((d) => d.name === pickupDepotName) && pickupDepotName !== "Custom Pin Location" && <option value={pickupDepotName}>{pickupDepotName}</option>}
                      <option value="Custom Pin Location">{translateSync("Custom location (enter coordinates)")}</option>
                    </Select>
                    <Button variant="secondary" onClick={() => handleUseRealtimeLocation()} disabled={isLocating} title={translateSync("Use my location")} aria-label={translateSync("Use my location")}>
                      <Crosshair className={cn("w-4 h-4", isLocating && "animate-spin")} />
                      <span className="hidden sm:inline">{isLocating ? translateSync("Locating…") : translateSync("My location")}</span>
                    </Button>
                  </div>
                  {locationSuccess && <p className="text-xs text-success">{translateSync(locationSuccess)}</p>}

                  <div className="grid grid-cols-2 gap-3">
                    <Input label={translateSync("Latitude")} type="number" step="0.0001" value={pickupLat} onChange={(e) => setPickupLat(parseFloat(e.target.value) || 0)} className="tabular" />
                    <Input label={translateSync("Longitude")} type="number" step="0.0001" value={pickupLng} onChange={(e) => setPickupLng(parseFloat(e.target.value) || 0)} className="tabular" />
                  </div>

                  <div className="h-40 rounded-md overflow-hidden border border-line bg-paper-2">
                    <iframe
                      title={translateSync("Pickup location map")}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&q=${pickupLat},${pickupLng}&zoom=15`}
                    />
                  </div>
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
                        <dt className="text-ink-3 w-16 shrink-0">{translateSync("Depot")}</dt>
                        <dd>{translateSync(pickupDepotName)}</dd>
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
                  <Button size="lg" className="w-full" onClick={handleLogBatch} disabled={!weightKg || !agreementId} loading={saving}>
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

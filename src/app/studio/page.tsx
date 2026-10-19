"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { userRole } from "@/lib/roleGuard";
import { StudioListings, type StudioProduct as Product } from "@/components/studio/StudioListings";
import {
  Palette,
  CheckCircle2,
  Link2,
  PlusCircle,
  Sparkles,
  Loader2,
  ImagePlus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Upload,
  Link as LinkIcon,
  FileImage,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BLANK_FORM = {
  title: "",
  description: "",
  price: "45.00",
  selectedBatchId: "",
  kgDiverted: "1.5",
  materialTags: "",
  imageUrl: "",
  ngoFundName: "",
};

/** Listing fields that follow from the chosen source batch, so the artisan doesn't retype them. */
function fieldsFromBatch(batch: { id: string; materialType: string; weightKg: number; agreement?: { festival?: string } | null }, currentKg: string) {
  const tags = [...batch.materialType.split(/\s*(?:&|,|\band\b)\s*/i), batch.agreement?.festival]
    .map((t) => t?.trim())
    .filter((t): t is string => Boolean(t));
  const kg = Math.min(parseFloat(currentKg) || 1, batch.weightKg);
  return { selectedBatchId: batch.id, materialTags: [...new Set(tags)].join(", "), kgDiverted: String(kg) };
}

import { AccessGuard } from "@/components/AccessGuard";
import { apiJson } from "@/lib/api";
import type { BatchView } from "@/lib/server/views";
import { compressImage } from "@/lib/image";

// ─── Component ────────────────────────────────────────────────────────────────
function ArtisanStudioPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { translateSync } = useTranslation();
  const role = userRole(user);

  // --- Source batches ---
  const [claimedBatches, setClaimedBatches] = useState<BatchView[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);

  // --- Published products ---
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // --- Form state ---
  const [form, setForm] = useState(BLANK_FORM);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [imageMode, setImageMode] = useState<"file" | "url">("file");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Edit mode ---
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Delete confirm ---
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");

  // --- Async state ---
  const [generatingStory, setGeneratingStory] = useState(false);
  const [storyIsSample, setStoryIsSample] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  const isAuthorized = role === "artisan" || role === "admin";

  const handleFileChange = async (file: File | undefined | null) => {
    if (!file) return;
    setErrorMessage(null);
    try {
      const dataUrl = await compressImage(file);
      setField("imageUrl", dataUrl);
      setFileName(file.name);
      setImagePreviewError(false);
    } catch (err) {
      setErrorMessage((err instanceof Error && err.message) || translateSync("Failed to process image file."));
    }
  };

  // --- Load batches ---
  useEffect(() => {
    if (authLoading || !isAuthorized) {
      setBatchesLoading(false);
      return;
    }
    // Only batches this artisan has physically picked up can be turned into listings.
    apiJson<BatchView[]>("/api/materials?mine=claimed").then((result) => {
      if (result.success && result.data?.length) {
        setClaimedBatches(result.data);
        setForm((f) => ({ ...f, ...fieldsFromBatch(result.data![0], f.kgDiverted) }));
      } else if (!result.success) {
        setErrorMessage(result.error ?? "Couldn't load your batches.");
      }
      setBatchesLoading(false);
    });
  }, [authLoading, isAuthorized]);

  // --- Load artisan's own products ---
  const loadMyProducts = () => {
    if (!user?.id) return;
    setProductsLoading(true);
    apiJson<Product[]>(`/api/products?artisanId=${encodeURIComponent(user.id)}`).then((result) => {
      if (result.success) setMyProducts(result.data ?? []);
      setProductsLoading(false);
    });
  };

  useEffect(() => {
    if (!authLoading && isAuthorized && user?.id) loadMyProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const setField = (key: keyof typeof BLANK_FORM, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "imageUrl") setImagePreviewError(false);
  };

  const resetForm = () => {
    setForm(claimedBatches[0] ? { ...BLANK_FORM, ...fieldsFromBatch(claimedBatches[0], BLANK_FORM.kgDiverted) } : BLANK_FORM);
    setEditingId(null);
    setFileName(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    setImagePreviewError(false);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    const existingImg = product.images?.[0] ?? "";
    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      selectedBatchId: product.sourceBatchId,
      kgDiverted: String(product.kgDiverted),
      materialTags: product.materialTags.join(", "),
      imageUrl: existingImg,
      ngoFundName: product.ngoFundName,
    });
    setFileName(existingImg.startsWith("data:") ? "uploaded-image.jpg" : null);
    setImageMode(existingImg.startsWith("data:") ? "file" : "url");
    setImagePreviewError(false);
    setSuccessMessage(null);
    setErrorMessage(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const selectedBatch = claimedBatches.find((b) => b.id === form.selectedBatchId);

  // ─── AI origin story ────────────────────────────────────────────────────────
  const handleGenerateAIStory = async () => {
    if (!selectedBatch) return;
    setGeneratingStory(true);
    setErrorMessage(null);
    setStoryIsSample(false);
    const result = await apiJson<{ story: string; suggestedTags?: string[]; isSample: boolean }>("/api/ai/story", {
      method: "POST",
      body: JSON.stringify({
        batchId: selectedBatch.id,
        materialType: selectedBatch.materialType,
        condition: selectedBatch.condition,
        festival: selectedBatch.agreement?.festival,
        country: selectedBatch.agreement?.country,
        craftTypology: selectedBatch.aiInferredMaterial,
        artisanWorkshop: user?.workshopName,
        divertedKg: form.kgDiverted || selectedBatch.weightKg,
        title: form.title || `${selectedBatch.materialType} Upcycled Creation`,
      }),
    });
    if (result.success && result.data?.story) {
      setField("description", result.data.story);
      if (Array.isArray(result.data.suggestedTags)) setField("materialTags", result.data.suggestedTags.join(", "));
      setStoryIsSample(result.data.isSample);
    } else {
      setErrorMessage(result.error ?? translateSync("The story writer failed. Try again."));
    }
    setGeneratingStory(false);
  };

  // ─── Submit (create or update) ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.selectedBatchId) return;
    setSubmitting(true);
    setErrorMessage(null);
    const payload = {
      title: form.title,
      description: form.description,
      price: parseFloat(form.price),
      images: form.imageUrl ? [form.imageUrl] : [],
      sourceBatchId: form.selectedBatchId,
      materialTags: form.materialTags.split(",").map((t) => t.trim()).filter(Boolean),
      kgDiverted: parseFloat(form.kgDiverted),
      ngoFundName: form.ngoFundName,
    };

    const result = editingId
      ? await apiJson(`/api/products/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) })
      : await apiJson("/api/products", { method: "POST", body: JSON.stringify(payload) });

    if (result.success) {
      setSuccessMessage(editingId ? `"${form.title}" updated.` : `"${form.title}" is now on the marketplace.`);
      resetForm();
      loadMyProducts();
    } else {
      setErrorMessage(result.error ?? "Something went wrong.");
    }
    setSubmitting(false);
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const confirmDelete = (product: Product) => {
    setDeletingId(product.id);
    setDeleteConfirmTitle(product.title);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const result = await apiJson(`/api/products/${deletingId}`, { method: "DELETE" });
    if (result.success) {
      setMyProducts((prev) => prev.filter((p) => p.id !== deletingId));
      setDeletingId(null);
    } else {
      setErrorMessage(result.error ?? "Couldn't remove the listing.");
    }
    setDeleting(false);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-pine-500">
          <Palette className="w-3.5 h-3.5" />
          <span>Studio</span>
        </div>
        <h1 className="font-display text-4xl sm:text-[44px] leading-[1.05] font-semibold text-ink mt-2">
          {translateSync("Artisan studio")}
        </h1>
        <p className="text-base text-ink-2 mt-2 max-w-2xl">
          {translateSync(
            "Turn claimed festival material into listed pieces. Each piece stays linked to the batch it was made from."
          )}
        </p>
      </div>

      {/* ── Global success / error banners ── */}
      {successMessage && (
        <div className="flex items-start space-x-3 p-4 bg-pine-50 border border-pine-200 rounded-md text-sm text-pine-700">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-pine-500" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-pine-500 hover:text-pine-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-start space-x-3 p-4 bg-danger-100 border border-danger/20 rounded-md text-sm text-danger">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-danger" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-danger hover:text-danger">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════
          SECTION 1 — LISTING FORM
      ════════════════════════════════════════ */}
      <div ref={formRef} className="bg-surface rounded-lg border border-line shadow-card overflow-hidden">
        {/* Form header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface">
          <div className="flex items-center space-x-2">
            {editingId ? (
              <Pencil className="w-4 h-4 text-lantern-600" />
            ) : (
              <PlusCircle className="w-4 h-4 text-pine-600" />
            )}
            <span className="text-sm font-bold text-ink">
              {editingId
                ? translateSync("Edit Upcycled Piece")
                : translateSync("List a New Upcycled Piece")}
            </span>
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="flex items-center space-x-1 text-xs text-ink-3 hover:text-ink-2"
            >
              <X className="w-3.5 h-3.5" />
              <span>{translateSync("Cancel Edit")}</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

          {/* Row 1 — Title + Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-ink-2">
                {translateSync("Product Title")} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder={translateSync("Name of the piece")}
                className="w-full p-3 rounded-md border border-line bg-paper font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-pine-500/30"
              />
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-ink-2">
                {translateSync("Fair-Trade Retail Price (USD)")} <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                className="w-full p-3 rounded-md border border-line bg-paper font-mono-data font-bold text-ink focus:outline-none focus:ring-2 focus:ring-pine-500/30"
              />
              <span className="text-xs text-ink-3">
                {translateSync("You receive")}{" "}
                <strong>70% (${(parseFloat(form.price || "0") * 0.7).toFixed(2)})</strong>{" "}
                {translateSync("upon sale.")}
              </span>
            </div>
          </div>

          {/* ── IMAGE SECTION (DUAL OPTION: FILE UPLOAD OR URL) ── */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-xs font-bold text-ink-2 flex items-center space-x-1.5">
                <ImagePlus className="w-3.5 h-3.5 text-lantern-600" />
                <span>{translateSync("Product Image")}</span>
                <span className="text-xs text-ink-3 font-normal">
                  ({translateSync("Choose Upload or URL")})
                </span>
              </label>

              {/* Segmented Mode Selector */}
              <div className="inline-flex p-0.5 rounded-lg bg-paper-2 border border-line text-xs">
                <button
                  type="button"
                  onClick={() => setImageMode("file")}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-bold transition-all text-xs ${
                    imageMode === "file"
                      ? "bg-surface text-lantern-600 shadow-card"
                      : "text-ink-3 hover:text-ink"
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>{translateSync("Upload File (.jpg, .png)")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-bold transition-all text-xs ${
                    imageMode === "url"
                      ? "bg-surface text-lantern-600 shadow-card"
                      : "text-ink-3 hover:text-ink"
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{translateSync("Image URL")}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: File Upload Mode */}
              {imageMode === "file" ? (
                <div className="space-y-2">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFileChange(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative aspect-auto h-44 rounded-md border-2 border-dashed p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-line-strong bg-paper-2"
                        : "border-line bg-paper hover:bg-paper-2 hover:border-line-strong"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={(e) => handleFileChange(e.target.files?.[0])}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-paper-2 text-lantern-600 flex items-center justify-center mb-2 shadow-card">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-ink">
                      {translateSync("Click to upload or drag & drop")}
                    </p>
                    <p className="text-xs text-ink-3 mt-1">
                      {translateSync("Supports .JPG, .JPEG, or .PNG files")}
                    </p>
                    {fileName && (
                      <div className="mt-2 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-surface border border-line text-xs font-semibold text-lantern-600">
                        <FileImage className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{fileName}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-ink-3">
                    {translateSync("Images are automatically optimized and embedded for the marketplace.")}
                  </p>
                </div>
              ) : (
                /* Option 2: Image URL Mode */
                <div className="space-y-2">
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => {
                      setField("imageUrl", e.target.value);
                      setFileName(null);
                    }}
                    placeholder="https://example.com/your-craft-photo.jpg"
                    className="w-full p-3 rounded-md border border-line bg-paper text-xs text-ink focus:outline-none focus:ring-2 focus:ring-line-strong/30"
                  />
                  <p className="text-xs text-ink-3 leading-relaxed">
                    {translateSync(
                      "Paste a link to a photo of your own piece. Buyers see it on the listing."
                    )}
                  </p>
                </div>
              )}

              {/* Live Preview Box */}
              <div className="relative aspect-square sm:aspect-auto sm:h-44 rounded-md overflow-hidden border-2 border-dashed border-line bg-paper flex items-center justify-center">
                {form.imageUrl && !imagePreviewError ? (
                  <>
                    <Image
                      src={form.imageUrl}
                      alt="Product preview"
                      fill
                      className="object-cover rounded-md"
                      onError={() => setImagePreviewError(true)}
                      unoptimized
                    />
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setField("imageUrl", "");
                          setFileName(null);
                        }}
                        className="p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                        title={translateSync("Remove photo")}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4 space-y-1.5">
                    <ImagePlus className="w-8 h-8 text-ink-3 mx-auto" />
                    <p className="text-xs text-ink-3">
                      {imagePreviewError
                        ? translateSync("Image could not be loaded. Try a different file or URL.")
                        : translateSync("Live preview will appear here")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Source Batch */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-ink-2 flex items-center space-x-1.5">
              <Link2 className="w-3.5 h-3.5 text-pine-600" />
              <span>
                {translateSync("Link to Source Material Batch")} <span className="text-danger">*</span>
              </span>
            </label>
            {batchesLoading ? (
              <div className="flex items-center space-x-2 text-ink-3 p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{translateSync("Loading batches...")}</span>
              </div>
            ) : claimedBatches.length === 0 ? (
              <p className="text-ink-3 p-3 bg-paper rounded-md border border-line">
                {translateSync("No material batches claimed yet. Claim a batch on the map to get started.")}
              </p>
            ) : (
              <select
                value={form.selectedBatchId}
                onChange={(e) => {
                  const batch = claimedBatches.find((b) => b.id === e.target.value);
                  if (batch) setForm((f) => ({ ...f, ...fieldsFromBatch(batch, f.kgDiverted) }));
                }}
                disabled={!!editingId}
                className="w-full p-3 rounded-md border border-line bg-surface font-mono-data text-xs font-semibold text-ink disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-pine-500/30"
              >
                {claimedBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.id}] {b.title} ({b.weightKg} kg {b.materialType}) — {b.agreement?.festival} ({b.agreement?.country})
                  </option>
                ))}
              </select>
            )}
            {editingId && (
              <p className="text-xs text-warn">
                {translateSync("Source batch cannot be changed after publishing.")}
              </p>
            )}
          </div>

          {/* Description / AI */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-ink-2">
                {translateSync("Product Bio & Material Origin Story")}
              </label>
              <button
                type="button"
                onClick={handleGenerateAIStory}
                disabled={generatingStory || !selectedBatch}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-pine-50 border border-pine-300 text-pine-600 text-xs font-bold hover:bg-pine-100 transition-colors disabled:opacity-50 cursor-pointer shadow-card"
              >
                {generatingStory ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{translateSync("Drafting...")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-warn" />
                    <span>{translateSync("Auto-generate with Gemini")}</span>
                  </>
                )}
              </button>
            </div>
            {storyIsSample && (
              <p className="text-xs text-warn">
                {translateSync("Demo sample: Gemini was unavailable, so this is a prepared example. Edit it before publishing.")}
              </p>
            )}
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder={translateSync(
                "Describe your upcycling technique, natural dyes, or click the Gemini button above to auto-generate the cultural origin story..."
              )}
              className="w-full p-3 rounded-md border border-line bg-paper text-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-pine-500/30"
            />
          </div>

          {/* Row — kg + NGO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-ink-2">
                {translateSync("Kilograms Diverted per Item")}
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={form.kgDiverted}
                onChange={(e) => setField("kgDiverted", e.target.value)}
                className="w-full p-3 rounded-md border border-line bg-paper font-mono-data font-bold text-ink focus:outline-none focus:ring-2 focus:ring-pine-500/30"
              />
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-ink-2">
                {translateSync("10% Designated NGO Fund")}
              </label>
              <input
                type="text"
                value={form.ngoFundName}
                onChange={(e) => setField("ngoFundName", e.target.value)}
                className="w-full p-3 rounded-md border border-line bg-paper font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-pine-500/30"
              />
            </div>
          </div>

          {/* Material Tags */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-ink-2">
              {translateSync("Material Tags (comma-separated)")}
            </label>
            <input
              type="text"
              value={form.materialTags}
              onChange={(e) => setField("materialTags", e.target.value)}
              placeholder={translateSync("Materials used, separated by commas")}
              className="w-full p-3 rounded-md border border-line bg-paper text-ink font-medium focus:outline-none focus:ring-2 focus:ring-pine-500/30"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 rounded-md font-bold text-xs shadow-card transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
              editingId
                ? "bg-pine-700 hover:bg-pine-800 text-white"
                : "bg-pine-700 hover:bg-pine-600 text-white"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{editingId ? translateSync("Saving changes...") : translateSync("Publishing...")}</span>
              </>
            ) : editingId ? (
              <>
                <Pencil className="w-4 h-4" />
                <span>{translateSync("Save Changes")}</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>{translateSync("Publish to the shop")}</span>
              </>
            )}
          </button>
        </form>
      </div>

      <StudioListings
        products={myProducts}
        loading={productsLoading}
        editingId={editingId}
        onRefresh={loadMyProducts}
        onEdit={startEdit}
        onDelete={confirmDelete}
      />

      {/* ════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ════════════════════════════════════════ */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-lg shadow-pop max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 bg-danger-100 border border-danger/20 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-danger" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-ink text-base">
                {translateSync("Remove this piece?")}
              </h3>
              <p className="text-sm text-ink-3">
                <strong className="text-ink-2">&ldquo;{deleteConfirmTitle}&rdquo;</strong>{" "}
                {translateSync("will be removed from the marketplace. This cannot be undone.")}
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeletingId(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-md border border-line text-sm font-semibold text-ink-2 hover:bg-paper transition-colors"
              >
                {translateSync("Cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-md bg-danger hover:bg-danger text-white text-sm font-bold transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{translateSync("Remove")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ArtisanStudioPage() {
  return (
    <AccessGuard allowedRoles={["artisan", "admin"]} pageTitle="Artisan studio">
      <ArtisanStudioPageContent />
    </AccessGuard>
  );
}

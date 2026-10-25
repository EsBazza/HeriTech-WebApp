"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { userRole } from "@/lib/roleGuard";
import { StudioListings, type StudioProduct as Product } from "@/components/studio/StudioListings";
import { Link2, MapPin, PlusCircle, Sparkles, ImagePlus, Pencil, Trash2, X, AlertTriangle, Upload, Link as LinkIcon, FileImage, Package, Leaf, Boxes, Eye } from "lucide-react";
import { FeedCard } from "@/components/FeedCard";
import { ImpactPassPreview } from "@/components/ImpactPassPreview";
import { CountUp } from "@/components/motion/CountUp";
import { SPLIT, calculateEscrowSplit } from "@/lib/escrow";
import { SuccessBurst } from "@/components/motion/SuccessBurst";
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  IconButton,
  Input,
  LinkButton,
  RoleHero,
  Select,
  Skeleton,
  StickyActionBar,
  TabPanel,
  Tabs,
  Textarea,
  cn,
} from "@/components/ui";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BLANK_FORM = {
  title: "",
  description: "",
  price: "",
  selectedBatchId: "",
  kgDiverted: "",
  materialTags: "",
  imageUrl: "",
  ngoFundName: "",
  craftMethod: "",
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
  const { translateTemplate, translateSync, formatCurrency, formatNumber } = useTranslation();
  const role = userRole(user);
  const [tab, setTab] = useState<"new" | "pieces">("new");

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
  // The photo a listing had when editing started; it is only re-sent if it changes.
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  // --- Delete confirm ---
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");

  // --- Async state ---
  const [generatingStory, setGeneratingStory] = useState(false);
  const [storyIsSample, setStoryIsSample] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [askNoPhoto, setAskNoPhoto] = useState(false);
  const skipPhotoCheck = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  // After publishing, the result banner is far above the button on a phone, so bring it into view.
  const showBanner = () => requestAnimationFrame(() => bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

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
    setOriginalImage(null);
    setFileName(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    setImagePreviewError(false);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    const existingImg = product.images?.[0] ?? "";
    setOriginalImage(existingImg);
    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      selectedBatchId: product.sourceBatchId,
      kgDiverted: String(product.kgDiverted),
      materialTags: product.materialTags.join(", "),
      imageUrl: existingImg,
      ngoFundName: product.ngoFundName ?? "",
      craftMethod: "",
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
        condition: selectedBatch.condition ?? undefined,
        festival: selectedBatch.agreement?.festival ?? undefined,
        country: selectedBatch.agreement?.country ?? undefined,
        craftTypology: form.craftMethod.trim() || undefined,
        artisanWorkshop: user?.workshopName ?? undefined,
        divertedKg: form.kgDiverted || selectedBatch.weightKg,
        title: form.title.trim() || undefined,
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
    // Buyers see the photo next to the material it came from, so publishing without one asks first.
    if (!editingId && !form.imageUrl && !skipPhotoCheck.current) {
      setAskNoPhoto(true);
      return;
    }
    skipPhotoCheck.current = false;
    setAskNoPhoto(false);
    setSubmitting(true);
    setErrorMessage(null);
    // When editing, an unchanged photo is left out so the server keeps what it already stores.
    const imageChanged = !editingId || form.imageUrl !== originalImage;
    const payload = {
      title: form.title,
      description: form.description,
      price: parseFloat(form.price),
      ...(imageChanged ? { images: form.imageUrl ? [form.imageUrl] : [] } : {}),
      sourceBatchId: form.selectedBatchId,
      materialTags: form.materialTags.split(",").map((t) => t.trim()).filter(Boolean),
      kgDiverted: parseFloat(form.kgDiverted),
      ngoFundName: form.ngoFundName,
    };

    const result = editingId
      ? await apiJson(`/api/products/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) })
      : await apiJson("/api/products", { method: "POST", body: JSON.stringify(payload) });

    if (result.success) {
      const message = editingId ? `"${form.title}" updated.` : `"${form.title}" is now in the shop.`;
      setPublishedId(editingId ?? (result.data as { id?: string } | undefined)?.id ?? null);
      resetForm();
      setSuccessMessage(message);
      loadMyProducts();
    } else {
      setErrorMessage(result.error ?? "Something went wrong.");
    }
    setSubmitting(false);
    showBanner();
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const confirmDelete = (product: Product) => {
    setDeleteError(null);
    setDeletingId(product.id);
    setDeleteConfirmTitle(product.title);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await apiJson(`/api/products/${deletingId}`, { method: "DELETE" });
    if (result.success) {
      setMyProducts((prev) => prev.filter((p) => p.id !== deletingId));
      setDeletingId(null);
    } else {
      // Shown inside the dialog, which is still on top of the page.
      setDeleteError(result.error ?? "Couldn't remove the listing.");
    }
    setDeleting(false);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  const payout = calculateEscrowSplit(parseFloat(form.price || "0") || 0).artisanPayout;
  const noBatches = !batchesLoading && claimedBatches.length === 0 && !editingId;

  const stepHeading = (n: number, title: string, hint?: string) => (
    <legend className="flex items-start gap-3 mb-4">
      <span className="w-7 h-7 rounded-full bg-pine-700 text-white text-sm font-semibold flex items-center justify-center shrink-0 tabular">{n}</span>
      <span className="pt-0.5">
        <span className="block text-base font-semibold text-ink">{title}</span>
        {hint && <span className="block text-sm text-ink-3 mt-0.5">{hint}</span>}
      </span>
    </legend>
  );

  return (
    <div>
      <RoleHero
        eyebrow={translateSync("Studio")}
        title={translateSync("Artisan studio")}
        description={translateSync("Turn the festival material you picked up into pieces in the shop. Each one stays linked to the batch it came from.")}
        actions={
          <LinkButton href="/map" variant="secondary" className="bg-white/10 border-white/20 text-white hover:bg-white/15 hover:text-white">
            <MapPin className="w-4 h-4" />
            {translateSync("Find more material")}
          </LinkButton>
        }
        stats={[
          { icon: Package, label: translateSync("Pieces in the shop"), hint: translateSync("Each with its own Impact Pass"), value: productsLoading ? "—" : <CountUp value={myProducts.length} format={formatNumber} /> },
          { icon: Leaf, label: translateSync("Material reused"), unit: "kg", hint: translateSync("Kept out of landfill by your pieces"), value: productsLoading ? "—" : <CountUp value={myProducts.reduce((t, p) => t + (Number(p.kgDiverted) || 0), 0)} decimals={1} format={formatNumber} /> },
          { icon: Boxes, label: translateSync("Batches ready to craft"), hint: translateSync("Picked up and waiting in your workshop"), value: batchesLoading ? "—" : <CountUp value={claimedBatches.length} format={formatNumber} /> },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Tabs
        label={translateSync("Studio sections")}
        value={tab}
        onChange={setTab}
        syncHash
        items={[
          { key: "new", label: editingId ? translateSync("Edit piece") : translateSync("New piece") },
          { key: "pieces", label: translateSync("My pieces"), count: myProducts.length },
        ]}
      />

      {/* Result of the last action; scrolled into view after publishing */}
      <div ref={bannerRef} className="scroll-mt-24 space-y-3 empty:hidden">
        {successMessage && (
          <div role="status" className="flex items-center gap-3 p-4 bg-pine-50 border border-brand-line rounded-md text-[15px] text-brand">
            <SuccessBurst size={36} />
            <span className="flex-1">
              {translateSync(successMessage)}
              {publishedId && (
                <span className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
                  <a href={`/products/${publishedId}`} className="font-medium underline underline-offset-2">
                    {translateSync("View in shop")}
                  </a>
                  <button type="button" onClick={() => setTab("pieces")} className="font-medium underline underline-offset-2 cursor-pointer">
                    {translateSync("See my pieces")}
                  </button>
                </span>
              )}
            </span>
            <IconButton aria-label={translateSync("Dismiss")} onClick={() => setSuccessMessage(null)} className="-my-2 -mr-2">
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        )}
        {errorMessage && (
          <div role="alert" className="flex items-start gap-3 p-4 bg-danger-100 border border-danger/20 rounded-md text-sm text-danger">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="flex-1">{translateSync(errorMessage)}</span>
            <IconButton tone="danger" aria-label={translateSync("Dismiss")} onClick={() => setErrorMessage(null)} className="-my-3 -mr-2">
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        )}
      </div>

      <TabPanel id="new" active={tab === "new"}>
      {noBatches ? (
        <EmptyState
          icon={<Link2 className="w-5 h-5" />}
          title={translateSync("Pick up a batch first")}
          description={translateSync("Every piece is linked to the festival material it was made from. Reserve a batch on the material map and collect it, then list your piece here.")}
          action={
            <LinkButton href="/map">
              <MapPin className="w-4 h-4" />
              {translateSync("Open the material map")}
            </LinkButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <Card ref={formRef} className="lg:col-span-7 overflow-hidden scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-line">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink font-sans">
              {editingId ? <Pencil className="w-4 h-4 text-lantern-600" /> : <PlusCircle className="w-4 h-4 text-brand-2" />}
              {editingId ? translateSync("Edit piece") : translateSync("List a new piece")}
            </h2>
            {editingId && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
                {translateSync("Cancel edit")}
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-8">
            {/* 1 — Source batch: fills tags and kg below */}
            <fieldset>
              {stepHeading(1, translateSync("Source batch"), translateSync("The material this piece was made from. Tags and weight fill in from it."))}
              {batchesLoading ? (
                <Skeleton className="h-11 rounded-sm" />
              ) : (
                <Select
                  label={translateSync("Batch you picked up")}
                  required
                  value={form.selectedBatchId}
                  onChange={(e) => {
                    const batch = claimedBatches.find((b) => b.id === e.target.value);
                    if (batch) setForm((f) => ({ ...f, ...fieldsFromBatch(batch, f.kgDiverted) }));
                  }}
                  disabled={!!editingId}
                  hint={editingId ? translateSync("The source batch can't be changed after publishing.") : undefined}
                >
                  {claimedBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} · {b.weightKg} kg {b.materialType}
                      {b.agreement?.festival ? ` · ${b.agreement.festival}` : ""}
                    </option>
                  ))}
                  {editingId && !claimedBatches.some((b) => b.id === form.selectedBatchId) && <option value={form.selectedBatchId}>{form.selectedBatchId}</option>}
                </Select>
              )}
            </fieldset>

            {/* 2 — Photo */}
            <fieldset>
              {stepHeading(2, translateSync("Photo"), translateSync("A clear photo of the finished piece. Buyers see it next to the material it came from."))}
              <div className="inline-flex p-1 rounded-md bg-paper-2 border border-line mb-3" role="group" aria-label={translateSync("Photo source")}>
                {([
                  ["file", Upload, "Upload a photo"],
                  ["url", LinkIcon, "Paste a link"],
                ] as const).map(([mode, Icon, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setImageMode(mode)}
                    aria-pressed={imageMode === mode}
                    className={cn(
                      "inline-flex items-center gap-1.5 min-h-10 px-3 rounded-sm text-sm font-medium transition-colors cursor-pointer",
                      imageMode === mode ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {translateSync(label)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {imageMode === "file" ? (
                  <button
                    type="button"
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
                    className={cn(
                      "h-44 rounded-md border-2 border-dashed p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                      isDragging ? "border-pine-500 bg-pine-50" : "border-line-strong bg-paper hover:border-pine-300"
                    )}
                  >
                    <span className="w-11 h-11 rounded-full bg-pine-100 text-brand flex items-center justify-center mb-2">
                      <Upload className="w-5 h-5" />
                    </span>
                    <span className="text-[15px] font-medium text-ink">{translateSync("Take or choose a photo")}</span>
                    <span className="text-sm text-ink-3 mt-0.5">{translateSync("JPG or PNG. It's resized for the shop.")}</span>
                    {fileName && (
                      <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-line text-xs font-medium text-ink-2">
                        <FileImage className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[160px]">{fileName}</span>
                      </span>
                    )}
                  </button>
                ) : (
                  <Input
                    label={translateSync("Photo link")}
                    type="url"
                    value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                    onChange={(e) => {
                      setField("imageUrl", e.target.value);
                      setFileName(null);
                    }}
                    placeholder="https://"
                    hint={translateSync("A link to a photo of your own piece.")}
                  />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  className="hidden"
                />

                {/* Live preview */}
                <div className="relative aspect-[4/3] sm:aspect-auto sm:h-44 rounded-md overflow-hidden border border-line bg-paper flex items-center justify-center">
                  {form.imageUrl && !imagePreviewError ? (
                    <>
                      <Image
                        src={form.imageUrl}
                        alt={translateSync("Photo preview")}
                        fill
                        className="object-cover"
                        onError={() => setImagePreviewError(true)}
                        unoptimized
                      />
                      <IconButton
                        tone="inverse"
                        aria-label={translateSync("Remove photo")}
                        onClick={() => {
                          setField("imageUrl", "");
                          setFileName(null);
                        }}
                        className="absolute top-1 right-1 bg-pine-900/60 hover:bg-pine-900/80"
                      >
                        <X className="w-4 h-4" />
                      </IconButton>
                    </>
                  ) : (
                    <div className="text-center p-4 space-y-1.5">
                      <ImagePlus className="w-8 h-8 text-ink-3 mx-auto" />
                      <p className="text-sm text-ink-3">
                        {imagePreviewError ? translateSync("That photo couldn't be loaded. Try another file or link.") : translateSync("Your photo appears here")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </fieldset>

            {/* 3 — Story and price */}
            <fieldset className="space-y-5">
              {stepHeading(3, translateSync("Story and price"))}
              <Input label={translateSync("Name of the piece")} required value={form.title} onChange={(e) => setField("title", e.target.value)} />
              <Input
                label={translateSync("Craft method (optional)")}
                value={form.craftMethod}
                onChange={(e) => setField("craftMethod", e.target.value)}
                placeholder={translateSync("For example: folding, weaving, pressing")}
                hint={translateSync("Helps Gemini describe how the piece was made.")}
              />

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="studio-story" className="text-sm font-medium text-ink">
                    {translateSync("Its story")}
                  </label>
                  <Button type="button" variant="secondary" size="sm" onClick={handleGenerateAIStory} disabled={!selectedBatch} loading={generatingStory}>
                    {!generatingStory && <Sparkles className="w-4 h-4 text-lantern-600" />}
                    {generatingStory ? translateSync("Drafting…") : translateSync("Draft with Gemini")}
                  </Button>
                </div>
                {storyIsSample && (
                  <p className="text-sm text-warn">{translateSync("Demo sample: Gemini was unavailable, so this is a prepared example. Edit it before publishing.")}</p>
                )}
                <Textarea
                  id="studio-story"
                  rows={5}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder={translateSync("How you made it and where the material came from. Or let Gemini draft it from the batch record.")}
                  className={cn("leading-relaxed", generatingStory && "analyse-sweep")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label={translateSync("Price (USD)")}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  value={form.price}
                  placeholder="45.00"
                  onChange={(e) => setField("price", e.target.value)}
                  className="tabular"
                  hint={translateTemplate("You receive {amount} ({share}%) when it sells.", { amount: formatCurrency(payout), share: SPLIT.artisan })}
                />
                <Input
                  label={translateSync("Material kept out of landfill (kg)")}
                  type="number"
                  inputMode="decimal"
                  step="0.05"
                  min="0"
                  value={form.kgDiverted}
                  max={selectedBatch?.weightKg}
                  placeholder="1.5"
                  onChange={(e) => setField("kgDiverted", e.target.value)}
                  className="tabular"
                  hint={selectedBatch ? translateTemplate("Up to {kg} kg from this batch", { kg: selectedBatch.weightKg }) : undefined}
                />
              </div>

              <Input
                label={translateSync("Material tags")}
                value={form.materialTags}
                onChange={(e) => setField("materialTags", e.target.value)}
                hint={translateSync("Separate with commas. Buyers can filter the shop by these.")}
              />
              <Input
                label={translateSync("Charity partner (optional)")}
                value={form.ngoFundName}
                onChange={(e) => setField("ngoFundName", e.target.value)}
                hint={translateTemplate("Named on the receipt. It shares the {share}% charity & app upkeep part of each sale.", { share: SPLIT.charityMaintenance })}
              />
            </fieldset>

            <StickyActionBar className="-mx-5 px-5 sm:-mx-8 sm:px-8 space-y-2">
              {askNoPhoto && (
                <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md bg-warn-100 border border-warn/20 px-3 py-2.5 text-sm text-warn">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="flex-1 min-w-[12rem]">{translateSync("No photo yet. Buyers compare the finished piece with the material it came from.")}</span>
                  <Button type="submit" size="sm" variant="secondary" onClick={() => (skipPhotoCheck.current = true)}>
                    {translateSync("Publish without a photo")}
                  </Button>
                </div>
              )}
              <Button type="submit" variant="accent" size="lg" className="w-full" loading={submitting} disabled={!form.selectedBatchId}>
                {!submitting && (editingId ? <Pencil className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />)}
                {submitting
                  ? editingId
                    ? translateSync("Saving changes…")
                    : translateSync("Publishing…")
                  : editingId
                  ? translateSync("Save changes")
                  : translateSync("Publish to the shop")}
              </Button>
            </StickyActionBar>
          </form>
        </Card>

        {/* What buyers will see, updated as the artisan types */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-5" aria-label={translateSync("Preview")}>
          <div className="flex items-center gap-2 text-sm font-medium text-ink-2">
            <Eye className="w-4 h-4 text-brand-2" />
            {translateSync("How buyers will see it")}
          </div>
          <div inert className="max-w-sm">
            <FeedCard
              batch={{
                id: editingId ?? "preview",
                title: form.title || translateSync("Name of the piece"),
                description: form.description,
                price: parseFloat(form.price) || 0,
                image: form.imageUrl && !imagePreviewError ? form.imageUrl : undefined,
                cooperativeName: user?.workshopName || user?.fullName || translateSync("Your workshop"),
                region: user?.country || "",
                country: selectedBatch?.agreement?.country || user?.country || "",
                weightKg: parseFloat(form.kgDiverted) || 0,
                materialType: form.materialTags || selectedBatch?.materialType || "",
                festival: selectedBatch?.agreement?.festival || "",
              }}
            />
          </div>
          <ImpactPassPreview
            title={form.title || translateSync("Name of the piece")}
            origin={[selectedBatch?.agreement?.festival, selectedBatch?.agreement?.country].filter(Boolean).join(", ") || translateSync("Your source batch")}
            maker={user?.workshopName || user?.fullName || translateSync("Your workshop")}
            material={selectedBatch?.materialType || form.materialTags || "—"}
            kgDiverted={parseFloat(form.kgDiverted) || 0}
            image={form.imageUrl && !imagePreviewError ? form.imageUrl : null}
          />
          <p className="text-xs text-ink-3 max-w-sm">
            {translateSync("The pass is issued when the piece sells. Its QR code opens the public record of this batch.")}
          </p>
        </aside>
        </div>
      )}
      </TabPanel>

      <TabPanel id="pieces" active={tab === "pieces"}>
        <StudioListings
          products={myProducts}
          loading={productsLoading}
          editingId={editingId}
          onRefresh={loadMyProducts}
          onEdit={(product) => {
            setTab("new");
            startEdit(product);
          }}
          onDelete={confirmDelete}
        />
      </TabPanel>
      </div>

      <Dialog
        open={Boolean(deletingId)}
        onClose={() => !deleting && setDeletingId(null)}
        dismissible={!deleting}
        size="sm"
        closeLabel={translateSync("Close")}
        title={translateSync("Remove this piece?")}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeletingId(null)} disabled={deleting}>
              {translateSync("Cancel")}
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} loading={deleting}>
              {!deleting && <Trash2 className="w-4 h-4" />}
              {translateSync("Remove")}
            </Button>
          </div>
        }
      >
        <p className="text-[15px] text-ink-2">
          <strong className="text-ink">&ldquo;{deleteConfirmTitle}&rdquo;</strong> {translateSync("will be taken off the shop. Passes already sold for it still verify.")}
        </p>
        {deleteError && (
          <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-danger">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {translateSync(deleteError)}
          </p>
        )}
      </Dialog>
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

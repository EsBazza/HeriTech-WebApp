"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { userRole } from "@/lib/roleGuard";
import {
  Palette,
  CheckCircle2,
  Link2,
  PlusCircle,
  Sparkles,
  Loader2,
  ShieldAlert,
  ImagePlus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Package,
  Upload,
  Link as LinkIcon,
  FileImage,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  materialTags: string[];
  kgDiverted: number;
  ngoFundName: string;
  stock: number;
  sourceBatchId: string;
  createdAt: string;
  sourceBatch?: { agreement?: { festival?: string; country?: string } };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BLANK_FORM = {
  title: "",
  description: "",
  price: "45.00",
  selectedBatchId: "",
  kgDiverted: "1.5",
  materialTags: "Bamboo, Heritage Loom",
  imageUrl: "",
  ngoFundName: "Cordillera Ancestral Watershed Fund",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ArtisanStudioPage() {
  const { user, loading: authLoading } = useAuth();
  const { translateSync, formatCurrency } = useTranslation();
  const role = userRole(user);

  // --- Source batches ---
  const [claimedBatches, setClaimedBatches] = useState<any[]>([]);
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
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  const isAuthorized = role === "artisan" || role === "admin";

  // --- Image Compression & File Handler (.jpg, .jpeg, .png) ---
  const compressImage = (file: File, maxDimension = 1200, quality = 0.88): Promise<string> => {
    return new Promise((resolve, reject) => {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!validTypes.includes(file.type) && !["jpg", "jpeg", "png"].includes(ext || "")) {
        reject(new Error(translateSync("Please upload a .jpg, .jpeg, or .png image file.")));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
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
        img.onerror = () => reject(new Error(translateSync("Failed to load image")));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error(translateSync("Failed to read file")));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (file: File | undefined | null) => {
    if (!file) return;
    setErrorMessage(null);
    try {
      const dataUrl = await compressImage(file);
      setField("imageUrl", dataUrl);
      setFileName(file.name);
      setImagePreviewError(false);
    } catch (err: any) {
      setErrorMessage(err.message || translateSync("Failed to process image file."));
    }
  };

  // --- Load batches ---
  useEffect(() => {
    if (authLoading || !isAuthorized) {
      setBatchesLoading(false);
      return;
    }
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setClaimedBatches(data.data);
          setForm((f) => ({ ...f, selectedBatchId: data.data[0].id }));
        }
      })
      .catch(console.error)
      .finally(() => setBatchesLoading(false));
  }, [authLoading, isAuthorized]);

  // --- Load artisan's own products ---
  const loadMyProducts = () => {
    if (!user?.id) return;
    setProductsLoading(true);
    fetch(`/api/products?artisanId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setMyProducts(data.data ?? []);
      })
      .catch(console.error)
      .finally(() => setProductsLoading(false));
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
    setForm({ ...BLANK_FORM, selectedBatchId: claimedBatches[0]?.id ?? "" });
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
    try {
      const res = await fetch("/api/ai/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedBatch.id,
          materialType: selectedBatch.materialType,
          condition: selectedBatch.condition,
          festival: selectedBatch.agreement?.festival ?? "Pan-Asian Festival",
          country: selectedBatch.agreement?.country ?? "Asia",
          craftTypology: selectedBatch.aiInferredMaterial ?? "Traditional Joinery & Weaving",
          artisanWorkshop: (user as any)?.workshopName ?? "Master Heritage Cooperative",
          divertedKg: form.kgDiverted || selectedBatch.weightKg,
          title: form.title || `${selectedBatch.materialType} Upcycled Creation`,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.story) {
        setField("description", data.data.story);
        if (Array.isArray(data.data.suggestedTags)) {
          setField("materialTags", data.data.suggestedTags.join(", "));
        }
      }
    } catch (err) {
      console.error("AI story failed:", err);
    } finally {
      setGeneratingStory(false);
    }
  };

  // ─── Submit (create or update) ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.selectedBatchId) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        images: form.imageUrl ? [form.imageUrl] : [],
        artisanId: user?.id ?? "usr_art_05",
        sourceBatchId: form.selectedBatchId,
        materialTags: form.materialTags.split(",").map((t) => t.trim()).filter(Boolean),
        kgDiverted: parseFloat(form.kgDiverted),
        ngoFundName: form.ngoFundName,
      };

      const res = editingId
        ? await fetch(`/api/products/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(
          editingId
            ? `"${form.title}" updated successfully.`
            : `"${form.title}" published to the marketplace!`
        );
        resetForm();
        loadMyProducts();
      } else {
        setErrorMessage(data.error ?? "Something went wrong.");
      }
    } catch (err) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const confirmDelete = (product: Product) => {
    setDeletingId(product.id);
    setDeleteConfirmTitle(product.title);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deletingId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMyProducts((prev) => prev.filter((p) => p.id !== deletingId));
        setDeletingId(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Guards ──────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#7D5A3C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-[#2E1E12]">
          {translateSync("Artisan Access Only")}
        </h2>
        <p className="text-sm text-[#5C4A38]">
          {translateSync(
            "The Artisan Studio is reserved for verified artisan accounts. Sign in as an artisan to list your crafted pieces."
          )}
        </p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-2.5 rounded-full bg-[#3D2B1F] text-[#EDE0C4] text-xs font-bold uppercase tracking-wider hover:bg-[#5A3F2A] transition-colors"
        >
          {translateSync("Back to Marketplace")}
        </a>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-[#7D5A3C]">
          <Palette className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider">Artisan Studio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
          {translateSync("Craft, Enlist & Manage Your Upcycled Pieces")}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {translateSync(
            "Transform claimed festival material into authenticated heritage goods. Every piece is permanently bound to its source harvest Batch ID."
          )}
        </p>
      </div>

      {/* ── Global success / error banners ── */}
      {successMessage && (
        <div className="flex items-start space-x-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════
          SECTION 1 — LISTING FORM
      ════════════════════════════════════════ */}
      <div ref={formRef} className="bg-white rounded-2xl border border-[#E6E2D8] shadow-sm overflow-hidden">
        {/* Form header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EDE6] bg-[#FDFCF9]">
          <div className="flex items-center space-x-2">
            {editingId ? (
              <Pencil className="w-4 h-4 text-[#7D5A3C]" />
            ) : (
              <PlusCircle className="w-4 h-4 text-[#1A6B3A]" />
            )}
            <span className="text-sm font-bold text-gray-800">
              {editingId
                ? translateSync("Edit Upcycled Piece")
                : translateSync("List a New Upcycled Piece")}
            </span>
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
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
              <label className="font-bold text-gray-700">
                {translateSync("Product Title")} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder={translateSync("e.g. Panagbenga Botanical Loom Wall Tapestry")}
                className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A6B3A]/30"
              />
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-700">
                {translateSync("Fair-Trade Retail Price (USD)")} <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-mono-data font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A6B3A]/30"
              />
              <span className="text-[10px] text-gray-400">
                {translateSync("You receive")}{" "}
                <strong>70% (${(parseFloat(form.price || "0") * 0.7).toFixed(2)})</strong>{" "}
                {translateSync("upon sale.")}
              </span>
            </div>
          </div>

          {/* ── IMAGE SECTION (DUAL OPTION: FILE UPLOAD OR URL) ── */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                <ImagePlus className="w-3.5 h-3.5 text-[#7D5A3C]" />
                <span>{translateSync("Product Image")}</span>
                <span className="text-[10px] text-gray-400 font-normal">
                  ({translateSync("Choose Upload or URL")})
                </span>
              </label>

              {/* Segmented Mode Selector */}
              <div className="inline-flex p-0.5 rounded-lg bg-[#F0EDE6] border border-[#E6E2D8] text-xs">
                <button
                  type="button"
                  onClick={() => setImageMode("file")}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-bold transition-all text-[11px] ${
                    imageMode === "file"
                      ? "bg-white text-[#7D5A3C] shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>{translateSync("Upload File (.jpg, .png)")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-bold transition-all text-[11px] ${
                    imageMode === "url"
                      ? "bg-white text-[#7D5A3C] shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
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
                    className={`relative aspect-auto h-44 rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-[#7D5A3C] bg-[#F5EDE4]"
                        : "border-[#E6E2D8] bg-[#F8F6F0] hover:bg-[#F2ECE3] hover:border-[#C8B89A]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={(e) => handleFileChange(e.target.files?.[0])}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-[#EADCCF] text-[#7D5A3C] flex items-center justify-center mb-2 shadow-xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-gray-800">
                      {translateSync("Click to upload or drag & drop")}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {translateSync("Supports .JPG, .JPEG, or .PNG files")}
                    </p>
                    {fileName && (
                      <div className="mt-2 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white border border-[#E6E2D8] text-[10px] font-semibold text-[#7D5A3C]">
                        <FileImage className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{fileName}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">
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
                    className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7D5A3C]/30"
                  />
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    {translateSync(
                      "Paste a direct image URL (.jpg, .png, Unsplash, CDN). Visible to all buyers."
                    )}
                  </p>
                  {/* Quick Unsplash suggestion chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: "Bamboo craft", url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800" },
                      { label: "Woven textile", url: "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800" },
                      { label: "Paper art", url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800" },
                    ].map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => {
                          setField("imageUrl", s.url);
                          setFileName(null);
                        }}
                        className="px-2 py-1 rounded-full border border-[#E6E2D8] bg-[#F8F6F0] text-[10px] font-semibold text-[#7D5A3C] hover:bg-[#F0E8DF] transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Box */}
              <div className="relative aspect-square sm:aspect-auto sm:h-44 rounded-xl overflow-hidden border-2 border-dashed border-[#E6E2D8] bg-[#F8F6F0] flex items-center justify-center">
                {form.imageUrl && !imagePreviewError ? (
                  <>
                    <Image
                      src={form.imageUrl}
                      alt="Product preview"
                      fill
                      className="object-cover rounded-xl"
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
                    <ImagePlus className="w-8 h-8 text-[#C8B89A] mx-auto" />
                    <p className="text-[10px] text-gray-400">
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
            <label className="font-bold text-gray-700 flex items-center space-x-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#1A6B3A]" />
              <span>
                {translateSync("Link to Source Material Batch")} <span className="text-red-400">*</span>
              </span>
            </label>
            {batchesLoading ? (
              <div className="flex items-center space-x-2 text-gray-400 p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{translateSync("Loading batches...")}</span>
              </div>
            ) : claimedBatches.length === 0 ? (
              <p className="text-gray-400 p-3 bg-[#F8F6F0] rounded-xl border border-[#E6E2D8]">
                {translateSync("No material batches claimed yet. Claim a batch on the map to get started.")}
              </p>
            ) : (
              <select
                value={form.selectedBatchId}
                onChange={(e) => setField("selectedBatchId", e.target.value)}
                disabled={!!editingId}
                className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-white font-mono-data text-xs font-semibold text-gray-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1A6B3A]/30"
              >
                {claimedBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.id}] {b.title} ({b.weightKg} kg {b.materialType}) — {b.agreement?.festival} ({b.agreement?.country})
                  </option>
                ))}
              </select>
            )}
            {editingId && (
              <p className="text-[10px] text-amber-600">
                {translateSync("Source batch cannot be changed after publishing.")}
              </p>
            )}
          </div>

          {/* Description / AI */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-700">
                {translateSync("Product Bio & Material Origin Story")}
              </label>
              <button
                type="button"
                onClick={handleGenerateAIStory}
                disabled={generatingStory || !selectedBatch}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-[#1A6B3A] text-[11px] font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {generatingStory ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{translateSync("Drafting...")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{translateSync("Auto-generate with Gemini")}</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder={translateSync(
                "Describe your upcycling technique, natural dyes, or click the Gemini button above to auto-generate the cultural origin story..."
              )}
              className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1A6B3A]/30"
            />
          </div>

          {/* Row — kg + NGO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-700">
                {translateSync("Kilograms Diverted per Item")}
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={form.kgDiverted}
                onChange={(e) => setField("kgDiverted", e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-mono-data font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A6B3A]/30"
              />
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-700">
                {translateSync("10% Designated NGO Fund")}
              </label>
              <input
                type="text"
                value={form.ngoFundName}
                onChange={(e) => setField("ngoFundName", e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A6B3A]/30"
              />
            </div>
          </div>

          {/* Material Tags */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-gray-700">
              {translateSync("Material Tags (comma-separated)")}
            </label>
            <input
              type="text"
              value={form.materialTags}
              onChange={(e) => setField("materialTags", e.target.value)}
              placeholder={translateSync("Bamboo, Natural Dyes, Rice Paper")}
              className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#1A6B3A]/30"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
              editingId
                ? "bg-[#7D5A3C] hover:bg-[#5C3D20] text-white"
                : "bg-[#1A6B3A] hover:bg-[#14532D] text-white"
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
                <span>{translateSync("Publish Upcycled Piece to Marketplace")}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* ════════════════════════════════════════
          SECTION 2 — MY PUBLISHED PIECES
      ════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-[#7D5A3C]" />
            <h2 className="text-base font-extrabold text-gray-900">
              {translateSync("My Published Pieces")}
            </h2>
            {!productsLoading && (
              <span className="text-xs font-bold text-[#7D5A3C] bg-[#F5EDE4] px-2 py-0.5 rounded-full border border-[#E8D5C4]">
                {myProducts.length}
              </span>
            )}
          </div>
          <button
            onClick={loadMyProducts}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{translateSync("Refresh")}</span>
          </button>
        </div>

        {/* Loading skeleton */}
        {productsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!productsLoading && myProducts.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-[#E6E2D8] rounded-2xl space-y-3">
            <Package className="w-10 h-10 text-[#C8B89A] mx-auto" />
            <p className="text-sm font-semibold text-gray-500">
              {translateSync("No pieces published yet")}
            </p>
            <p className="text-xs text-gray-400">
              {translateSync("Fill in the form above to list your first upcycled craft.")}
            </p>
          </div>
        )}

        {/* Product cards */}
        {!productsLoading && myProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {myProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
                  editingId === product.id
                    ? "border-[#7D5A3C] ring-2 ring-[#7D5A3C]/20"
                    : "border-[#E6E2D8]"
                }`}
              >
                {/* Product image */}
                <div className="relative aspect-video w-full bg-[#F8F6F0]">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImagePlus className="w-10 h-10 text-[#C8B89A]" />
                    </div>
                  )}
                  {/* Price badge */}
                  <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-[#E6E2D8]">
                    <span className="text-xs font-bold text-[#7D5A3C]">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {product.description || translateSync("No description.")}
                    </p>
                  </div>

                  {/* Tags */}
                  {product.materialTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.materialTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-[#F0EDE6] text-[9px] font-semibold text-[#7D5A3C] uppercase tracking-wide"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#F0EDE6]">
                    <span>{product.kgDiverted} kg {translateSync("diverted")}</span>
                    <span className="font-mono-data">
                      {product.sourceBatch?.agreement?.festival ?? product.sourceBatchId}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/products/${product.id}`}
                      target="_blank"
                      className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-[#E6E2D8] text-[11px] font-semibold text-gray-600 hover:bg-[#F8F6F0] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{translateSync("View")}</span>
                    </Link>

                    <button
                      onClick={() => startEdit(product)}
                      disabled={editingId === product.id}
                      className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-[#F0EDE6] text-[11px] font-bold text-[#7D5A3C] hover:bg-[#E8D5C4] transition-colors disabled:opacity-50"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{translateSync("Edit")}</span>
                    </button>

                    <button
                      onClick={() => confirmDelete(product)}
                      className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-red-50 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{translateSync("Delete")}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ════════════════════════════════════════ */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-gray-900 text-base">
                {translateSync("Remove this piece?")}
              </h3>
              <p className="text-sm text-gray-500">
                <strong className="text-gray-700">&ldquo;{deleteConfirmTitle}&rdquo;</strong>{" "}
                {translateSync("will be removed from the marketplace. This cannot be undone.")}
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeletingId(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {translateSync("Cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-60"
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

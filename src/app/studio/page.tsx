"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import {
  TranslatableText,
  TranslatableHeading,
  TranslatableParagraph,
} from "@/components/translation/TranslatableText";
import {
  Palette,
  CheckCircle2,
  Link2,
  PlusCircle,
  Sparkles,
  Loader2,
  RotateCcw,
} from "lucide-react";

export default function ArtisanStudioPage() {
  const { user } = useAuth();
  const { translateSync } = useTranslation();
  const [claimedBatches, setClaimedBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("45.00");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [kgDiverted, setKgDiverted] = useState("1.5");
  const [materialTags, setMaterialTags] = useState("Bamboo, Heritage Loom");
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800"
  );
  const [ngoFundName, setNgoFundName] = useState(
    "Cordillera Ancestral Watershed Fund"
  );

  const [generatingStory, setGeneratingStory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any>(null);

  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/materials");
        const data = await res.json();
        if (data.success) {
          setClaimedBatches(data.data);
          if (data.data.length > 0) {
            setSelectedBatchId(data.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load batches:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBatches();
  }, []);

  const selectedBatch = claimedBatches.find((b) => b.id === selectedBatchId);

  // AI Origin Story Generator
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
          festival: selectedBatch.agreement?.festival || "Pan-Asian Festival",
          country: selectedBatch.agreement?.country || "Asia",
          craftTypology: selectedBatch.aiInferredMaterial || "Traditional Joinery & Weaving",
          artisanWorkshop: user?.workshopName || "Master Heritage Cooperative",
          divertedKg: kgDiverted || selectedBatch.weightKg,
          title: title || `${selectedBatch.materialType} Upcycled Creation`,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.story) {
        setDescription(data.data.story);
        if (data.data.suggestedTags && Array.isArray(data.data.suggestedTags)) {
          setMaterialTags(data.data.suggestedTags.join(", "));
        }
      }
    } catch (err) {
      console.error("Failed to generate AI origin story:", err);
    } finally {
      setGeneratingStory(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !selectedBatchId) return;

    setSubmitting(true);
    try {
      const tagsArray = materialTags.split(",").map((t) => t.trim());
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          images: [imageUrl],
          artisanId: user?.id || "usr_art_05",
          sourceBatchId: selectedBatchId,
          materialTags: tagsArray,
          kgDiverted: parseFloat(kgDiverted),
          ngoFundName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedProduct(data.data);
      }
    } catch (err) {
      console.error("Failed to create product:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-[#1A6B3A]">
          <Palette className="w-3.5 h-3.5" />
          <TranslatableText>ACT 4: CRAFT, SELL, & PROVE (ARTISAN STUDIO)</TranslatableText>
        </div>
        <TranslatableHeading
          level={1}
          className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1"
        >
          Artisan Craft Minting & Origin Linker
        </TranslatableHeading>
        <TranslatableParagraph className="text-xs text-gray-500 mt-1">
          Transform claimed festival material into authenticated heritage goods. Every listed craft piece is permanently bound to its source harvest Batch ID.
        </TranslatableParagraph>
      </div>

      <div className="bg-white rounded-3xl border border-[#E6E2D8] p-8 shadow-sm">
        {createdProduct ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-[#1A6B3A] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <TranslatableHeading level={3} className="text-base font-bold text-gray-900">
                "{createdProduct.title}" <TranslatableText>Listed in Marketplace!</TranslatableText>
              </TranslatableHeading>
              <TranslatableParagraph className="text-xs text-gray-600 mt-1">
                Bound to Source Batch <strong>{createdProduct.sourceBatchId}</strong>. Buyers can now purchase with 70% direct escrow payout.
              </TranslatableParagraph>
            </div>
            <button
              onClick={() => {
                setCreatedProduct(null);
                setTitle("");
                setDescription("");
              }}
              className="px-5 py-2.5 bg-[#1A6B3A] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#14532D]"
            >
              <TranslatableText>List Another Heritage Piece</TranslatableText>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateProduct} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Title */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-gray-700">
                  <TranslatableText>Product Title</TranslatableText>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={translateSync("e.g. Panagbenga Botanical Loom Wall Tapestry")}
                  className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-semibold text-gray-900"
                />
              </div>

              {/* Price */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-gray-700">
                  <TranslatableText>Fair-Trade Retail Price ($ USD)</TranslatableText>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-mono-data font-bold text-gray-900"
                />
                <span className="text-[10px] text-gray-400">
                  <TranslatableText>You will receive</TranslatableText>{" "}
                  <strong>70% (${(parseFloat(price || "0") * 0.7).toFixed(2)})</strong>{" "}
                  <TranslatableText>instantly upon sale.</TranslatableText>
                </span>
              </div>
            </div>

            {/* Source Batch Selection (Immutable Linkage) */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-700 flex items-center space-x-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#1A6B3A]" />
                <TranslatableText>Link to Original Harvest Material Batch ID</TranslatableText>
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-white font-mono-data text-xs font-semibold text-gray-800"
              >
                {claimedBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.id}] {b.title} ({b.weightKg} kg {b.materialType}) - {b.agreement?.festival} ({b.agreement?.country})
                  </option>
                ))}
              </select>
            </div>

            {/* Description / AI Origin Story */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-700">
                  <TranslatableText>Product Bio & Material Origin Story</TranslatableText>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAIStory}
                  disabled={generatingStory || !selectedBatch}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-[#1A6B3A] text-[11px] font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {generatingStory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1A6B3A]" />
                      <TranslatableText>Drafting Origin Bio...</TranslatableText>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <TranslatableText>✨ Auto-Generate AI Origin Story with Gemini</TranslatableText>
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={translateSync(
                  "Describe your upcycling technique, natural dyes, or click the Gemini button above to auto-generate the cultural origin story..."
                )}
                className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] text-gray-900 leading-relaxed"
              />
              <p className="text-[10px] text-gray-500 italic">
                <TranslatableText>
                  The AI Origin Story synthesizes the harvest telemetry, festival origin, and artisan techniques into the public product bio.
                </TranslatableText>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Diverted kg */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-gray-700">
                  <TranslatableText>Kilograms Diverted per Item</TranslatableText>
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={kgDiverted}
                  onChange={(e) => setKgDiverted(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-mono-data font-bold text-gray-900"
                />
              </div>

              {/* NGO Partner Fund */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-gray-700">
                  <TranslatableText>10% Designated Clean-Up NGO Fund</TranslatableText>
                </label>
                <input
                  type="text"
                  value={ngoFundName}
                  onChange={(e) => setNgoFundName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] font-semibold text-gray-900"
                />
              </div>
            </div>

            {/* Material Tags */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-700">
                <TranslatableText>Material Tags (comma-separated)</TranslatableText>
              </label>
              <input
                type="text"
                value={materialTags}
                onChange={(e) => setMaterialTags(e.target.value)}
                placeholder={translateSync("Bamboo, Natural Dyes, Rice Paper")}
                className="w-full p-3 rounded-xl border border-[#E6E2D8] bg-[#F8F6F0] text-gray-900 font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-[#1A6B3A] hover:bg-[#14532D] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <TranslatableText>Minting Heritage Origin Link...</TranslatableText>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <TranslatableText>Publish Upcycled Piece to Global Marketplace</TranslatableText>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

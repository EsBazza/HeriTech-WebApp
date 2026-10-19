"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ImagePlus, Package, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export interface StudioProduct {
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

interface StudioListingsProps {
  products: StudioProduct[];
  loading: boolean;
  editingId: string | null;
  onRefresh: () => void;
  onEdit: (product: StudioProduct) => void;
  onDelete: (product: StudioProduct) => void;
}

/** The artisan's published pieces, with view, edit and delete actions. */
export function StudioListings({ products, loading, editingId, onRefresh, onEdit, onDelete }: StudioListingsProps) {
  const { translateSync, formatCurrency } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-lantern-600" />
          <h2 className="text-base font-semibold text-ink">
            {translateSync("My Published Pieces")}
          </h2>
          {!loading && (
            <span className="text-xs font-bold text-lantern-600 bg-paper-2 px-2 py-0.5 rounded-full border border-line-strong">
              {products.length}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-1 text-xs text-ink-3 hover:text-ink-2 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{translateSync("Refresh")}</span>
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-paper-2 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-line rounded-lg space-y-3">
          <Package className="w-10 h-10 text-ink-3 mx-auto" />
          <p className="text-sm font-semibold text-ink-3">
            {translateSync("No pieces published yet")}
          </p>
          <p className="text-xs text-ink-3">
            {translateSync("Fill in the form above to list your first upcycled craft.")}
          </p>
        </div>
      )}

      {/* Product cards */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-surface rounded-lg border overflow-hidden shadow-card transition-shadow hover:shadow-card ${
                editingId === product.id
                  ? "border-line-strong ring-2 ring-line-strong/20"
                  : "border-line"
              }`}
            >
              {/* Product image */}
              <div className="relative aspect-video w-full bg-paper">
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
                    <ImagePlus className="w-10 h-10 text-ink-3" />
                  </div>
                )}
                {/* Price badge */}
                <div className="absolute top-2.5 right-2.5 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-card border border-line">
                  <span className="text-xs font-bold text-lantern-600">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-ink leading-snug line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-xs text-ink-3 mt-0.5 line-clamp-2 leading-relaxed">
                    {product.description || translateSync("No description.")}
                  </p>
                </div>

                {/* Tags */}
                {product.materialTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.materialTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-paper-2 text-xs font-semibold text-lantern-600 tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta row */}
                <div className="flex items-center justify-between text-xs text-ink-3 pt-1 border-t border-line">
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
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-line text-xs font-semibold text-ink-2 hover:bg-paper transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{translateSync("View")}</span>
                  </Link>

                  <button
                    onClick={() => onEdit(product)}
                    disabled={editingId === product.id}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-paper-2 text-xs font-bold text-lantern-600 hover:bg-paper-2 transition-colors disabled:opacity-50"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{translateSync("Edit")}</span>
                  </button>

                  <button
                    onClick={() => onDelete(product)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-danger-100 text-xs font-bold text-danger hover:bg-danger-100 transition-colors ml-auto"
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
  );
}

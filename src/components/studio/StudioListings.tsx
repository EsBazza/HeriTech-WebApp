"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, ImagePlus, Package, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Badge, Button, EmptyState, IconButton, Skeleton, buttonClass, cn } from "@/components/ui";

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
  const { translateSync, formatCurrency, formatNumber } = useTranslation();

  return (
    <section className="space-y-4" aria-labelledby="studio-listings">
      <div className="flex items-center justify-between gap-3">
        <h2 id="studio-listings" className="flex items-center gap-2 text-lg font-semibold text-ink font-sans">
          <Package className="w-5 h-5 text-pine-600" />
          {translateSync("Your published pieces")}
          {!loading && <Badge tone="pine">{products.length}</Badge>}
        </h2>
        <Button variant="ghost" size="sm" onClick={onRefresh} aria-label={translateSync("Refresh your pieces")}>
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">{translateSync("Refresh")}</span>
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" role="status" aria-label={translateSync("Loading your pieces")}>
          {[1, 2].map((i) => (
            <div key={i} className="rounded-md border border-line bg-surface overflow-hidden">
              <Skeleton className="aspect-video rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <EmptyState
          icon={<Package className="w-5 h-5" />}
          title={translateSync("No pieces published yet")}
          description={translateSync("Pieces you publish appear here, with the batch they came from.")}
        />
      )}

      {!loading && products.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {products.map((product) => {
            const editing = editingId === product.id;
            return (
              <li
                key={product.id}
                className={cn(
                  "bg-surface rounded-md border overflow-hidden shadow-card transition-colors",
                  editing ? "border-lantern ring-2 ring-lantern/30" : "border-line hover:border-line-strong"
                )}
              >
                <div className="relative aspect-video w-full bg-paper">
                  {product.images?.[0] ? (
                    <Image src={product.images[0]} alt={product.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImagePlus className="w-10 h-10 text-ink-3" />
                    </div>
                  )}
                  <span className="absolute top-2.5 right-2.5 bg-surface/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-card border border-line tabular text-sm font-semibold text-ink">
                    {formatCurrency(product.price)}
                  </span>
                  {editing && (
                    <Badge tone="accent" className="absolute top-2.5 left-2.5">
                      {translateSync("Editing")}
                    </Badge>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink leading-snug line-clamp-1 font-sans">{product.title}</h3>
                    <p className="text-sm text-ink-3 mt-0.5 line-clamp-2 leading-relaxed">{product.description || translateSync("No story yet.")}</p>
                  </div>

                  {product.materialTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.materialTags.slice(0, 3).map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 text-sm text-ink-3 pt-2 border-t border-line">
                    <span className="tabular">
                      {formatNumber(product.kgDiverted)} kg {translateSync("diverted")}
                    </span>
                    <span className="truncate">{product.sourceBatch?.agreement?.festival ?? product.sourceBatchId}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/products/${product.id}`} className={buttonClass("secondary", "sm")}>
                      <Eye className="w-4 h-4" />
                      {translateSync("View")}
                    </Link>
                    <Button variant="secondary" size="sm" onClick={() => onEdit(product)} disabled={editing}>
                      <Pencil className="w-4 h-4" />
                      {translateSync("Edit")}
                    </Button>
                    <IconButton tone="danger" onClick={() => onDelete(product)} aria-label={`${translateSync("Remove")}: ${product.title}`} className="ml-auto">
                      <Trash2 className="w-[18px] h-[18px]" />
                    </IconButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

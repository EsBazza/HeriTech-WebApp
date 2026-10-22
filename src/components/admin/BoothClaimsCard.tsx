"use client";

import React, { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { apiJson } from "@/lib/api";
import { useTranslation } from "@/contexts/TranslationContext";
import type { ProductView } from "@/lib/server/views";
import { Badge, Button, Card, EmptyState, Skeleton } from "@/components/ui";

/**
 * Admin control for the showcase booth: choose which listings visitors can
 * claim for free (one per account). The stock is the number of pieces the
 * booth has to give away; claims stop at zero.
 */
export function BoothClaimsCard() {
  const { formatCurrency, translateSync } = useTranslation();
  const [products, setProducts] = useState<ProductView[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const result = await apiJson<ProductView[]>("/api/products");
    setProducts(result.data ?? []);
    if (!result.success) setError(result.error ?? "Couldn't load listings.");
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (product: ProductView) => {
    setBusy(product.id);
    setError(null);
    const result = await apiJson(`/api/products/${encodeURIComponent(product.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ freeClaim: !product.freeClaim }),
    });
    if (result.success) await load();
    else setError(result.error ?? "Couldn't change this listing.");
    setBusy(null);
  };

  return (
    <section className="space-y-4" aria-labelledby="admin-booth">
      <div>
        <h2 id="admin-booth" className="flex items-center gap-2 text-lg font-semibold text-ink font-sans">
          <Gift className="w-5 h-5 text-brand-2" />
          {translateSync("Showcase booth giveaway")}
        </h2>
        <p className="text-sm text-ink-3 mt-1">
          {translateSync("Free pieces are claimed in the app, one per account, and handed over when booth staff scan the visitor's Impact Pass. Set the stock to the number of pieces at the booth.")}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {translateSync(error)}
        </p>
      )}
      {products === null ? (
        <Skeleton className="h-32 rounded-md" />
      ) : products.length === 0 ? (
        <EmptyState title={translateSync("No listings yet")} description={translateSync("An artisan lists the booth piece in the studio first.")} />
      ) : (
        <Card className="divide-y divide-line">
          {products.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-ink truncate">{translateSync(p.title)}</p>
                <p className="text-sm text-ink-3">
                  {p.artisan?.workshopName || p.artisan?.fullName || translateSync("Artisan")} · {p.stock} {translateSync("left")}
                  {!p.freeClaim && <> · {formatCurrency(p.price)}</>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {p.freeClaim && <Badge tone="accent">{translateSync("Free to claim")}</Badge>}
                <Button size="sm" variant={p.freeClaim ? "secondary" : "primary"} loading={busy === p.id} onClick={() => toggle(p)}>
                  {translateSync(p.freeClaim ? "Stop giving away" : "Make free to claim")}
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}

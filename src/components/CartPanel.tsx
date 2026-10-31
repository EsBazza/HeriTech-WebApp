"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Leaf, QrCode, ShoppingBag, Trash2 } from "lucide-react";
import { useCart, type CartProduct } from "@/context/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { SPLIT, calculateEscrowSplit } from "@/lib/escrow";
import { Button, Dialog, cn } from "@/components/ui";

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const reducedMotion = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

/** A number that glides from its last value to the new one (on open it rises from zero). */
function useTween(value: number, duration = 800) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (reducedMotion()) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const v = a + (value - a) * (1 - Math.pow(1 - p, 3));
      from.current = v;
      setShown(v);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return shown;
}

/** Adds up the 60/20/15/5 split piece by piece, so it matches what checkout charges to the cent. */
function cartSplit(items: CartProduct[]) {
  return items.reduce(
    (acc, item) => {
      const s = calculateEscrowSplit(item.price);
      return { artisan: acc.artisan + s.artisanPayout, lgu: acc.lgu + s.lguShare, platform: acc.platform + s.platformShare, ngo: acc.ngo + s.ngoShare };
    },
    { artisan: 0, lgu: 0, platform: 0, ngo: 0 }
  );
}

/**
 * The cart as an impact receipt: what the pieces rescue, where each one came
 * from, and where the money goes before checkout.
 */
export function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const { items, removeFromCart, subtotal, totalKgDiverted } = useCart();
  const { formatCurrency, formatNumber, translateSync, translateTemplate } = useTranslation();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Pieces on their way out, so the row can slide away before it is removed.
  const [leaving, setLeaving] = useState<Set<string>>(new Set());

  const kg = useTween(isOpen ? totalKgDiverted : 0);
  const total = useTween(isOpen ? subtotal : 0);
  const split = cartSplit(items);
  const festivals = new Set(items.map((i) => i.festivalName).filter(Boolean)).size;
  const makers = new Set(items.map((i) => i.artisanId || i.artisanName).filter(Boolean)).size;

  const remove = (id: string) => {
    if (reducedMotion()) return removeFromCart(id);
    setLeaving((s) => new Set(s).add(id));
    setTimeout(() => {
      removeFromCart(id);
      setLeaving((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }, 260);
  };

  const shares = [
    { key: "artisan", pct: SPLIT.artisan, value: split.artisan, color: "bg-split-artisan", label: translateSync("Artisans") },
    { key: "platform", pct: SPLIT.platform, value: split.platform, color: "bg-split-platform", label: translateSync("Platform") },
    { key: "lgu", pct: SPLIT.lgu, value: split.lgu, color: "bg-split-lgu", label: translateSync("Local government") },
    { key: "ngo", pct: SPLIT.ngo, value: split.ngo, color: "bg-split-ngo", label: translateSync("NGOs & tree planting") },
  ];

  const count = items.length;

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        variant="drawer"
        className="sm:max-w-[440px]"
        title={translateSync("Your cart")}
        description={
          count > 0
            ? count === 1 ? translateSync("1 handmade piece") : translateTemplate("{count} handmade pieces", { count })
            : undefined
        }
        closeLabel={translateSync("Close cart")}
        bodyClassName="px-0 py-0"
        footer={
          count > 0 && (
            <div className="cart-foot space-y-4 pt-1">
              {/* Where the money goes, live as pieces are added or removed */}
              <div>
                <p className="text-[15px] font-medium text-ink">
                  {translateTemplate("Where your {total} goes", { total: formatCurrency(subtotal) })}
                </p>
                <div className="cart-split mt-2.5 flex h-2.5 w-full gap-[3px] overflow-hidden rounded-full" aria-hidden>
                  {shares.map((s) => (
                    <span key={s.key} className={cn("cart-split-seg h-full rounded-full", s.color)} style={{ width: `${s.pct}%` }} />
                  ))}
                </div>
                {/* One line per share: label on the left, amount on the right */}
                <dl className="mt-3 grid grid-cols-1 gap-y-1.5">
                  {shares.map((s) => (
                    <div key={s.key} className="min-w-0 flex items-baseline justify-between gap-3">
                      <dt className="min-w-0 flex items-baseline gap-1.5 text-[13px] leading-snug text-ink-2">
                        <span aria-hidden className={cn("w-2 h-2 rounded-full shrink-0 translate-y-[-1px]", s.color)} />
                        <span className="truncate">{s.label}</span>
                        <span className="tabular text-ink-3">{s.pct}%</span>
                      </dt>
                      <dd className="tabular shrink-0 text-[14px] font-semibold text-ink">{formatCurrency(s.value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <Button
                variant="accent"
                size="lg"
                className="cart-checkout group w-full justify-between"
                onClick={() => {
                  setCheckoutOpen(true);
                  onClose();
                }}
              >
                <span>{translateSync("Checkout")}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular">{formatCurrency(total)}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-[13px] text-ink-3">
                <QrCode className="w-3.5 h-3.5 shrink-0" />
                {translateSync("Every piece comes with a Verified Impact Pass.")}
              </p>
            </div>
          )
        }
      >
        {count === 0 ? (
          <div className="cart-empty flex flex-col items-center text-center px-8 py-14">
            <span className="cart-empty-mark relative w-20 h-20 rounded-full bg-pine-50 text-brand flex items-center justify-center">
              <ShoppingBag className="w-8 h-8" strokeWidth={1.5} />
              <span aria-hidden className="cart-empty-leaf absolute -top-1 -right-1 w-8 h-8 rounded-full bg-lantern text-white flex items-center justify-center">
                <Leaf className="w-4 h-4" />
              </span>
            </span>
            <p className="mt-6 font-display text-[26px] leading-tight font-semibold text-ink">{translateSync("Nothing here yet")}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2 max-w-[30ch]">
              {translateSync("Every piece is made from recovered festival material and comes with a Verified Impact Pass.")}
            </p>
            <Button variant="secondary" className="mt-6" onClick={onClose}>
              {translateSync("Browse crafts")}
            </Button>
          </div>
        ) : (
          <>
            {/* What these pieces rescue */}
            <div className="cart-impact relative overflow-hidden bg-pine-900 text-white px-5 py-6">
              <svg aria-hidden viewBox="0 0 200 80" className="cart-impact-thread absolute -right-6 bottom-0 w-56 h-auto opacity-40">
                <path d="M0 70 C 50 10, 120 90, 200 20" fill="none" stroke="#f2a65a" strokeWidth="2" strokeDasharray="3 8" strokeLinecap="round" />
              </svg>
              <p className="relative text-[14px] text-white/75">{translateSync("Together, these pieces keep")}</p>
              <p className="relative mt-1 flex items-baseline gap-2">
                <span className="tabular font-display text-[52px] leading-none font-semibold text-glow">{formatNumber(Number(kg.toFixed(1)))}</span>
                <span className="text-[17px] font-medium">{translateSync("kg out of landfill")}</span>
              </p>
              <p className="relative mt-3 text-[14px] text-white/80">
                {[
                  festivals > 0 && (festivals === 1 ? translateSync("from 1 festival") : translateTemplate("from {count} festivals", { count: festivals })),
                  makers > 0 && (makers === 1 ? translateSync("made by 1 artisan") : translateTemplate("made by {count} artisans", { count: makers })),
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            <ul className="px-4 sm:px-5 py-5 space-y-3">
              {items.map((item, i) => {
                const maker = item.artisanName || item.cooperativeName;
                return (
                  <li
                    key={item.id}
                    data-leaving={leaving.has(item.id)}
                    className="cart-row grid grid-cols-[72px_1fr] min-[400px]:grid-cols-[88px_1fr] gap-3 min-[400px]:gap-4 rounded-lg bg-paper p-3"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <div className="relative aspect-square w-full self-start overflow-hidden rounded-md bg-paper-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" className="cart-photo w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[16px] leading-snug font-medium text-ink line-clamp-2">{translateSync(item.title)}</p>
                        <p className="tabular shrink-0 font-display text-[19px] min-[400px]:text-[20px] leading-none font-semibold text-ink pt-0.5">{formatCurrency(item.price)}</p>
                      </div>
                      {maker && <p className="mt-0.5 text-[14px] text-ink-2 truncate">{translateTemplate("by {maker}", { maker: translateSync(maker) })}</p>}
                      <div className="mt-auto pt-1.5 flex items-end justify-between gap-1">
                        {item.kgDiverted ? (
                          <span className="inline-flex items-start gap-1 pb-2.5 text-[13px] leading-snug text-brand min-w-0">
                            <Leaf className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                              {item.festivalName
                                ? translateTemplate("{kg} kg from {festival}", { kg: formatNumber(item.kgDiverted), festival: translateSync(item.festivalName) })
                                : translateTemplate("{kg} kg rescued", { kg: formatNumber(item.kgDiverted) })}
                            </span>
                          </span>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          aria-label={`${translateSync("Remove")}: ${translateSync(item.title)}`}
                          title={translateSync("Remove")}
                          className="shrink-0 -mr-1.5 -mb-1.5 w-11 h-11 inline-flex items-center justify-center rounded-md text-ink-3 hover:text-danger hover:bg-danger-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Dialog>

      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}

/**
 * Confirms an add-to-cart without covering the page: a short toast above the
 * tab bar with a way into the cart.
 */
export function CartToast() {
  const { lastAdded, dismissLastAdded, setIsCartOpen } = useCart();
  const { translateSync } = useTranslation();

  useEffect(() => {
    if (!lastAdded) return;
    const timer = setTimeout(dismissLastAdded, 4000);
    return () => clearTimeout(timer);
  }, [lastAdded, dismissLastAdded]);

  return (
    <div
      className="fixed z-40 inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:inset-x-auto md:right-6 md:bottom-24 md:w-96 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {lastAdded && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-pine-900 text-white shadow-pop pl-4 pr-2 py-2 animate-[sheet-in_0.2s_ease-out]">
          <Check className="w-4 h-4 shrink-0 text-pine-200" />
          <p className="flex-1 min-w-0 text-sm">
            <span className="block truncate font-medium">{translateSync(lastAdded.title)}</span>
            <span className="text-white/70">{translateSync("Added to cart")}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              dismissLastAdded();
              setIsCartOpen(true);
            }}
            className="shrink-0 min-h-11 px-3 rounded-md text-sm font-semibold text-white hover:bg-white/10 cursor-pointer"
          >
            {translateSync("View cart")}
          </button>
        </div>
      )}
    </div>
  );
}

export default CartPanel;

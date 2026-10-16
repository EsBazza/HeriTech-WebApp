"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, Trash2, X, Leaf } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { Button, EmptyState } from "@/components/ui";

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const { items, removeFromCart, subtotal, totalKgDiverted } = useCart();
  const { formatCurrency, formatNumber, translateSync } = useTranslation();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-pine-900/40 backdrop-blur-[2px] z-50" onClick={onClose} aria-hidden />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-surface shadow-pop z-50 flex flex-col"
          >
            <div className="h-16 px-5 border-b border-line flex items-center justify-between shrink-0">
              <h2 id="cart-title" className="font-display text-2xl font-semibold text-ink">
                {translateSync("Your cart")}
              </h2>
              <button onClick={onClose} className="-mr-2 w-10 h-10 rounded-md flex items-center justify-center text-ink-3 hover:bg-paper-2 hover:text-ink cursor-pointer" aria-label={translateSync("Close cart")}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <EmptyState
                  className="m-5 border-none bg-transparent"
                  icon={<ShoppingBag className="w-5 h-5" />}
                  title={translateSync("Your cart is empty")}
                  description={translateSync("Every piece is made from recovered festival material and comes with a Verified Impact Pass.")}
                  action={
                    <Button variant="secondary" onClick={onClose}>
                      {translateSync("Browse crafts")}
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-3 px-5 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" className="w-16 h-16 rounded-sm object-cover bg-paper-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink line-clamp-2">{translateSync(item.title)}</p>
                        {item.cooperativeName && <p className="text-xs text-ink-3 truncate mt-0.5">{translateSync(item.cooperativeName)}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="tabular text-sm font-semibold text-ink">
                            {formatCurrency(item.price * (item.quantity || 1))}
                            {(item.quantity || 1) > 1 && <span className="text-xs font-normal text-ink-3"> × {item.quantity}</span>}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex items-center gap-1 text-xs text-ink-3 hover:text-danger cursor-pointer"
                            aria-label={`${translateSync("Remove")} ${item.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {translateSync("Remove")}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t border-line space-y-4 shrink-0 bg-paper">
                <div className="flex items-center gap-2 text-sm text-pine-700">
                  <Leaf className="w-4 h-4" />
                  {formatNumber(totalKgDiverted)} {translateSync("kg of festival material kept out of landfill")}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-ink-3">{translateSync("Subtotal")}</span>
                  <span className="tabular font-display text-2xl font-semibold text-ink">{formatCurrency(subtotal)}</span>
                </div>
                <Button size="lg" className="w-full" onClick={() => {
                    setCheckoutOpen(true);
                    onClose();
                  }}>
                  {translateSync("Checkout")}
                </Button>
                <p className="text-xs text-ink-3 text-center">{translateSync("70% goes directly to the artisan. See the full split at checkout.")}</p>
              </div>
            )}
          </aside>
        </>
      )}

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false);
        }}
      />
    </>
  );
}

export default CartPanel;

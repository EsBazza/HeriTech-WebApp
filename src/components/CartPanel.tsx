"use client";

import React, { useEffect, useState } from "react";
import { Check, ShoppingBag, Trash2, Leaf } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { SPLIT } from "@/lib/escrow";
import { Button, Dialog, EmptyState, IconButton } from "@/components/ui";

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const { items, removeFromCart, subtotal, totalKgDiverted } = useCart();
  const { formatCurrency, formatNumber, translateSync } = useTranslation();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        variant="drawer"
        title={translateSync("Your cart")}
        closeLabel={translateSync("Close cart")}
        bodyClassName="px-0 py-0"
        footer={
          items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-pine-700">
                <Leaf className="w-4 h-4 shrink-0" />
                {formatNumber(totalKgDiverted)} {translateSync("kg of festival material kept out of landfill")}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-3">{translateSync("Subtotal")}</span>
                <span className="tabular font-display text-2xl font-semibold text-ink">{formatCurrency(subtotal)}</span>
              </div>
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={() => {
                  setCheckoutOpen(true);
                  onClose();
                }}
              >
                {translateSync("Checkout")}
              </Button>
              <p className="text-sm text-ink-3 text-center">
                {SPLIT.artisan}% {translateSync("goes directly to the artisan. See the full split at checkout.")}
              </p>
            </div>
          )
        }
      >
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
                  {item.cooperativeName && <p className="text-sm text-ink-3 truncate mt-0.5">{translateSync(item.cooperativeName)}</p>}
                  <p className="tabular text-sm font-semibold text-ink mt-1.5">{formatCurrency(item.price)}</p>
                </div>
                <IconButton tone="danger" onClick={() => removeFromCart(item.id)} aria-label={`${translateSync("Remove")}: ${translateSync(item.title)}`} className="-mr-2 self-center">
                  <Trash2 className="w-[18px] h-[18px]" />
                </IconButton>
              </li>
            ))}
          </ul>
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

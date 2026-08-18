"use client";

import React, { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { TranslatableText, TranslatableParagraph } from "@/components/translation/TranslatableText";
import { X, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeFromCart, totalAmount, totalKgDiverted } = useCart();
  const { formatCurrency, formatNumber } = useTranslation();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
        <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#E6E2D8] p-6">
          {/* Drawer Header */}
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2 text-gray-900">
                <ShoppingBag className="w-5 h-5 text-[#1A6B3A]" />
                <h3 className="text-lg font-bold">
                  <TranslatableText>Your Heritage Cart</TranslatableText> ({items.length})
                </h3>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Kilograms Diverted Pill */}
            {items.length > 0 && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                <TranslatableText className="text-emerald-900 font-medium">Environmental Impact:</TranslatableText>
                <span className="font-mono-data font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {formatNumber(totalKgDiverted)} <TranslatableText>kg waste diverted</TranslatableText>
                </span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="mt-4 space-y-3 overflow-y-auto max-h-[60vh] pr-1">
              {items.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <TranslatableParagraph className="text-sm font-semibold text-gray-700">Your cart is empty</TranslatableParagraph>
                  <TranslatableParagraph className="text-xs text-gray-400">
                    Explore authenticated heritage pieces in the marketplace.
                  </TranslatableParagraph>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F8F6F0] rounded-2xl flex items-center justify-between gap-3 border border-[#E6E2D8]/60"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate"><TranslatableText>{item.title}</TranslatableText></h4>
                        <p className="text-[10px] text-gray-500 truncate"><TranslatableText>By</TranslatableText> <TranslatableText>{item.artisanName}</TranslatableText></p>
                        <p className="font-mono-data text-xs font-bold text-[#141312] mt-0.5">
                          {formatCurrency(item.price)} USD
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Drawer Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm font-bold text-gray-900">
                <TranslatableText>Subtotal (70/20/10 Escrow)</TranslatableText>
                <span className="font-mono-data text-lg font-black">{formatCurrency(totalAmount)} USD</span>
              </div>

              <button
                onClick={() => {
                  closeCart();
                  setCheckoutOpen(true);
                }}
                className="w-full py-3.5 rounded-xl bg-[#1A6B3A] hover:bg-[#14532D] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <TranslatableText>Proceed to 2-Step Checkout</TranslatableText>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
}

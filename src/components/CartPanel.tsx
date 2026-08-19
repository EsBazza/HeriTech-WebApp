"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const { items, removeFromCart, clearCart, subtotal } = useCart();
  const { formatCurrency, translateSync } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirmReservation = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setConfirmed(true);
      clearCart();
      setTimeout(() => {
        setConfirmed(false);
        onClose();
      }, 2000);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-y-0 right-0 w-full sm:w-[360px] bg-[#FAF7F2] border-l border-[rgba(125,90,60,0.15)] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out"
    >
      {/* Header Bar */}
      <div className="h-16 px-4 border-b border-[rgba(125,90,60,0.12)] flex items-center justify-between bg-[#FAF7F2] shrink-0">
        <h2 className="font-display text-xl font-semibold text-[#2E1E12]">
          Reserved Batches
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-[#3D2B1F] hover:text-[#7D5A3C] transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close cart panel"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {confirmed ? (
          <div className="py-16 text-center space-y-2">
            <h3 className="font-display text-2xl font-semibold text-[#2E1E12]">
              Reservation Confirmed
            </h3>
            <p className="text-xs text-[#5C4A38] max-w-xs mx-auto">
              Your material allocation request has been routed to the artisan cooperative.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-sm text-[rgba(92,74,56,0.65)] font-body">
            No batches reserved yet.
          </div>
        ) : (
          <div className="divide-y divide-[rgba(125,90,60,0.08)]">
            {items.map((item) => (
              <div key={item.id} className="py-3.5 space-y-1.5">
                <div className="flex items-start justify-between">
                  <div className="pr-2">
                    <h4 className="text-sm font-medium text-[#2E1E12] line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[rgba(92,74,56,0.7)]">
                      {item.cooperativeName || item.artisanName || "Artisan Cooperative"}
                    </p>
                  </div>
                  <span className="font-display text-base font-semibold text-[#7D5A3C] shrink-0">
                    {formatCurrency(item.price)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[rgba(92,74,56,0.6)] font-mono-data">
                    {item.kgDiverted ? `${item.kgDiverted} kg material` : "1 batch"}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-[#7D5A3C] hover:text-red-700 font-medium transition-colors cursor-pointer min-h-[32px] flex items-center"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary & Footer Action */}
      {items.length > 0 && !confirmed && (
        <div className="p-4 border-t border-[rgba(125,90,60,0.12)] bg-[#FAF7F2] space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#5C4A38] uppercase tracking-wider text-[11px] font-bold">
              Subtotal
            </span>
            <span className="font-display text-xl font-semibold text-[#2E1E12]">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <button
            onClick={handleConfirmReservation}
            disabled={isConfirming}
            className="w-full py-3 bg-[#3D2B1F] hover:bg-[#5A3F2A] text-[#EDE0C4] text-xs uppercase tracking-wider font-bold rounded-[2px] transition-colors cursor-pointer min-h-[44px]"
          >
            {isConfirming ? "Processing reservation..." : "Confirm reservation"}
          </button>
        </div>
      )}
    </div>
  );
}

export default CartPanel;

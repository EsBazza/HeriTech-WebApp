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
          {translateSync("Cart & Reserved Batches")}
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
      <div className="flex-1 overflow-y-auto p-4 divide-y divide-[rgba(125,90,60,0.08)]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <p className="font-display text-lg text-[#2E1E12] font-medium">
              {translateSync("Your cart is empty")}
            </p>
            <p className="text-xs text-[rgba(92,74,56,0.7)]">
              {translateSync("Add items from the marketplace feed to reserve materials.")}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="py-3 flex items-start justify-between space-x-3">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-[#2E1E12] truncate">
                  {item.title}
                </p>
                <div className="flex items-center space-x-2 text-xs text-[rgba(92,74,56,0.7)]">
                  <span>{translateSync("Qty")}: {item.quantity || 1}</span>
                  <span>|</span>
                  <span className="font-semibold text-[#7D5A3C]">
                    {formatCurrency(item.price * (item.quantity || 1))}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-xs text-red-600 hover:text-red-800 p-1 cursor-pointer"
                title={translateSync("Remove")}
              >
                {translateSync("Remove")}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      {items.length > 0 && (
        <div className="p-4 border-t border-[rgba(125,90,60,0.12)] space-y-3 bg-[#FAF7F2] shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[rgba(92,74,56,0.8)] font-medium">
              {translateSync("Subtotal")}
            </span>
            <span className="font-display text-lg font-bold text-[#2E1E12]">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <button
            onClick={handleConfirmReservation}
            disabled={isConfirming || confirmed}
            className={`w-full py-3 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer min-h-[44px] ${
              confirmed
                ? "bg-[#4F7244] text-[#EDE0C4]"
                : "bg-[#3D2B1F] hover:bg-[#5A3F2A] text-[#EDE0C4]"
            }`}
          >
            {confirmed
              ? translateSync("Reservation Confirmed")
              : isConfirming
              ? translateSync("Confirming...")
              : translateSync("Confirm & Checkout")}
          </button>
        </div>
      )}
    </div>
  );
}

export default CartPanel;

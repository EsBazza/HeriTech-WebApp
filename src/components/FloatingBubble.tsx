"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/CartContext";
import { MessagesPanel } from "./MessagesPanel";
import { CartPanel } from "./CartPanel";

export function FloatingBubble() {
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const { isCartOpen, setIsCartOpen, itemCount } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for global open-messages event (e.g. from Product Detail page)
  useEffect(() => {
    const handleOpenMessages = () => {
      setIsMessagesOpen(true);
      setIsCartOpen(false);
      setIsExpanded(false);
    };

    window.addEventListener("open-messages", handleOpenMessages);
    return () => window.removeEventListener("open-messages", handleOpenMessages);
  }, []);

  if (!mounted) return null;

  const content = (
    <>
      {/* Floating Action Button Container */}
      <div
        ref={containerRef}
        className="fixed z-50 bottom-20 right-4 md:bottom-6 md:right-6 flex flex-col items-end pointer-events-auto"
      >
        {/* Child Bubble 2: Cart */}
        <div
          className={`flex items-center space-x-2 mb-3 transition-all duration-200 ease-out ${
            isExpanded
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-4 scale-50 pointer-events-none"
          }`}
          style={{ transitionDelay: isExpanded ? "80ms" : "0ms" }}
        >
          <span className="text-xs bg-[#3D2B1F] text-[#EDE0C4] px-2 py-1 rounded-[2px] shadow-sm font-medium">
            Cart ({itemCount})
          </span>
          <button
            onClick={() => {
              setIsExpanded(false);
              setIsMessagesOpen(false);
              setIsCartOpen(true);
            }}
            aria-label="Open cart"
            className="w-11 h-11 rounded-full bg-[#4F7244] hover:bg-[#3D5A34] text-[#EDE0C4] flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
                stroke="#EDE0C4"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="3"
                y1="6"
                x2="21"
                y2="6"
                stroke="#EDE0C4"
                strokeWidth="1.75"
              />
              <path
                d="M16 10a4 4 0 0 1-8 0"
                stroke="#EDE0C4"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Child Bubble 1: Messages */}
        <div
          className={`flex items-center space-x-2 mb-3 transition-all duration-200 ease-out ${
            isExpanded
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-4 scale-50 pointer-events-none"
          }`}
        >
          <span className="text-xs bg-[#3D2B1F] text-[#EDE0C4] px-2 py-1 rounded-[2px] shadow-sm font-medium">
            Messages
          </span>
          <button
            onClick={() => {
              setIsExpanded(false);
              setIsCartOpen(false);
              setIsMessagesOpen(true);
            }}
            aria-label="Open messages"
            className="w-11 h-11 rounded-full bg-[#7D5A3C] hover:bg-[#63462D] text-[#EDE0C4] flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                stroke="#EDE0C4"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="22,6 12,13 2,6"
                stroke="#EDE0C4"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Main Collapsed/Expanded Action Bubble */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label="Open actions menu"
          className="relative w-[52px] h-[52px] rounded-full bg-[#3D2B1F] hover:bg-[#2A1D15] flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border border-[#C8A96A]/20"
        >
          {isExpanded ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="#EDE0C4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M4 4h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H7l-4 3V5a1 1 0 0 1 1-1z"
                stroke="#EDE0C4"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* Unread / Cart Notification Indicator */}
          {itemCount > 0 && !isExpanded && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#3D2B1F]">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-In Panels */}
      <MessagesPanel
        isOpen={isMessagesOpen}
        onClose={() => setIsMessagesOpen(false)}
      />

      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );

  return createPortal(content, document.body);
}

export default FloatingBubble;

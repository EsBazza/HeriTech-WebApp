"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquare } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { MessagesPanel } from "./MessagesPanel";
import { CartPanel } from "./CartPanel";

export function FloatingBubble() {
  const [mounted, setMounted] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  // Set when something new arrives (e.g. the maker's message after checkout); cleared on open.
  const [hasNew, setHasNew] = useState(false);
  const { isCartOpen, setIsCartOpen } = useCart();
  const { translateSync } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for global open-messages event (e.g. from Product Detail page)
  useEffect(() => {
    const handleOpenMessages = () => {
      setIsMessagesOpen(true);
      setIsCartOpen(false);
      setHasNew(false);
    };
    const handleNewMessage = () => setHasNew(true);

    window.addEventListener("open-messages", handleOpenMessages);
    window.addEventListener("new-message", handleNewMessage);
    return () => {
      window.removeEventListener("open-messages", handleOpenMessages);
      window.removeEventListener("new-message", handleNewMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  const content = (
    <>
      {!isMessagesOpen && (
        <button
          onClick={() => {
            setIsCartOpen(false);
            setIsMessagesOpen(true);
            setHasNew(false);
          }}
          className="fixed z-40 right-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 md:right-6 h-12 pl-4 pr-5 rounded-full bg-pine-700 hover:bg-pine-600 text-white shadow-pop flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
          aria-label={translateSync("Open messages and HeriTech assistant")}
        >
          <MessageSquare className="w-5 h-5" strokeWidth={1.75} />
          <span className="hidden sm:inline">{translateSync(hasNew ? "New message" : "Ask HeriTech")}</span>
          {hasNew && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-lantern ring-2 ring-paper" aria-label={translateSync("New message")} />
          )}
        </button>
      )}

      <MessagesPanel isOpen={isMessagesOpen} onClose={() => setIsMessagesOpen(false)} />

      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );

  return createPortal(content, document.body);
}

export default FloatingBubble;

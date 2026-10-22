"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { MessagesPanel } from "./MessagesPanel";
import { CartPanel, CartToast } from "./CartPanel";

/** sessionStorage key the /messages redirect uses to ask for a thread to open. */
export const OPEN_THREAD_KEY = "heritech_open_thread";

export function FloatingBubble() {
  const [mounted, setMounted] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  // Set when something new arrives (e.g. the maker's message after checkout); cleared on open.
  const [hasNew, setHasNew] = useState(false);
  const { isCartOpen, setIsCartOpen } = useCart();
  const { translateSync } = useTranslation();
  const pathname = usePathname();

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

  // A link such as /messages?with=<id> (from a Wallet pass) leaves the thread to open here,
  // once the messages panel is mounted and listening. Checked again after each navigation,
  // because in-app links to /messages arrive while this component is already mounted.
  useEffect(() => {
    if (!mounted) return;
    let detail: { threadId: string; name: string } | undefined;
    try {
      const pending = sessionStorage.getItem(OPEN_THREAD_KEY);
      sessionStorage.removeItem(OPEN_THREAD_KEY);
      if (!pending) return;
      detail = pending === "inbox" ? undefined : JSON.parse(pending);
    } catch {
      return;
    }
    window.dispatchEvent(new CustomEvent("open-messages", { detail }));
  }, [mounted, pathname]);

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
          // Desktop only: on phones Messages lives in the tab bar or the header menu, so nothing floats over content.
          className="hidden md:flex fixed z-40 bottom-6 right-6 h-12 pl-4 pr-5 rounded-full bg-pine-700 hover:bg-pine-600 text-white shadow-pop items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
          aria-label={translateSync(hasNew ? "New message: open messages" : "Open messages and HeriTech assistant")}
        >
          <MessageSquare className="w-5 h-5" strokeWidth={1.75} />
          <span>{translateSync(hasNew ? "New message" : "Ask HeriTech")}</span>
          {hasNew && <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-lantern ring-2 ring-paper" aria-hidden />}
        </button>
      )}

      <MessagesPanel isOpen={isMessagesOpen} onClose={() => setIsMessagesOpen(false)} />

      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <CartToast />
    </>
  );

  return createPortal(content, document.body);
}

export default FloatingBubble;

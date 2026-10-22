"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OPEN_THREAD_KEY } from "@/components/FloatingBubble";

/**
 * /messages opens the messages panel on the home page.
 * /messages?with=<userId>&name=<display name> opens that person's thread (used by Wallet pass links).
 * The request is left in sessionStorage, so it survives the redirect however long it takes.
 */
export default function MessagesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const withId = params.get("with");
    try {
      sessionStorage.setItem(OPEN_THREAD_KEY, withId ? JSON.stringify({ threadId: withId, name: params.get("name") || "Maker" }) : "inbox");
    } catch {
      // Storage blocked: the home page still loads, just without the panel open.
    }
    router.replace("/");
  }, [router]);

  return (
    <div className="max-w-md mx-auto py-24 text-center space-y-3">
      <div className="w-8 h-8 border-4 border-pine-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-sm text-ink-3">Opening Messages...</p>
    </div>
  );
}

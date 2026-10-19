"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MessagesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home and trigger side bubble messages
    // /messages?with=<userId>&name=<display name> opens that person's thread (used by Wallet pass links).
    const params = new URLSearchParams(window.location.search);
    const withId = params.get("with");
    const detail = withId ? { threadId: withId, name: params.get("name") || "Maker" } : undefined;
    router.replace("/");
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-messages", { detail }));
    }, 200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="max-w-md mx-auto py-24 text-center space-y-3">
      <div className="w-8 h-8 border-4 border-pine-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-sm text-ink-3">Opening Messages...</p>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MessagesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home and trigger side bubble messages
    router.replace("/");
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-messages"));
    }, 200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="max-w-md mx-auto py-24 text-center space-y-3">
      <div className="w-8 h-8 border-4 border-[#2E6B4A] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs text-[#5B8870] font-medium">Opening Messages...</p>
    </div>
  );
}

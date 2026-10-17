"use client";

import { DEMO_MODE } from "@/lib/demo";
import { useTranslation } from "@/contexts/TranslationContext";

/** Shown on every page of the demo deployment so nobody mistakes its data for real records. */
export function DemoBanner() {
  const { translateSync } = useTranslation();
  if (!DEMO_MODE) return null;
  return (
    <div role="note" className="bg-lantern-100 text-lantern-600 text-center text-xs font-medium px-4 py-1.5">
      {translateSync("Demo version: the people, products and orders here are fictional, and payments are not real.")}
    </div>
  );
}

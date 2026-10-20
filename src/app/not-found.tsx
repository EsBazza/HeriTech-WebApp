"use client";

import { Compass } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { EmptyState, LinkButton } from "@/components/ui";

export default function NotFound() {
  const { translateSync } = useTranslation();

  return (
    <div className="max-w-xl mx-auto px-4 py-16 sm:py-24">
      <EmptyState
        icon={<Compass className="w-5 h-5" />}
        title={translateSync("We couldn't find that page")}
        description={translateSync("The link may be old, or the piece may have been sold and taken down.")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <LinkButton href="/">{translateSync("Back to shop")}</LinkButton>
            <LinkButton href="/impact" variant="secondary">
              {translateSync("See our impact")}
            </LinkButton>
          </div>
        }
      />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button, EmptyState, LinkButton } from "@/components/ui";

/** Catches a crash in any page (maps, charts, 3D) so the header and tabs stay usable. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { translateSync } = useTranslation();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 sm:py-24">
      <EmptyState
        icon={<TriangleAlert className="w-5 h-5" />}
        title={translateSync("Something went wrong on this page")}
        description={translateSync("Your cart and sign-in are safe. Try again, or go back to the shop.")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>
              <RefreshCw className="w-4 h-4" />
              {translateSync("Try again")}
            </Button>
            <LinkButton href="/" variant="secondary">
              {translateSync("Back to shop")}
            </LinkButton>
          </div>
        }
      />
    </div>
  );
}

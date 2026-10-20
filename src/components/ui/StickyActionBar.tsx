import React from "react";
import { cn } from "./cn";

/**
 * Keeps a page's main action in the thumb zone on phones: pinned above the
 * bottom tab bar below `md`, and an ordinary inline block from `md` up.
 */
export function StickyActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky z-30 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-auto md:static",
        "-mx-4 px-4 py-3 bg-surface/95 backdrop-blur-md border-t border-line md:mx-0 md:px-0 md:py-0 md:bg-transparent md:border-0 md:backdrop-blur-none",
        className
      )}
    >
      {children}
    </div>
  );
}

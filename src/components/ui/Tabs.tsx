"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "./cn";

export interface TabItem<K extends string> {
  key: K;
  label: React.ReactNode;
  count?: number;
}

interface TabsProps<K extends string> {
  items: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Keeps the selected tab in the URL hash (e.g. #people), so it can be linked to. */
  syncHash?: boolean;
  label: string;
  className?: string;
}

/** Accessible tab list: arrow keys move between tabs, the active one is the only tab stop. */
export function Tabs<K extends string>({ items, value, onChange, syncHash, label, className }: TabsProps<K>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!syncHash) return;
    const fromHash = window.location.hash.slice(1);
    const hit = items.find((i) => i.key === fromHash);
    if (hit && hit.key !== value) onChange(hit.key);
    // Only on mount: the hash is an entry point, not a second source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (key: K) => {
    onChange(key);
    if (syncHash) history.replaceState(null, "", `#${key}`);
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (index + step + items.length) % items.length;
    select(items[next].key);
    refs.current[items[next].key]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={cn("flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-line", className)}>
      {items.map((item, i) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            ref={(el) => {
              refs.current[item.key] = el;
            }}
            role="tab"
            id={`tab-${item.key}`}
            aria-selected={active}
            aria-controls={`panel-${item.key}`}
            tabIndex={active ? 0 : -1}
            onClick={() => select(item.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative inline-flex items-center gap-2 h-11 px-4 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors",
              "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:transition-colors",
              active ? "text-ink after:bg-pine-700" : "text-ink-3 hover:text-ink after:bg-transparent"
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn("tabular rounded-full px-1.5 min-w-5 h-5 inline-flex items-center justify-center text-xs", active ? "bg-pine-700 text-white" : "bg-paper-2 text-ink-3")}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Panel paired with a tab from `Tabs`. */
export function TabPanel({ id, active, children, className }: { id: string; active: boolean; children: React.ReactNode; className?: string }) {
  if (!active) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} className={cn("tab-panel", className)}>
      {children}
    </div>
  );
}

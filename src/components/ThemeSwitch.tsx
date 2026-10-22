"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { applyThemePreference, readThemePreference, type ThemePreference } from "@/lib/theme";
import { cn } from "@/components/ui";

const OPTIONS: ThemePreference[] = ["auto", "day", "night"];

/** Auto / Day / Night segmented control. The thumb slides; colours ease only while switching. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { translateSync } = useTranslation();
  const [preference, setPreference] = useState<ThemePreference>("auto");

  useEffect(() => {
    setPreference(readThemePreference());
  }, []);

  const choose = (next: ThemePreference) => {
    setPreference(next);
    applyThemePreference(next);
  };

  const index = OPTIONS.indexOf(preference);
  const label = { auto: translateSync("Auto"), day: translateSync("Day"), night: translateSync("Night") };

  return (
    <div role="group" aria-label={translateSync("Appearance")} className={cn("relative inline-flex h-11 p-1 rounded-full bg-paper-2 border border-line", className)}>
      <span
        aria-hidden
        className="theme-thumb absolute top-1 left-1 h-9 w-16 rounded-full bg-surface shadow-card"
        style={{ transform: `translateX(${index * 4}rem)` }}
      />
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => choose(option)}
          aria-pressed={preference === option}
          aria-label={option === "auto" ? undefined : label[option]}
          className="relative z-[1] w-16 h-9 rounded-full inline-flex items-center justify-center text-sm font-medium text-ink cursor-pointer"
        >
          {option === "auto" ? label.auto : option === "day" ? <Sun className="w-[18px] h-[18px]" aria-hidden /> : <Moon className="w-[18px] h-[18px]" aria-hidden />}
        </button>
      ))}
    </div>
  );
}

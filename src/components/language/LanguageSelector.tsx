"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe, Check, Loader2 } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { LANGUAGES_BY_REGION, type Language } from "@/lib/languages";
import { cn, controlClass } from "@/components/ui";

/** Header language picker: a globe button that opens a searchable list of the supported languages. */
export function LanguageSelector({ className }: { className?: string }) {
  const { currentLanguage, changeLanguage, isLoading, translateSync } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [panelLeft, setPanelLeft] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const close = (returnFocus = false) => {
    setIsOpen(false);
    setSearchTerm("");
    if (returnFocus) buttonRef.current?.focus();
  };

  // Line the panel up under the button, then nudge it so it stays 16px inside the screen.
  // On phones the globe sits mid-header, so a plain right-aligned panel runs off the left edge.
  const placePanel = () => {
    const box = dropdownRef.current?.getBoundingClientRect();
    if (!box) return;
    const viewport = document.documentElement.clientWidth;
    const width = Math.min(320, viewport - 32);
    const left = Math.min(Math.max(box.right - width, 16), viewport - 16 - width);
    setPanelLeft(left - box.left);
  };

  const open = () => {
    placePanel();
    setIsOpen(true);
  };

  // Close on outside click or Escape; keep the panel on screen if the window resizes.
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close(true);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", placePanel);
    searchInputRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placePanel);
    };
  }, [isOpen]);

  const handleLanguageChange = (languageCode: string) => {
    close(true);
    if (languageCode === currentLanguage.code) return;
    changeLanguage(languageCode).catch((error) => console.error("Failed to change language:", error));
  };

  const filtered = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return LANGUAGES_BY_REGION;
    const out: Record<string, Language[]> = {};
    Object.entries(LANGUAGES_BY_REGION).forEach(([region, languages]) => {
      const matches = languages.filter((l) => l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q) || l.code.toLowerCase().includes(q));
      if (matches.length) out[region] = matches;
    });
    return out;
  }, [searchTerm]);

  const regions = Object.entries(filtered);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => (isOpen ? close() : open())}
        disabled={isLoading}
        aria-label={`${translateSync("Language")}: ${currentLanguage.name}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 h-11 px-2.5 rounded-md text-ink-2 hover:bg-pine-50 hover:text-ink transition-colors cursor-pointer"
      >
        <Globe className="w-[18px] h-[18px]" strokeWidth={1.75} />
        <span className="text-sm font-medium hidden sm:block">{currentLanguage.code.toUpperCase()}</span>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-ink-3" /> : <ChevronDown className="w-4 h-4 text-ink-3" />}
      </button>

      {isOpen && (
        <div
          style={panelLeft === null ? { right: 0 } : { left: panelLeft }}
          className="absolute mt-2 w-[min(20rem,calc(100vw-2rem))] bg-surface rounded-md shadow-pop border border-line z-50 overflow-hidden animate-[sheet-in_0.18s_var(--ease-out-soft)]">
          <div className="p-3 border-b border-line">
            <input
              ref={searchInputRef}
              type="search"
              placeholder={translateSync("Search languages")}
              aria-label={translateSync("Search languages")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(controlClass, "h-11")}
            />
          </div>
          <div className="overflow-y-auto max-h-[min(20rem,60dvh)]" role="listbox" aria-label={translateSync("Language")}>
            {regions.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-3">{translateSync("No languages match")}</p>
            ) : (
              regions.map(([region, languages]) => (
                <div key={region} className="p-2" role="group" aria-label={region}>
                  <div className="text-xs font-semibold text-ink-3 uppercase tracking-wide px-3 py-2">{region}</div>
                  {languages.map((language) => {
                    const selected = currentLanguage.code === language.code;
                    return (
                      <button
                        key={language.code}
                        role="option"
                        aria-selected={selected}
                        onClick={() => handleLanguageChange(language.code)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 min-h-12 rounded-md text-left transition-colors cursor-pointer",
                          selected ? "bg-pine-100 text-brand" : "hover:bg-pine-50 text-ink-2"
                        )}
                      >
                        <span className="w-8 h-6 rounded-sm bg-paper-2 text-ink-2 text-xs font-semibold flex items-center justify-center shrink-0 uppercase">
                          {language.code.split("-")[0]}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">{language.nativeName}</span>
                          <span className="block text-xs text-ink-3 truncate">{language.name}</span>
                        </span>
                        {selected && <Check className="w-4 h-4 text-brand shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2.5 border-t border-line bg-paper text-xs text-ink-3">{translateSync("Powered by Google Cloud Translation")}</div>
        </div>
      )}
    </div>
  );
}

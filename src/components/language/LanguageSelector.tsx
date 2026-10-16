"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { LANGUAGES_BY_REGION, type Language } from '@/lib/languages';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'mobile';
  showRegions?: boolean;
  className?: string;
}

export function LanguageSelector({ 
  variant = 'default', 
  showRegions = true,
  className = ''
}: LanguageSelectorProps) {
  const { 
    currentLanguage, 
    changeLanguage, 
    isLoading,
    getSupportedLanguages,
    translateSync
  } = useTranslation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleLanguageChange = (languageCode: string) => {
    if (languageCode === currentLanguage.code) {
      setIsOpen(false);
      return;
    }

    // Instantly close the dropdown menu so the UI responds in 0ms
    setIsOpen(false);
    setSearchTerm('');

    // Trigger instant language change in context
    changeLanguage(languageCode).catch((error) => {
      console.error('Failed to change language:', error);
    });
  };

  // Filter languages based on search term
  const filteredLanguagesByRegion = React.useMemo(() => {
    if (!searchTerm) return LANGUAGES_BY_REGION;

    const filtered: Record<string, Language[]> = {};
    Object.entries(LANGUAGES_BY_REGION).forEach(([region, languages]) => {
      const matchingLanguages = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchingLanguages.length > 0) {
        filtered[region] = matchingLanguages;
      }
    });
    return filtered;
  }, [searchTerm]);

  // Compact variant for mobile or space-constrained areas
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading || isChanging}
          aria-label={`${translateSync("Language")}: ${currentLanguage.name}`}
          aria-expanded={isOpen}
          className="flex items-center gap-1.5 h-10 px-2.5 rounded-md text-ink-2 hover:bg-pine-50 hover:text-ink transition-colors cursor-pointer"
        >
          <Globe className="w-[18px] h-[18px]" strokeWidth={1.75} />
          <span className="text-sm font-medium hidden sm:block">
            {currentLanguage.code.toUpperCase()}
          </span>
          {(isLoading || isChanging) ? (
            <Loader2 className="w-4 h-4 animate-spin text-ink-3" />
          ) : (
            <ChevronDown className="w-4 h-4 text-ink-3" />
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] bg-surface rounded-md shadow-pop border border-line z-50 max-h-96 overflow-hidden">
            <div className="p-3 border-b border-line">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={translateSync("Search languages...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-line-strong rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pine-500/20 focus:border-pine-500"
              />
            </div>
            <div className="overflow-y-auto max-h-80">
              {Object.entries(filteredLanguagesByRegion).map(([region, languages]) => (
                <div key={region} className="p-2">
                  <div className="text-xs font-semibold text-ink-3 uppercase tracking-wide px-3 py-2">
                    {region}
                  </div>
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      disabled={isChanging}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        currentLanguage.code === language.code
                          ? 'bg-pine-100 text-pine-700'
                          : 'hover:bg-pine-50 text-ink-2'
                      }`}
                    >
                      <span className="w-8 h-6 rounded-sm bg-paper-2 text-ink-2 text-xs font-semibold flex items-center justify-center shrink-0 uppercase">{language.code.split("-")[0]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {language.nativeName}
                        </div>
                        <div className="text-xs text-ink-3 truncate">
                          {language.name}
                        </div>
                      </div>
                      {currentLanguage.code === language.code && (
                        <Check className="w-4 h-4 text-pine-700" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-line bg-paper text-xs text-ink-3">
              {translateSync("Powered by Google Cloud Translation")}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant - full-featured language selector
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || isChanging}
        className="flex items-center space-x-3 px-4 py-2.5 rounded-xl border border-line-strong hover:border-pine-500 bg-surface transition-all focus:outline-none focus:ring-2 focus:ring-pine-500/20 focus:border-pine-500 shadow-sm hover:shadow-md"
      >
        <Globe className="w-5 h-5 text-ink-3" />
        <div className="flex items-center space-x-2">
          <span className="text-xl">{currentLanguage.flag}</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-ink">
              {currentLanguage.nativeName}
            </div>
            <div className="text-xs text-ink-3">
              {currentLanguage.name}
            </div>
          </div>
        </div>
        {(isLoading || isChanging) ? (
          <Loader2 className="w-5 h-5 animate-spin text-ink-3" />
        ) : (
          <ChevronDown className={`w-5 h-5 text-ink-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-lg shadow-pop border border-line z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-line bg-pine-50">
            <h3 className="text-lg font-bold text-ink mb-1">{translateSync("Select Language")}</h3>
            <p className="text-xs text-ink-3">{translateSync("Choose your preferred language for the interface")}</p>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-line">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={translateSync("Search languages...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-line-strong rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pine-500/20 focus:border-pine-500"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="overflow-y-auto max-h-80">
            {Object.entries(filteredLanguagesByRegion).length === 0 ? (
              <div className="p-8 text-center">
                <Globe className="w-8 h-8 text-line-strong mx-auto mb-2" />
                <p className="text-sm text-ink-3">{translateSync("No languages found")}</p>
              </div>
            ) : (
              Object.entries(filteredLanguagesByRegion).map(([region, languages]) => (
                <div key={region} className="p-3">
                  {showRegions && (
                    <div className="flex items-center space-x-2 px-3 py-2 mb-1">
                      <div className="h-px bg-line flex-1"></div>
                      <span className="text-xs font-bold text-ink-3 uppercase tracking-wider px-2">
                        {region}
                      </span>
                      <div className="h-px bg-line flex-1"></div>
                    </div>
                  )}
                  <div className="space-y-1">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        disabled={isChanging}
                        className={`w-full flex items-center space-x-4 px-3 py-3 rounded-xl text-left transition-all group ${
                          currentLanguage.code === language.code
                            ? 'bg-pine-100 border border-pine-200 text-pine-700 shadow-sm'
                            : 'hover:bg-pine-50 text-ink-2 border border-transparent'
                        }`}
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">
                          {language.flag}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {language.nativeName}
                          </div>
                          <div className="text-xs text-ink-3 truncate">
                            {language.name} • {language.code}
                          </div>
                        </div>
                        {currentLanguage.code === language.code && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-pine-100 rounded-full flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-pine-700" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-line bg-paper">
            <p className="text-xs text-ink-3 text-center">
              {translateSync("Powered by Google Translate")} • {getSupportedLanguages().length} {translateSync("languages supported")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick language switcher for mobile
export function MobileLanguageSelector() {
  return <LanguageSelector variant="compact" className="md:hidden" />;
}

// Desktop language selector
export function DesktopLanguageSelector() {
  return <LanguageSelector variant="default" className="hidden md:block" />;
}

// Simple language code display
export function LanguageIndicator() {
  const { currentLanguage } = useTranslation();
  
  return (
    <div className="flex items-center space-x-2 px-2 py-1 rounded-md bg-paper-2 text-ink-2">
      <span className="text-sm">{currentLanguage.flag}</span>
      <span className="text-xs font-mono uppercase font-semibold">
        {currentLanguage.code}
      </span>
    </div>
  );
}
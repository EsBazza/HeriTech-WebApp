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
          className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 hover:border-gray-400 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {currentLanguage.code.toUpperCase()}
          </span>
          {(isLoading || isChanging) ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={translateSync("Search languages...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="overflow-y-auto max-h-80">
              {Object.entries(filteredLanguagesByRegion).map(([region, languages]) => (
                <div key={region} className="p-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                    {region}
                  </div>
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      disabled={isChanging}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        currentLanguage.code === language.code
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{language.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {language.nativeName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {language.name}
                        </div>
                      </div>
                      {currentLanguage.code === language.code && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
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
        className="flex items-center space-x-3 px-4 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm hover:shadow-md"
      >
        <Globe className="w-5 h-5 text-gray-600" />
        <div className="flex items-center space-x-2">
          <span className="text-xl">{currentLanguage.flag}</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-gray-900">
              {currentLanguage.nativeName}
            </div>
            <div className="text-xs text-gray-500">
              {currentLanguage.name}
            </div>
          </div>
        </div>
        {(isLoading || isChanging) ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        ) : (
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{translateSync("Select Language")}</h3>
            <p className="text-xs text-gray-600">{translateSync("Choose your preferred language for the interface")}</p>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={translateSync("Search languages...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="overflow-y-auto max-h-80">
            {Object.entries(filteredLanguagesByRegion).length === 0 ? (
              <div className="p-8 text-center">
                <Globe className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{translateSync("No languages found")}</p>
              </div>
            ) : (
              Object.entries(filteredLanguagesByRegion).map(([region, languages]) => (
                <div key={region} className="p-3">
                  {showRegions && (
                    <div className="flex items-center space-x-2 px-3 py-2 mb-1">
                      <div className="h-px bg-gray-200 flex-1"></div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
                        {region}
                      </span>
                      <div className="h-px bg-gray-200 flex-1"></div>
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
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm'
                            : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                        }`}
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">
                          {language.flag}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {language.nativeName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {language.name} • {language.code}
                          </div>
                        </div>
                        {currentLanguage.code === language.code && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
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
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
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
    <div className="flex items-center space-x-2 px-2 py-1 rounded-md bg-gray-100 text-gray-700">
      <span className="text-sm">{currentLanguage.flag}</span>
      <span className="text-xs font-mono uppercase font-semibold">
        {currentLanguage.code}
      </span>
    </div>
  );
}
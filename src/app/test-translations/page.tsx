"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { TranslatableText, TranslatableHeading, TranslatableParagraph } from '@/components/translation/TranslatableText';
import { LanguageSelector } from '@/components/language/LanguageSelector';
import { SUPPORTED_LANGUAGES, LANGUAGES_BY_REGION } from '@/lib/languages';
import { Globe, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface TranslationTest {
  id: string;
  text: string;
  expected?: string;
  category: string;
}

const TEST_TEXTS: TranslationTest[] = [
  {
    id: 'greeting',
    text: 'Hello, welcome to HeriTech!',
    category: 'Basic Greetings'
  },
  {
    id: 'product_title',
    text: 'Handcrafted Bamboo Lantern from Panagbenga Festival',
    category: 'Product Descriptions'
  },
  {
    id: 'artisan_info',
    text: 'Crafted by master artisan Maria Santos in Baguio, Philippines',
    category: 'Artisan Information'
  },
  {
    id: 'festival_description',
    text: 'Reclaimed materials from Yi Peng Lantern Festival in Chiang Mai, Thailand',
    category: 'Festival Context'
  },
  {
    id: 'impact_statement',
    text: 'This purchase diverted 2.5 kg of waste and contributed $5 to forest conservation',
    category: 'Environmental Impact'
  },
  {
    id: 'navigation',
    text: 'Browse products, view impact dashboard, and manage your profile',
    category: 'Navigation'
  },
  {
    id: 'cultural_content',
    text: 'Celebrating Asian heritage through sustainable craft traditions',
    category: 'Cultural Content'
  },
  {
    id: 'technical_terms',
    text: 'Google Wallet Impact Pass with blockchain verification',
    category: 'Technical Terms'
  }
];

export default function TranslationTestPage() {
  const { 
    currentLanguage, 
    getSupportedLanguages, 
    changeLanguage,
    translateText,
    formatCurrency,
    formatNumber,
    formatDate
  } = useTranslation();

  const [testResults, setTestResults] = useState<Map<string, { 
    translation: string; 
    success: boolean; 
    latency: number;
    error?: string;
  }>>(new Map());
  
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [apiStats, setApiStats] = useState<any>(null);

  // Run translation tests for current language
  const runTranslationTests = async () => {
    if (currentLanguage.code === 'en') {
      alert('Please select a non-English language to test translations.');
      return;
    }

    setIsRunningTests(true);
    const results = new Map();

    for (const test of TEST_TEXTS) {
      const startTime = Date.now();
      
      try {
        const translation = await translateText(test.text);
        const latency = Date.now() - startTime;
        
        results.set(test.id, {
          translation,
          success: translation !== test.text && translation.length > 0,
          latency,
        });
      } catch (error) {
        results.set(test.id, {
          translation: test.text,
          success: false,
          latency: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  // Fetch API statistics
  const fetchApiStats = async () => {
    try {
      const response = await fetch('/api/translate?action=stats');
      const data = await response.json();
      if (data.success) {
        setApiStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch API stats:', error);
    }
  };

  useEffect(() => {
    fetchApiStats();
  }, []);

  // Test different formatting functions
  const testFormatting = () => {
    const testDate = new Date();
    const testNumber = 12345.67;
    const testPrice = 49.99;

    return {
      date: formatDate(testDate),
      number: formatNumber(testNumber),
      currency: formatCurrency(testPrice)
    };
  };

  const formatting = testFormatting();
  const successfulTests = Array.from(testResults.values()).filter(r => r.success).length;
  const totalTests = testResults.size;
  const averageLatency = Array.from(testResults.values()).reduce((sum, r) => sum + r.latency, 0) / totalTests;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
          <Globe className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-800">Translation System Test</span>
        </div>
        
        <TranslatableHeading level={1} className="text-3xl font-bold text-gray-900">
          HeriTech Multi-Language Support Testing
        </TranslatableHeading>
        
        <TranslatableParagraph className="text-gray-600 max-w-2xl mx-auto">
          Test the Google Translate integration across Asian languages to ensure accurate and readable translations for all user-facing content.
        </TranslatableParagraph>
      </div>

      {/* Language Selection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Test Language</h2>
        <div className="flex flex-col space-y-4">
          <LanguageSelector />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Current Language:</span>
              <div className="font-semibold">{currentLanguage.nativeName}</div>
            </div>
            <div>
              <span className="text-gray-500">Language Code:</span>
              <div className="font-mono">{currentLanguage.code}</div>
            </div>
            <div>
              <span className="text-gray-500">Region:</span>
              <div>{currentLanguage.region}</div>
            </div>
            <div>
              <span className="text-gray-500">Direction:</span>
              <div>{currentLanguage.rtl ? 'RTL' : 'LTR'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formatting Tests */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Localization Formatting Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Date Formatting</h3>
            <div className="text-2xl font-semibold text-blue-600">{formatting.date}</div>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Number Formatting</h3>
            <div className="text-2xl font-semibold text-emerald-600">{formatting.number}</div>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Currency Formatting</h3>
            <div className="text-2xl font-semibold text-amber-600">{formatting.currency}</div>
          </div>
        </div>
      </div>

      {/* Translation Tests */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Translation Accuracy Tests</h2>
          <button
            onClick={runTranslationTests}
            disabled={isRunningTests || currentLanguage.code === 'en'}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunningTests ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>Run Translation Tests</span>
              </>
            )}
          </button>
        </div>

        {totalTests > 0 && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{successfulTests}/{totalTests}</div>
              <div className="text-sm text-gray-500">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{averageLatency.toFixed(0)}ms</div>
              <div className="text-sm text-gray-500">Avg Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{currentLanguage.code}</div>
              <div className="text-sm text-gray-500">Target Lang</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{TEST_TEXTS.length}</div>
              <div className="text-sm text-gray-500">Test Cases</div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {TEST_TEXTS.map((test) => {
            const result = testResults.get(test.id);
            
            return (
              <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{test.category}</h3>
                    <p className="text-sm text-gray-500 mt-1">Original Text</p>
                  </div>
                  {result && (
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="text-xs font-mono text-gray-500">
                        {result.latency}ms
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                    <p className="text-sm text-gray-700">{test.text}</p>
                  </div>
                  
                  {result && (
                    <div className={`p-3 rounded border-l-4 ${
                      result.success 
                        ? 'bg-emerald-50 border-emerald-400' 
                        : 'bg-red-50 border-red-400'
                    }`}>
                      <p className={`text-sm ${
                        result.success ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {result.translation}
                      </p>
                      {result.error && (
                        <p className="text-xs text-red-600 mt-1">Error: {result.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Statistics */}
      {apiStats && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Translation API Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-bold text-blue-600">{apiStats.totalTranslations}</div>
              <div className="text-sm text-gray-500">Total Requests</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{apiStats.cacheHitRate?.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Cache Hit Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{apiStats.averageLatency?.toFixed(0)}ms</div>
              <div className="text-sm text-gray-500">Avg Latency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{apiStats.errors}</div>
              <div className="text-sm text-gray-500">Errors</div>
            </div>
          </div>
        </div>
      )}

      {/* Language Support Overview */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Supported Languages Overview</h2>
        <div className="space-y-4">
          {Object.entries(LANGUAGES_BY_REGION).map(([region, languages]) => (
            <div key={region}>
              <h3 className="font-medium text-gray-700 mb-2">{region} ({languages.length} languages)</h3>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
                      currentLanguage.code === lang.code
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.nativeName}</span>
                    <span className="text-xs text-gray-500">({lang.code})</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Total:</strong> {getSupportedLanguages().length} languages supported across Asia
          </p>
        </div>
      </div>

      {/* Live Translation Demo */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Translation Demo</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <TranslatableHeading level={3} className="text-lg font-semibold text-emerald-600">
                Welcome to HeriTech Platform
              </TranslatableHeading>
              <TranslatableParagraph className="text-gray-600">
                Discover authentic Asian heritage crafts made from reclaimed festival materials. Each purchase supports local artisans and environmental conservation.
              </TranslatableParagraph>
            </div>
            <div>
              <TranslatableHeading level={3} className="text-lg font-semibold text-blue-600">
                Sustainable Impact
              </TranslatableHeading>
              <TranslatableParagraph className="text-gray-600">
                Your contribution helps preserve cultural traditions while creating positive environmental impact across Asian communities.
              </TranslatableParagraph>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
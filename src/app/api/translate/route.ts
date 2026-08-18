// Translation API endpoint using Google Translate
import { NextRequest, NextResponse } from 'next/server';
import { translateWithCache, translateBatch, detectLanguage } from '@/lib/translation/google-translate';
import { TranslationStats } from '@/lib/translation/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      text, 
      texts, 
      targetLanguage, 
      sourceLanguage = 'auto',
      type = 'single' // 'single', 'batch', 'detect'
    } = body;

    // Validate required parameters
    if (!targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'Target language is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    switch (type) {
      case 'batch':
        if (!texts || typeof texts !== 'object') {
          return NextResponse.json(
            { success: false, error: 'Texts object is required for batch translation' },
            { status: 400 }
          );
        }

        const batchResult = await translateBatch({
          texts,
          targetLanguage,
          sourceLanguage
        });

        const batchLatency = Date.now() - startTime;
        TranslationStats.recordTranslation(targetLanguage, batchLatency);

        return NextResponse.json({
          success: batchResult.success,
          translations: batchResult.translations,
          error: batchResult.error,
          metadata: {
            sourceLanguage,
            targetLanguage,
            latency: batchLatency,
            count: Object.keys(texts).length
          }
        });

      case 'detect':
        if (!text || typeof text !== 'string') {
          return NextResponse.json(
            { success: false, error: 'Text string is required for language detection' },
            { status: 400 }
          );
        }

        const detection = await detectLanguage(text);
        
        return NextResponse.json({
          success: detection.success,
          language: detection.language,
          confidence: detection.confidence,
          error: detection.error
        });

      case 'single':
      default:
        if (!text || (typeof text !== 'string' && !Array.isArray(text))) {
          return NextResponse.json(
            { success: false, error: 'Text string or array is required' },
            { status: 400 }
          );
        }

        const result = await translateWithCache({
          text,
          targetLanguage,
          sourceLanguage
        });

        const latency = Date.now() - startTime;
        
        if (result.success) {
          TranslationStats.recordTranslation(targetLanguage, latency);
        } else {
          TranslationStats.recordError(targetLanguage);
        }

        return NextResponse.json({
          success: result.success,
          translation: Array.isArray(text) ? result.translations : result.translations[0],
          translations: result.translations,
          detectedLanguage: result.detectedLanguage,
          error: result.error,
          metadata: {
            sourceLanguage,
            targetLanguage,
            latency,
            cached: latency < 50 // Assume cached if very fast
          }
        });
    }
  } catch (error) {
    console.error('Translation API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = TranslationStats.getStats();
        return NextResponse.json({
          success: true,
          stats
        });

      case 'supported-languages':
        // Return supported languages from our configuration
        const { SUPPORTED_LANGUAGES } = await import('@/lib/languages');
        return NextResponse.json({
          success: true,
          languages: SUPPORTED_LANGUAGES.map(lang => ({
            code: lang.code,
            name: lang.name,
            nativeName: lang.nativeName,
            region: lang.region,
            flag: lang.flag
          }))
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Translation API GET error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
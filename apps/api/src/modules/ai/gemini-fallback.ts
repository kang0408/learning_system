import { GoogleGenAI } from '@google/genai';
import * as Sentry from '@sentry/node';

/**
 * Ordered list of free/available Gemini models to fallback through when quota or rate limits are reached.
 */
export const GEMINI_FALLBACK_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it',
];

export interface GenerateContentOptions {
  contents: any;
  config?: any;
}

/**
 * Executes a generateContent call with automatic fallback across free Gemini models
 * whenever a model hits 429 rate limit, quota exhaustion, 503 overload, or 404.
 */
export async function generateContentWithFallback(
  ai: GoogleGenAI,
  options: GenerateContentOptions,
  models: string[] = GEMINI_FALLBACK_MODELS
): Promise<{ response: any; modelUsed: string }> {
  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      return { response, modelUsed: model };
    } catch (error: any) {
      lastError = error;
      console.warn(
        `[Gemini Fallback] Model "${model}" failed (Error: ${error?.message?.slice(0, 120)}). Cascading to next fallback model...`
      );

      // Brief backoff before next model attempt
      if (i < models.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }

  Sentry.captureException(lastError);
  throw lastError;
}

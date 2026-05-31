import { uzTranslations } from './uz';
import { ruTranslations } from './ru';
import type { BotTranslations } from './uz';

export type SupportedLanguage = 'uz' | 'ru';

const translations: Record<SupportedLanguage, BotTranslations> = {
  uz: uzTranslations,
  ru: ruTranslations
};

/**
 * Translation function that returns the correct translation for a given key and language
 * @param key - Dot-notation key path (e.g., 'welcome.greeting', 'commands.help')
 * @param lang - Language code ('uz' or 'ru')
 * @returns Translated string or fallback to Uzbek if key/language not found
 */
export function t(key: string, lang: SupportedLanguage = 'uz'): string {
  try {
    // Ensure language is supported, fallback to Uzbek
    const language = lang === 'ru' ? 'ru' : 'uz';
    const translation = translations[language];
    
    // Split key by dots and traverse the object
    const keys = key.split('.');
    let result: any = translation;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        // Key not found, try fallback to Uzbek if we were using Russian
        if (language === 'ru') {
          result = translations.uz;
          for (const fallbackKey of keys) {
            if (result && typeof result === 'object' && fallbackKey in result) {
              result = result[fallbackKey];
            } else {
              return `[Missing translation: ${key}]`;
            }
          }
          return result;
        }
        return `[Missing translation: ${key}]`;
      }
    }
    
    return typeof result === 'string' ? result : `[Invalid translation: ${key}]`;
  } catch (error) {
    // Fallback to Uzbek on any error
    if (lang !== 'uz') {
      return t(key, 'uz');
    }
    return `[Translation error: ${key}]`;
  }
}

/**
 * Get all available translations for a specific language
 * @param lang - Language code ('uz' or 'ru')
 * @returns Complete translation object for the language
 */
export function getTranslations(lang: SupportedLanguage = 'uz'): BotTranslations {
  const language = lang === 'ru' ? 'ru' : 'uz';
  return translations[language];
}

/**
 * Check if a language is supported
 * @param lang - Language code to check
 * @returns True if language is supported
 */
export function isLanguageSupported(lang: string): lang is SupportedLanguage {
  return lang === 'uz' || lang === 'ru';
}

/**
 * Normalize language code to supported language or default to Uzbek
 * @param lang - Language code to normalize
 * @returns Normalized language code ('uz' or 'ru')
 */
export function normalizeLanguage(lang?: string): SupportedLanguage {
  if (!lang) return 'uz';
  return isLanguageSupported(lang) ? lang : 'uz';
}
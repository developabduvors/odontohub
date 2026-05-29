/**
 * Telegram Mini App language detection utilities
 * Detects user language from Telegram WebApp data and integrates with next-intl
 */

import { normalizeLanguage, isLanguageSupported, type SupportedLanguage } from '@/locales/i18n';

/**
 * Detect language from Telegram WebApp data
 * @returns Detected language code ('uz' or 'ru') with fallback to 'uz'
 */
export function detectTelegramLanguage(): SupportedLanguage {
  try {
    // Check if we're in a Telegram WebApp environment
    if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
      console.log('Not in Telegram WebApp environment, using default language');
      return 'uz';
    }

    const webApp = window.Telegram.WebApp;
    const user = webApp.initDataUnsafe?.user;
    
    if (!user) {
      console.log('No Telegram user data available, using default language');
      return 'uz';
    }

    const telegramLangCode = user.language_code;
    console.log('Detected Telegram language code:', telegramLangCode);

    // Map Telegram language codes to our supported languages
    if (telegramLangCode) {
      // Handle Russian language codes
      if (telegramLangCode === 'ru' || telegramLangCode.startsWith('ru-')) {
        return 'ru';
      }
      
      // Handle Uzbek language codes
      if (telegramLangCode === 'uz' || telegramLangCode.startsWith('uz-')) {
        return 'uz';
      }
      
      // For other languages, check if we support them directly
      if (isLanguageSupported(telegramLangCode)) {
        return telegramLangCode;
      }
    }

    // Default to Uzbek for unsupported languages
    console.log('Unsupported or missing language code, defaulting to Uzbek');
    return 'uz';
  } catch (error) {
    console.error('Error detecting Telegram language:', error);
    return 'uz';
  }
}

/**
 * Get Telegram user information
 * @returns Telegram user data or null if not available
 */
export function getTelegramUser() {
  try {
    if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
      return null;
    }

    return window.Telegram.WebApp.initDataUnsafe?.user || null;
  } catch (error) {
    console.error('Error getting Telegram user:', error);
    return null;
  }
}

/**
 * Get Telegram chat information
 * @returns Telegram chat data or null if not available
 */
export function getTelegramChat() {
  try {
    if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
      return null;
    }

    return window.Telegram.WebApp.initDataUnsafe?.chat || null;
  } catch (error) {
    console.error('Error getting Telegram chat:', error);
    return null;
  }
}

/**
 * Check if the app is running in Telegram WebApp environment
 * @returns True if running in Telegram WebApp
 */
export function isTelegramWebApp(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize Telegram WebApp and return detected language
 * Should be called when the app loads
 * @returns Promise<SupportedLanguage> - Detected language
 */
export function initializeTelegramWebApp(): Promise<SupportedLanguage> {
  return new Promise((resolve) => {
    try {
      if (!isTelegramWebApp()) {
        console.log('Not in Telegram WebApp, using default language');
        resolve('uz');
        return;
      }

      const webApp = window.Telegram!.WebApp!;
      
      // Initialize the WebApp
      if (webApp.ready) {
        webApp.ready();
      }
      
      // Expand the WebApp to full height
      if (webApp.expand) {
        webApp.expand();
      }

      // Detect language
      const detectedLanguage = detectTelegramLanguage();
      
      console.log('Telegram WebApp initialized with language:', detectedLanguage);
      resolve(detectedLanguage);
    } catch (error) {
      console.error('Error initializing Telegram WebApp:', error);
      resolve('uz');
    }
  });
}

/**
 * Get the appropriate locale for next-intl based on Telegram language
 * Maps our supported languages to next-intl locale codes
 * @param telegramLang - Detected Telegram language
 * @returns Locale string for next-intl
 */
export function getTelegramLocale(telegramLang?: SupportedLanguage): string {
  const lang = telegramLang || detectTelegramLanguage();
  
  // Map to next-intl locale codes
  switch (lang) {
    case 'ru':
      return 'ru';
    case 'uz':
    default:
      return 'uz';
  }
}

/**
 * Hook for React components to get Telegram language
 * @returns Object with language detection utilities
 */
export function useTelegramLanguage() {
  const detectLanguage = () => detectTelegramLanguage();
  const getUser = () => getTelegramUser();
  const getChat = () => getTelegramChat();
  const isWebApp = () => isTelegramWebApp();
  
  return {
    detectLanguage,
    getUser,
    getChat,
    isWebApp,
    initializeWebApp: initializeTelegramWebApp,
    getTelegramLocale
  };
}
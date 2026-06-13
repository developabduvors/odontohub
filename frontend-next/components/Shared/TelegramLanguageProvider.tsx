'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { initializeTelegramWebApp, getTelegramLocale, isTelegramWebApp } from '@/lib/telegram-language';
import type { SupportedLanguage } from '@/locales/i18n';

interface TelegramLanguageProviderProps {
  children: React.ReactNode;
  currentLocale: string;
}

/**
 * Whether the app is actually running as a Telegram Mini App.
 *
 * NOTE: the bare presence of `window.Telegram.WebApp` is NOT enough — the
 * `telegram-web-app.js` script (loaded globally in the layout) creates that
 * object in every plain browser too. Only a real Telegram launch populates
 * `initData`. Without this stricter check the provider would treat a normal
 * browser as Telegram, force the locale back to the detected default on every
 * navigation, and make manual language switching impossible.
 */
function inTelegramMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  const initData = window.Telegram?.WebApp?.initData;
  return typeof initData === 'string' && initData.length > 0;
}

/**
 * Provider component that detects Telegram language and redirects to appropriate locale
 * Should be used in the layout to ensure language detection happens early
 */
export function TelegramLanguageProvider({ children, currentLocale }: TelegramLanguageProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    const initializeLanguage = async () => {
      try {
        // Outside a real Telegram Mini App we must never override the locale,
        // otherwise manual language switching in the browser is impossible.
        if (!inTelegramMiniApp()) {
          setIsInitialized(true);
          return;
        }

        // Apply the Telegram language only once per session. After that, respect
        // whatever locale the user manually selected.
        if (sessionStorage.getItem('tg_lang_applied')) {
          setIsInitialized(true);
          return;
        }

        const telegramLanguage = await initializeTelegramWebApp();
        if (!mounted) return;

        sessionStorage.setItem('tg_lang_applied', '1');

        const targetLocale = getTelegramLocale(telegramLanguage);
        if (targetLocale !== currentLocale) {
          const newPathname = pathname.replace(`/${currentLocale}`, `/${targetLocale}`);
          router.replace(newPathname);
          return;
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Telegram language:', error);
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    // Small delay to ensure Telegram WebApp is fully loaded
    const timer = setTimeout(initializeLanguage, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [currentLocale, pathname, router]);

  // Show loading state while initializing (only inside a real Telegram Mini App)
  if (inTelegramMiniApp() && !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">{t('initializing')}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to get current Telegram language detection state
 */
export function useTelegramLanguageState() {
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage | null>(null);
  const [isWebApp, setIsWebApp] = useState(false);

  useEffect(() => {
    setIsWebApp(isTelegramWebApp());
    
    if (isTelegramWebApp()) {
      initializeTelegramWebApp().then(setDetectedLanguage);
    }
  }, []);

  return {
    detectedLanguage,
    isWebApp,
    isInitialized: !isWebApp || detectedLanguage !== null
  };
}
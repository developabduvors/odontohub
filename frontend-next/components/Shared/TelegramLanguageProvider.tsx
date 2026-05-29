'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { initializeTelegramWebApp, getTelegramLocale, isTelegramWebApp } from '@/lib/telegram-language';
import type { SupportedLanguage } from '@/locales/i18n';

interface TelegramLanguageProviderProps {
  children: React.ReactNode;
  currentLocale: string;
}

/**
 * Provider component that detects Telegram language and redirects to appropriate locale
 * Should be used in the layout to ensure language detection happens early
 */
export function TelegramLanguageProvider({ children, currentLocale }: TelegramLanguageProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    const initializeLanguage = async () => {
      try {
        // Only run language detection in Telegram WebApp environment
        if (!isTelegramWebApp()) {
          console.log('Not in Telegram WebApp, skipping language detection');
          setIsInitialized(true);
          return;
        }

        // Initialize Telegram WebApp and detect language
        const telegramLanguage = await initializeTelegramWebApp();
        
        if (!mounted) return;

        setDetectedLanguage(telegramLanguage);
        
        // Get the appropriate locale for next-intl
        const targetLocale = getTelegramLocale(telegramLanguage);
        
        console.log('Language detection result:', {
          telegramLanguage,
          targetLocale,
          currentLocale,
          pathname
        });

        // If detected language differs from current locale, redirect
        if (targetLocale !== currentLocale) {
          console.log(`Redirecting from ${currentLocale} to ${targetLocale}`);
          
          // Replace current locale in pathname with detected locale
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

  // Show loading state while initializing (only in Telegram WebApp)
  if (isTelegramWebApp() && !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Инициализация...</p>
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
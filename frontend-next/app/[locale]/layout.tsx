import type { ReactNode } from 'react';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ReduxProvider } from '@/providers/ReduxProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthInit } from '@/providers/AuthInit';
import { ToastContainer } from '@/components/Shared/Toast';
import { TelegramAuthWrapper } from '@/components/Shared/TelegramAuthWrapper';
import { TelegramLanguageProvider } from '@/components/Shared/TelegramLanguageProvider';
import '../globals.css';

type Locale = (typeof routing.locales)[number];

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TelegramLanguageProvider currentLocale={locale}>
            <ReduxProvider>
              <QueryProvider>
                <TelegramAuthWrapper>
                  <AuthInit>{children}</AuthInit>
                </TelegramAuthWrapper>
                <ToastContainer />
              </QueryProvider>
            </ReduxProvider>
          </TelegramLanguageProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

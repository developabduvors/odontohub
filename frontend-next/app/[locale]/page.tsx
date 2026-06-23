'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import { useRedirectIfAuthed } from '@/hooks/useRedirectIfAuthed';

type Language = 'uz' | 'ru' | 'kz' | 'en';

type LanguageOption = {
  code: Language;
  label: string;
  selectLabel: string;
  subtitle: string;
  nextLabel: string;
};

const languageOptions: LanguageOption[] = [
  {
    code: 'uz',
    label: "O'zbek",
    selectLabel: 'Interfeys tilini tanlang',
    subtitle: 'Raqamli stomatologiya',
    nextLabel: 'Davom etish',
  },
  {
    code: 'ru',
    label: 'Русский',
    selectLabel: 'Выберите язык интерфейса',
    subtitle: 'Цифровая стоматология',
    nextLabel: 'Далее',
  },
  {
    code: 'kz',
    label: 'Қазақ',
    selectLabel: 'Интерфейс тілін таңдаңыз',
    subtitle: 'Цифрлық стоматология',
    nextLabel: 'Әрі қарай',
  },
  {
    code: 'en',
    label: 'English',
    selectLabel: 'Select interface language',
    subtitle: 'Digital dentistry',
    nextLabel: 'Continue',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | ''>('');

  useRedirectIfAuthed(); // qaytgan foydalanuvchini to'g'ri home'ga olib o'tadi

  const activeLanguage = useMemo(
    () =>
      languageOptions.find((language) => language.code === selectedLanguage) ??
      languageOptions[1],
    [selectedLanguage],
  );

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    localStorage.setItem('appLanguage', lang);
    localStorage.setItem('language', lang);
    router.replace(pathname, { locale: lang });
  };

  const handleContinue = () => {
    if (!selectedLanguage) {
      return;
    }
    router.push(paths.role);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#5d6dff] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(109,131,255,0.86),rgba(80,98,238,0.82)_38%,rgba(106,90,225,0.78)_70%,rgba(139,84,214,0.72))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.20),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_30%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[820px] rounded-[40px] border border-white/25 bg-white/10 px-6 py-8 shadow-[0_30px_90px_rgba(39,45,116,0.35)] backdrop-blur-[18px] sm:px-10 sm:py-10">
          <div className="mx-auto flex max-w-[540px] flex-col items-center text-center">
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md sm:h-36 sm:w-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/img/icons/logo-icon1.png"
                alt="GoSmile icon"
                className="h-20 w-20 object-contain brightness-0 invert sm:h-24 sm:w-24"
              />
            </div>

            <h1
              className="text-5xl font-bold tracking-tight !text-white sm:text-7xl"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              GoSmile
            </h1>

            <div className="mt-2 h-px w-44 bg-white/80 sm:w-56" />

            <div
              className={`overflow-hidden transition-all duration-300 ${
                selectedLanguage ? 'mt-3 max-h-20 opacity-100' : 'mt-0 max-h-0 opacity-0'
              }`}
            >
              <p
                className="text-2xl text-white/95 sm:text-[2rem]"
                style={{ fontFamily: '"Great Vibes", cursive' }}
              >
                {activeLanguage.subtitle}
              </p>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                selectedLanguage ? 'mt-12 max-h-20 opacity-100' : 'mt-0 max-h-0 opacity-0'
              }`}
            >
              <p
                className="text-lg font-semibold text-white/92 sm:text-2xl"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                {activeLanguage.selectLabel}
              </p>
            </div>

            <div
              className={`grid w-full max-w-[420px] grid-cols-2 gap-3 sm:gap-4 ${
                selectedLanguage ? 'mt-5' : 'mt-12'
              }`}
            >
              {languageOptions.map((language) => {
                const isSelected = selectedLanguage === language.code;

                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => handleLanguageSelect(language.code)}
                    className={`rounded-full border px-5 py-3 text-lg font-medium transition-all duration-200 sm:text-2xl ${
                      isSelected
                        ? 'border-white bg-white text-[#6070ff] shadow-[0_10px_30px_rgba(255,255,255,0.18)]'
                        : 'border-white/55 bg-white/12 text-white hover:bg-white/18'
                    }`}
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    {language.label}
                  </button>
                );
              })}
            </div>

            <div
              className={`w-full max-w-[420px] overflow-hidden transition-all duration-300 ${
                selectedLanguage ? 'mt-5 max-h-24 opacity-100' : 'mt-0 max-h-0 opacity-0'
              }`}
            >
              <button
                type="button"
                onClick={handleContinue}
                className="w-full rounded-full bg-white px-6 py-3 text-xl font-bold text-[#5667ff] shadow-[0_16px_40px_rgba(30,35,94,0.26)] transition-transform duration-200 hover:-translate-y-0.5 sm:text-4xl"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                {activeLanguage.nextLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

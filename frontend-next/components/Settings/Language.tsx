'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';

const Language = () => {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const changeLanguage = (lang: 'uz' | 'ru' | 'kz' | 'en') => {
        router.replace(pathname, { locale: lang });
    };

    const languages = [
        { id: 'uz' as const, label: "O'zbek tili", icon: '/assets/img/photos/Uzb.png' },
        { id: 'ru' as const, label: 'Русский язык', icon: '/assets/img/photos/Rus.png' },
        { id: 'kz' as const, label: 'Қазақ тілі', icon: '/assets/img/photos/Qaz.png' },
        { id: 'en' as const, label: 'English', icon: '/assets/img/photos/Eng.png' },
    ];

    return (
        <div className="rounded-[28px] border border-[#e6ebff] bg-white p-6 shadow-sm">
            <h4 className="mb-2 text-[20px] font-bold text-[#1A1F36]">
                {t('settings.language_title')}
            </h4>
            <p className="mb-5 text-sm text-[#7a84a8]">
                {t('settings.language_subtitle')}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
                {languages.map((lang) => (
                    <button
                        key={lang.id}
                        type="button"
                        onClick={() => changeLanguage(lang.id)}
                        className={`flex min-h-[64px] items-center gap-3 rounded-2xl border px-4 text-left transition-all duration-200 ${
                            locale === lang.id
                                ? 'border-[#4868FD] bg-[#4868FD] text-white shadow-md'
                                : 'border-[#E6E8EC] bg-white text-[#1A1F36] hover:bg-[#F4F5FA]'
                        }`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={lang.icon} alt={lang.label} className="h-[19px] w-[38px]" />
                        <span className="text-[16px] font-medium">
                            {lang.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Language;

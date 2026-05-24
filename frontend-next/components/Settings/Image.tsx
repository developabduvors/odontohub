'use client';

import { useTranslations } from 'next-intl';

const Image = () => {
  const t = useTranslations();

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-[#e6ebff] bg-white px-6 py-10 text-center shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="h-[100px] w-[100px]" src="/assets/img/icons/Ondevelopment.svg" alt="" />
      <p className="mt-6 text-3xl font-extrabold text-[#635D5D] sm:text-[38px]">{t('settings.in_development')}</p>
    </div>
  );
};

export default Image;

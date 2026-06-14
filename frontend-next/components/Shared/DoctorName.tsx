'use client';

import { useTranslations } from 'next-intl';

interface DoctorNameProps {
    /** Doktorning haqiqiy FIO si (bo'sh bo'lishi mumkin) */
    name?: string | null;
    /** FIO mavjud bo'lganda qo'llaniladigan klasslar (katta sarlavha) */
    className?: string;
    /** FIO yo'q bo'lganda "Yangi doktor" placeholder klasslari (kichikroq, xira) */
    placeholderClassName?: string;
}

// FIO bo'lsa — kattaroq sarlavha; bo'lmasa — kichik "Yangi doktor" yozuvi
export default function DoctorName({ name, className = '', placeholderClassName = '' }: DoctorNameProps) {
    const t = useTranslations('common');
    const real = (name ?? '').trim();

    if (real) return <span className={className}>{real}</span>;
    return <span className={placeholderClassName}>{t('new_doctor')}</span>;
}

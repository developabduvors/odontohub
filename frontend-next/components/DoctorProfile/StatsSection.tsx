'use client';

import { type FC } from 'react';
import { Smile, Star, Calendar, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { useDentistStats } from '@/api/profile';

const StatsSection: FC = () => {
    const t = useTranslations();
    const router = useRouter();
    const { data: stats } = useDentistStats();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col items-center">
                <h3 className="w-full text-left font-bold text-[#1E2532] text-sm mb-6">{t('doctor_profile.total_patients')}</h3>
                <div className="flex-1 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#F5F8FF] rounded-2xl flex items-center justify-center">
                        <Smile className="w-6 h-6 text-[#5B7FFF]" />
                    </div>
                    <span className="text-4xl font-extrabold text-[#1E2532]">{stats?.total_patients || 0}</span>
                </div>
                <button
                    onClick={() => router.push('/patients')}
                    className="w-full mt-8 py-2 bg-[#5B7FFF] text-white rounded-xl text-[11px] font-bold hover:bg-blue-600 transition-all cursor-pointer"
                >
                    {t('sidebar.patients')}
                </button>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col items-center">
                <h3 className="w-full text-left font-bold text-[#1E2532] text-sm mb-6">{t('doctor_profile.ratings')}</h3>
                <div className="flex-1 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                    </div>
                    <span className="text-4xl font-extrabold text-[#1E2532]">{stats?.average_rating || 0}</span>
                </div>
                <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('doctor_profile.from_reviews', { count: stats?.total_reviews || 0 })}</p>
            </div>

            <div className="bg-linear-to-br from-[#27D27F] to-[#00A859] rounded-[24px] p-6 shadow-sm text-white relative flex flex-col overflow-hidden group">
                <h3 className="font-bold text-sm mb-6 relative z-10">{t('doctor_profile.total_appointments')}</h3>
                <div className="flex-1 flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-4xl font-extrabold text-white">{stats?.total_appointments || 0}</span>
                </div>
                <button
                    onClick={() => router.push('/appointments')}
                    className="w-fit mt-6 bg-[#27D27F] text-white px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-2 border border-white/20 relative z-10 hover:bg-emerald-600 transition-all cursor-pointer"
                >
                    {t('doctor_profile.view')}
                    <div className="w-4 h-4 bg-white text-emerald-600 rounded-full flex items-center justify-center">
                        <ArrowRight className="w-2.5 h-2.5 -rotate-45" strokeWidth={3} />
                    </div>
                </button>
                <div className="absolute right-4 bottom-4 flex items-end gap-1.5 h-[60px] opacity-40 group-hover:opacity-60 transition-opacity">
                    {[30, 60, 45, 80, 55, 95, 70, 100].map((h, i) => (
                        <div key={i} className="w-1.5 bg-white rounded-full" style={{ height: `${h}%` }}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatsSection;

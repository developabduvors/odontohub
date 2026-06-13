'use client';

import { useRouter } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface CaseItem {
    id: number;
    title: string;
    description: string;
    beforeImage: string;
    afterImage: string;
}

const DoctorCasesPage = () => {
    const router = useRouter();
    const t = useTranslations();

    // Demo images - in real app, these would come from API
    const [cases] = useState<CaseItem[]>([]);

    return (
        <div className="min-h-screen bg-[#F5F7FF] pb-10">
            <div className="max-w-xl mx-auto w-full flex flex-col min-h-screen">
                <div className="flex items-center justify-between p-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-[#1D1D2B] hover:bg-white/50 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl md:text-2xl font-black text-[#1D1D2B] text-center flex-1 pr-8">
                        {t('patient_pages.cases.title')}
                    </h1>
                </div>

                <div className="flex-1 px-4 space-y-4">
                    {cases.map((caseItem) => (
                        <div
                            key={caseItem.id}
                            className="bg-white rounded-[24px] p-5 shadow-sm"
                        >
                            <h3 className="text-lg font-bold text-[#1D1D2B] mb-3">
                                {caseItem.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {caseItem.description}
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">
                                        {t('patient_pages.cases.before')}
                                    </p>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={caseItem.beforeImage}
                                        alt={t('patient_pages.cases.before_alt')}
                                        className="w-full h-40 object-cover rounded-[16px]"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">
                                        {t('patient_pages.cases.after')}
                                    </p>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={caseItem.afterImage}
                                        alt={t('patient_pages.cases.after_alt')}
                                        className="w-full h-40 object-cover rounded-[16px]"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {cases.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">
                                {t('patient_pages.cases.empty')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorCasesPage;

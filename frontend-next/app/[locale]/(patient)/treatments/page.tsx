'use client';

import { ArrowLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

interface TreatmentDetail {
    name: string;
    price: string;
    dateRange: string;
    status: string;
    appointments: number;
    payment: string;
}

const TreatmentsListPage = () => {
    const router = useRouter();

    // Treatments will be loaded from API in future
    const treatments: TreatmentDetail[] = [];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Завершено":
                return "bg-blue-500/20 text-blue-600";
            case "В процессе":
                return "bg-yellow-500/20 text-yellow-600";
            case "Отменено":
                return "bg-red-500/20 text-red-600";
            default:
                return "bg-gray-500/20 text-gray-600";
        }
    };

    return (
        <div className="min-h-screen  pb-10">
            <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 lg:px-6 pt-6 sm:pt-8 lg:pt-10 space-y-4 sm:space-y-6 lg:space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 sm:p-2.5 lg:p-3 text-blue-900 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
                    >
                        <ArrowLeft size={24} className="sm:size-[28px] lg:size-[32px]" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-blue-900 tracking-tight">Лечения</h1>
                </div>

                {/* Treatments List */}
                <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                    {treatments.map((treatment, idx) => (
                        <div
                            key={idx}
                            className="bg-gray-50 rounded-2xl sm:rounded-3xl lg:rounded-[2rem] p-4 sm:p-6 lg:p-8 border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer group"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4 sm:mb-6 lg:mb-8">
                                <h3 className="text-xl sm:text-2xl lg:text-4xl font-black text-blue-900">{treatment.name}</h3>
                                <p className="text-base sm:text-lg lg:text-2xl font-black text-blue-900">{treatment.price}</p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                                <div>
                                    <p className="text-[10px] sm:text-xs lg:text-sm font-bold text-gray-500 mb-1 sm:mb-2">Промежуток:</p>
                                    <p className="text-xs sm:text-sm lg:text-lg font-bold text-gray-900">{treatment.dateRange}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] sm:text-xs lg:text-sm font-bold text-gray-500 mb-1 sm:mb-2">Статус:</p>
                                    <span className={`inline-block px-2 sm:px-3 lg:px-4 py-0.5 sm:py-1 lg:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs lg:text-sm font-black ${getStatusColor(treatment.status)}`}>
                                        {treatment.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] sm:text-xs lg:text-sm font-bold text-gray-500 mb-1 sm:mb-2">Приёмов:</p>
                                    <p className="text-xs sm:text-sm lg:text-lg font-bold text-gray-900">{treatment.appointments}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] sm:text-xs lg:text-sm font-bold text-gray-500 mb-1 sm:mb-2">Оплата:</p>
                                    <p className="text-xs sm:text-sm lg:text-lg font-bold text-gray-900">{treatment.payment}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TreatmentsListPage;

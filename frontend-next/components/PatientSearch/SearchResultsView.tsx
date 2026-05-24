'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { ChevronLeft, Search, User, Stethoscope, ArrowUpDown } from 'lucide-react';
import { useSearchDoctors, useSearchServices } from '@/api/search';
import DoctorCard from '@/components/Doctors/DoctorCard';
import { paths } from '@/lib/paths';
import type { Doctor } from '@/types/patient';

const DoctorImg = "/assets/img/photos/Dentist.png";

const SearchResultsView = () => {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'doctors' | 'services'>('doctors');
    const [priceOrder, setPriceOrder] = useState<'asc' | 'desc' | null>(null);

    const { data: doctors, isLoading: loadingDocs } = useSearchDoctors(query);
    const { data: services, isLoading: loadingServices } = useSearchServices(query);

    const sortedServices = useMemo(() => {
        if (!services) return [];
        const result = [...services];
        if (priceOrder === 'asc') {
            result.sort((a, b) => a.price - b.price);
        } else if (priceOrder === 'desc') {
            result.sort((a, b) => b.price - a.price);
        }
        return result;
    }, [services, priceOrder]);

    const handleBook = (doctor: Doctor) => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('gosmile:booking_doctor', JSON.stringify(doctor));
        }
        router.push(paths.booking);
    };

    const handleOpenMap = (doctor: Doctor) => {
        // Option 1: Open map modale here if defined
        // Option 2: Just ignore or show alert
        console.log("Open map for", doctor.name);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </button>
                    <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2 gap-2">
                        <Search size={18} className="text-gray-400" />
                        <span className="text-gray-700 font-bold">{query}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex mt-4 bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('doctors')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${
                            activeTab === 'doctors' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                        }`}
                    >
                        <User size={16} />
                        Shifokorlar ({doctors?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${
                            activeTab === 'services' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                        }`}
                    >
                        <Stethoscope size={16} />
                        Xizmatlar ({services?.length || 0})
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {activeTab === 'doctors' ? (
                    <div className="space-y-4">
                        {loadingDocs ? (
                            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
                        ) : doctors && doctors.length > 0 ? (
                            doctors.map((doc: any) => (
                                <DoctorCard
                                    key={doc.id}
                                    doctor={{
                                        ...doc,
                                        name: doc.full_name,
                                        direction: doc.specialization,
                                        experience: `${doc.experience_years} yil tajriba`,
                                        image: DoctorImg
                                    }}
                                    onBook={() => handleBook(doc)}
                                    onOpenMap={() => handleOpenMap(doc)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-bold">Shifokorlar topilmadi</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Service Sort Toggle */}
                        {services && services.length > 0 && (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setPriceOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-bold text-gray-700 shadow-sm border border-gray-100 active:scale-95 transition-all"
                                >
                                    <ArrowUpDown size={16} className="text-blue-500" />
                                    Narx bo'yicha: {priceOrder === 'asc' ? 'Arzon' : priceOrder === 'desc' ? 'Qimmat' : 'Saralash'}
                                </button>
                            </div>
                        )}

                        {loadingServices ? (
                            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
                        ) : sortedServices.length > 0 ? (
                            sortedServices.map(service => (
                                <div key={service.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center group transition-all hover:shadow-md">
                                    <div className="flex-1">
                                        <h3 className="font-black text-blue-900 text-lg group-hover:text-blue-600 transition-colors uppercase tracking-tight">{service.name}</h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-3 py-1 rounded-full text-xs font-bold">
                                                <User size={14} className="text-blue-500" />
                                                <span>{service.dentist_name || "Shifokor"}</span>
                                            </div>
                                            <div className="text-blue-600 font-black text-lg">
                                                {service.price.toLocaleString()} so'm
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.push(paths.doctors)}
                                        className="bg-blue-50 text-blue-600 font-bold px-4 py-2 rounded-2xl text-sm hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                    >
                                        Band qilish
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-bold">Xizmatlar topilmadi</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResultsView;

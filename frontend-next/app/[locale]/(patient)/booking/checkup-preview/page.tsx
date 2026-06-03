'use client';

import { useState, useEffect } from 'react';
import { FaArrowLeft } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import DoctorInfoCard from "@/components/PatientAppointmentDetail/DoctorInfoCard";
import AppointmentDetailsCard from "@/components/PatientAppointmentDetail/AppointmentDetailsCard";
import PriceCard from "@/components/PatientAppointmentDetail/PriceCard";
import ReviewModal from "@/components/PatientAppointmentDetail/ReviewModal";

const DentistImg = "/assets/img/photos/Dentist.png";

const CheckupBookingPreview = () => {
    const router = useRouter();
    const t = useTranslations();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fallbackAppointment = {
        title: t('patient_pages.checkup.fallback_title'),
        date: t('patient_pages.checkup.fallback_date'),
        time: "16:00",
        doctor: {
            name: t('common.doctor'),
            direction: t('patient_pages.checkup.fallback_direction'),
            experience: t('patient_pages.checkup.fallback_experience'),
            rating: "4.7",
            image: DentistImg
        },
        details: {
            status: t('patient_pages.appt_detail.status_completed'),
            date: "25.10.2025",
            duration: `20 ${t('patient_pages.appt_detail.minutes_suffix')}`,
            tip: t('patient_pages.checkup.empty'),
            notes: ""
        },
        price: `20.000 ${t('patient_pages.checkup.currency_sum')}`
    };

    // Read + clear the gosmile:checkup_preview handoff (Vite mock = absent-value fallback)
    const [appointment, setAppointment] = useState<any>(fallbackAppointment);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = sessionStorage.getItem('gosmile:checkup_preview');
        if (raw) {
            try { setAppointment(JSON.parse(raw)); } catch {}
            sessionStorage.removeItem('gosmile:checkup_preview');
        }
    }, []);

    const handleReviewSubmit = (rating: number, comment: string) => {
        console.log("Review Submitted:", { rating, comment });
        // Here you would typically send data to API
        setIsModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8 flex flex-col font-sans max-w-5xl mx-auto w-full relative">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-[#1D1D2B] rounded-full flex items-center justify-center text-white shrink-0"
                >
                    <FaArrowLeft />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-[#1D1D2B] text-2xl font-black leading-tight">
                        {appointment.title}
                    </h1>
                    <p className="text-[#1D1D2B] text-lg font-bold">
                        {appointment.date} | {appointment.time}
                    </p>
                </div>
            </div>

            <div className="space-y-6 pb-12">
                <DoctorInfoCard doctor={appointment.doctor} />
                <AppointmentDetailsCard details={appointment.details} />
                <PriceCard price={appointment.price} />

                {/* Re-implementing the yellow Review button locally since the shared component changed */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-[#FBBC05] text-white text-lg md:text-xl font-bold py-4 rounded-2xl shadow-md hover:bg-[#e0a800] transition-colors"
                >
                    {t('patient_pages.checkup.rate_review')}
                </button>
            </div>

            <ReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleReviewSubmit}
            />
        </div>
    );
};

export default CheckupBookingPreview;

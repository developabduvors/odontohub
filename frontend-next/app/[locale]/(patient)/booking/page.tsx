'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { FaArrowLeft } from "react-icons/fa";
import BookingCalendar from '@/components/Booking/BookingCalendar';
import TimePicker from '@/components/Booking/TimePicker';
import CustomDropdown from '@/components/Booking/CustomDropdown';
import CommentInput from '@/components/Booking/CommentInput';
import { useCreateAppointment } from '@/api/appointments';
import { useAllDentists } from '@/api/profile';
import { useServices } from '@/api/services';
import { toast } from '@/components/Shared/Toast';
import { paths } from '@/lib/paths';
import { getUser } from '@/utils/auth';

const Booking = () => {
    const router = useRouter();
    const t = useTranslations();

    const [preSelectedDoctor, setPreSelectedDoctor] = useState<any>(null);

    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedService, setSelectedService] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedTime, setSelectedTime] = useState("");
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // No patient-side patientId handoff in 3b (doctor-side flow only) — Vite default branch.
    const patientFromState = undefined;

    const { data: dentists = [] } = useAllDentists();
    const { data: servicesData = [] } = useServices(selectedDoctor ? parseInt(selectedDoctor) : undefined);
    const createAppointment = useCreateAppointment();

    const doctors = dentists.map(d => ({
        value: d.id.toString(),
        label: d.full_name
    }));

    const services = servicesData.map(s => ({
        value: s.name,
        label: `${s.name} - ${s.price.toLocaleString()} ${s.currency}`
    }));

    // Read + clear the gosmile:booking_doctor handoff (replaces Vite location.state?.doctor)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = sessionStorage.getItem('gosmile:booking_doctor');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                setPreSelectedDoctor(parsed);
                setSelectedDoctor(parsed?.value || "");
            } catch {}
            sessionStorage.removeItem('gosmile:booking_doctor');
        }
    }, []);

    useEffect(() => {
        if (preSelectedDoctor && doctors.length > 0) {
            // Find doctor by name
            const match = doctors.find(d => d.label === preSelectedDoctor.name);
            if (match) {
                setSelectedDoctor(match.value);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preSelectedDoctor, doctors]);


    const handleBooking = async () => {
        if (!selectedDoctor || !selectedService || !selectedDate || !selectedTime) {
            toast.warning(t("patient.alerts.fill_required_fields"));
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const userData = getUser() || {};

            // API mode - create appointment with backend
            const serviceName = selectedService;
            const selectedServiceData = servicesData.find(s => s.name === selectedService);
            const servicePrice = selectedServiceData?.price || 0;

            const [hours, minutes] = selectedTime.split(':');
            const startDateTime = new Date(selectedDate);
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const endDateTime = new Date(startDateTime);
            endDateTime.setHours(startDateTime.getHours() + 1);

            const targetPatientId = patientFromState || (userData.patient_id as number | undefined);

            if (userData.role === 'dentist' && !targetPatientId) {
                toast.error(t("booking.select_patient"));
                setIsSubmitting(false);
                return;
            }

            await createAppointment.mutateAsync({
                dentist_id: parseInt(selectedDoctor),
                patient_id: targetPatientId || undefined,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                service: serviceName,
                price: servicePrice,
                notes: comment || undefined
            });

            toast.success(t("booking.created"));

            // Hand the booked summary to /booking/checkup-preview (App Router has no router state)
            const selectedDoctorData = dentists.find(d => d.id.toString() === selectedDoctor);
            const previewPayload = {
                title: selectedService || t("booking.default_service"),
                date: `${selectedDate.getDate()} ${t(`common.months.${selectedDate.getMonth()}`)}`,
                time: selectedTime,
                doctor: {
                    name: selectedDoctorData?.full_name || t("booking.default_doctor"),
                    direction: selectedDoctorData?.specialization || t("booking.default_specialty"),
                    experience: selectedDoctorData?.experience_years != null ? `${selectedDoctorData.experience_years} ${t('doctor_profile.experience_suffix')}` : "",
                    rating: selectedDoctorData?.rating != null ? String(selectedDoctorData.rating) : "—",
                    image: "/assets/img/photos/Dentist.png",
                },
                details: {
                    status: t("booking.status_planned"),
                    date: selectedDate.toLocaleDateString('ru-RU'),
                    duration: t("booking.duration_1h"),
                    tip: comment || t("booking.empty"),
                    notes: comment || "",
                },
                price: selectedServiceData ? `${selectedServiceData.price.toLocaleString()} ${selectedServiceData.currency}` : "",
            };
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('gosmile:checkup_preview', JSON.stringify(previewPayload));
            }
            router.push(paths.checkupPreview);
        } catch (error: any) {
            console.error("Error creating appointment:", error);
            const status = error.response?.status;
            const detail = error.response?.data?.detail;
            if (status === 409) {
                toast.error(detail || t("booking.slot_taken"));
            } else {
                toast.error(detail || t("booking.create_error"));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 md:mb-12">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-blue-500 shadow-sm hover:bg-blue-50 transition-all active:scale-95"
                >
                    <FaArrowLeft />
                </button>
                <h1 className="text-2xl md:text-3xl font-black text-[#1D1D2B] tracking-tight">{t('booking.title')}</h1>
                <div className="w-12"></div>
            </div>

            <div className="flex flex-col space-y-6 lg:space-y-8">
                {/* Calendar Section - Full Width, Larger on Desktop */}
                <div className="bg-white rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 shadow-sm border border-gray-100">
                    <h3 className="text-lg lg:text-2xl font-bold mb-6 lg:mb-8 text-[#1D1D2B] flex items-center gap-3">
                        <div className="w-1.5 lg:w-2 h-6 lg:h-8 bg-[#4361EE] rounded-full"></div>
                        {t('booking.select_date_time')}
                    </h3>

                    <div className="mb-8 lg:mb-10">
                        <BookingCalendar
                            selectedDate={selectedDate}
                            onDateChange={setSelectedDate}
                        />
                    </div>

                    <div className="pt-6 lg:pt-8 border-t border-gray-50">
                        <TimePicker
                            selectedTime={selectedTime}
                            onTimeChange={setSelectedTime}
                        />
                    </div>
                </div>

                {/* Two Column Layout for Inputs and Comment */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Left: Doctor & Service Selection */}
                    <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-gray-50 space-y-6 lg:space-y-8">
                        <div className="space-y-4">
                            <label className="text-xs lg:text-sm font-black uppercase text-gray-300 tracking-widest ml-1">{t('booking.dentist')}</label>
                            <CustomDropdown
                                placeholder={t('booking.dentist_ph')}
                                value={selectedDoctor}
                                options={doctors}
                                onChange={(val) => { setSelectedDoctor(val); setSelectedService(""); }}
                                type="doctor"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs lg:text-sm font-black uppercase text-gray-300 tracking-widest ml-1">{t('booking.service')}</label>
                            <CustomDropdown
                                placeholder={t('booking.service_ph')}
                                value={selectedService}
                                options={services}
                                onChange={setSelectedService}
                                type="service"
                            />
                        </div>
                    </div>

                    {/* Right: Comment */}
                    <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-gray-50 space-y-4">
                        <label className="text-xs lg:text-sm font-black uppercase text-gray-300 tracking-widest ml-1">{t('booking.comment')}</label>
                        <CommentInput
                            value={comment}
                            onChange={setComment}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-center mt-8 lg:mt-12 pb-8">
                <button
                    onClick={handleBooking}
                    disabled={isSubmitting}
                    className='w-full max-w-md lg:max-w-xl h-14 lg:h-20 rounded-2xl lg:rounded-3xl bg-[#11D76A] font-black text-lg lg:text-2xl text-center text-white shadow-xl shadow-green-500/20 hover:brightness-105 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {isSubmitting ? t('booking.submitting') : t('patient_pages.book')}
                </button>
            </div>
        </div>
    );
};

export default Booking;

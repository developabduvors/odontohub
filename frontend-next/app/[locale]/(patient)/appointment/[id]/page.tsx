'use client';

import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import DoctorInfoCard from "@/components/PatientAppointmentDetail/DoctorInfoCard";
import AppointmentDetailsCard from "@/components/PatientAppointmentDetail/AppointmentDetailsCard";
import PriceCard from "@/components/PatientAppointmentDetail/PriceCard";
import ReviewButton from "@/components/PatientAppointmentDetail/ReviewButton";
import ComplaintModal from "@/components/Complaints/ComplaintModal";
import { useState } from "react";
import ActionButtons from "@/components/PatientAppointmentDetail/ActionButtons";
import { useAppointment } from "@/api/appointments";
import { useAllDentists } from "@/api/profile";
import { getToken } from "@/utils/auth";
import type { AppointmentDetail } from "@/types/patient";

const DentistImg = "/assets/img/photos/Dentist.png";

const PatientAppointmentDetail = () => {
    const t = useTranslations();
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);

    const { data: appointmentData, isLoading } = useAppointment(parseInt(id || '0'));
    const { data: allDentists = [] } = useAllDentists();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    const accessToken = getToken();
    const isLocalMode = accessToken?.startsWith('local_token_');

    let appointment: AppointmentDetail;
    let isActive = false;
    let statusCode: 'planned' | 'completed' | 'cancelled' = 'planned';
    const statusLabel = (code: 'planned' | 'completed' | 'cancelled') =>
        code === 'completed' ? t('patient_pages.appt_detail.status_completed') :
        code === 'cancelled' ? t('patient_pages.appt_detail.status_cancelled') :
        t('patient_pages.appt_detail.status_planned');

    const defaultService = t('patient_pages.appt_detail.default_service');
    const defaultDoctor = t('patient_pages.appt_detail.default_doctor');
    const defaultDirection = t('patient_pages.appt_detail.default_direction');
    const defaultExperience = t('patient_pages.appt_detail.default_experience');
    const noTip = t('patient_pages.appt_detail.no_tip');
    const noNotes = t('patient_pages.appt_detail.no_notes');
    const minutesSuffix = t('patient_pages.appt_detail.minutes_suffix');
    const notSpecified = t('common.not_specified');

    if (isLocalMode) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const local = appointments.find((a: any) => a.id.toString() === id);
        if (local) {
            const dentist = allDentists.find(d => d.id === local.doctor_id);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const [day, month, year] = local.date.split('.');
            const appDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const isPast = appDate < today;

            isActive = local.status === 'upcoming' && !isPast;
            statusCode = local.status === "upcoming" ? 'planned' : 'completed';
            appointment = {
                title: local.service || defaultService,
                date: local.date,
                time: local.time,
                doctor: {
                    id: local.doctor_id,
                    name: dentist?.full_name || local.doctor_name || '',
                    direction: dentist?.specialization || defaultDirection,
                    experience: defaultExperience,
                    rating: "4.7",
                    image: DentistImg,
                    phone: dentist?.phone || "+998901234567",
                    clinic: dentist?.clinic,
                    address: dentist?.address,
                    telegram: dentist?.telegram,
                    instagram: dentist?.instagram,
                    whatsapp: dentist?.whatsapp,
                    work_hours: dentist?.work_hours,
                },
                details: {
                    status: statusLabel(statusCode),
                    date: local.date,
                    duration: `40 ${minutesSuffix}`,
                    tip: local.comment || noTip,
                    notes: local.comment || noNotes
                },
                price: local.price ? `${local.price.toLocaleString('ru-RU')} UZS` : notSpecified
            };
        } else {
            isActive = false;
            statusCode = 'completed';
            appointment = {
                title: defaultService, date: "", time: "",
                doctor: { name: "", direction: defaultDirection, experience: defaultExperience, rating: "4.7", image: DentistImg, phone: "" },
                details: { status: statusLabel(statusCode), date: "", duration: "", tip: "", notes: "" },
                price: notSpecified
            };
        }
    } else if (appointmentData) {
        const startDate = new Date(appointmentData.start_time);
        const endDate = new Date(appointmentData.end_time);
        const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
        const now = new Date();
        const isPast = endDate < now;
        isActive = (appointmentData.status === "pending" || appointmentData.status === "confirmed") && !isPast;
        statusCode = appointmentData.status === "completed" ? 'completed' :
            appointmentData.status === "cancelled" ? 'cancelled' : 'planned';
        appointment = {
            title: appointmentData.service || defaultService,
            date: startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
            time: startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            doctor: {
                name: appointmentData.dentist_name || '',
                direction: defaultDirection,
                experience: defaultExperience,
                rating: "4.7",
                image: DentistImg,
                phone: "+998901234567"
            },
            details: {
                status: statusLabel(statusCode),
                date: startDate.toLocaleDateString('ru-RU'),
                duration: `${duration} ${minutesSuffix}`,
                tip: appointmentData.notes || noTip,
                notes: appointmentData.notes || noNotes
            },
            price: appointmentData.price ? `${appointmentData.price.toLocaleString('ru-RU')} UZS` : notSpecified
        };
    } else {
        isActive = false;
        statusCode = 'completed';
        appointment = {
            title: defaultService, date: "", time: "",
            doctor: { name: "", direction: defaultDirection, experience: defaultExperience, rating: "4.7", image: DentistImg, phone: "" },
            details: { status: statusLabel(statusCode), date: "", duration: "", tip: "", notes: "" },
            price: notSpecified
        };
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 md:mb-12">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-[#1D1D2B] shadow-sm hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <FaArrowLeft />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-[#1D1D2B] text-2xl md:text-3xl font-black leading-tight">
                            {appointment.title}
                        </h1>
                        <p className="text-gray-400 text-sm md:text-base font-bold">
                            {appointment.date} | {appointment.time}
                        </p>
                    </div>
                </div>
                <div className="hidden md:block">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {isActive ? t('patient_pages.appt_detail.status_upcoming') : appointment.details.status}
                    </span>
                </div>
            </div>

            <div className="flex flex-col space-y-6 lg:space-y-8">
                <div className="transition-transform hover:scale-[1.01]">
                    <DoctorInfoCard doctor={appointment.doctor} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <div>
                        <AppointmentDetailsCard details={appointment.details} />
                    </div>
                    <div className="space-y-6 flex flex-col">
                        <div className="bg-white rounded-4xl lg:rounded-[2.5rem] p-1 shadow-sm border border-gray-50 overflow-hidden">
                            <PriceCard price={appointment.price} service={appointment.title} />
                        </div>
                        <div>
                            {isActive ? (
                                <ActionButtons phone={appointment.doctor.phone} doctorName={appointment.doctor.name || defaultDoctor} />
                            ) : (statusCode === "completed" || (appointmentData && new Date(appointmentData.end_time) < new Date() && appointmentData.status !== "cancelled")) ? (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h3 className="text-2xl font-black text-[#1D1D2B] mb-2 text-center">{t('patient.appointment_detail.rate_quality')}</h3>
                                        <p className="text-gray-400 text-sm font-bold text-center mb-6 px-4">{t('patient.appointment_detail.rate_desc')}</p>
                                        <ReviewButton inline={true} />
                                    </div>
                                    <button
                                        onClick={() => setIsComplaintModalOpen(true)}
                                        className="w-full py-4 rounded-[20px] text-base font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-red-500 bg-white border border-red-100 hover:bg-red-50 shadow-sm"
                                    >
                                        {t('patient.appointment_detail.complain')}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-4xl p-6 text-center border border-gray-100 italic text-gray-400 font-bold">
                                    {statusCode === "cancelled" ? t('patient_pages.appt_detail.cancelled_msg') : t('patient_pages.appt_detail.finished')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ComplaintModal
                isOpen={isComplaintModalOpen}
                onClose={() => setIsComplaintModalOpen(false)}
                dentistId={appointmentData?.dentist_id || appointment.doctor.id || 0}
                dentistName={appointmentData?.dentist_name || appointment.doctor.name || defaultDoctor}
            />
        </div>
    );
};

export default PatientAppointmentDetail;

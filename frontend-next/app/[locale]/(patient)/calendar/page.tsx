'use client';

import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import AppointmentTabs from "@/components/PatientAppointments/AppointmentTabs";
import UpcomingAppointmentCard from "@/components/PatientAppointments/UpcomingAppointmentCard";
import PastAppointmentCard from "@/components/PatientAppointments/PastAppointmentCard";
import { useMyAppointments } from "@/api/appointments";
import type { Appointment as UIAppointment } from "@/types/patient";

const DentistImg = "/assets/img/photos/Dentist.png";

const PatientAppointments = () => {
    const router = useRouter();
    const t = useTranslations();
    const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

    const { data: apiAppointments, isLoading } = useMyAppointments();

    const appointments: UIAppointment[] = useMemo(() => {
        if (!apiAppointments || !Array.isArray(apiAppointments)) return [];

        return apiAppointments.map((app): UIAppointment => {
            const startDate = new Date(app.start_time);
            const endDate = new Date(app.end_time);
            const now = new Date();

            const isPast = endDate < now || app.status === 'completed' || app.status === 'cancelled';

            return {
                id: app.id,
                title: app.service || t('patient_pages.calendar.appointment_default'),
                doctor: app.dentist_name || t('patient_pages.calendar.doctor_default'),
                specialty: t('patient_pages.calendar.specialty'),
                date: startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
                time: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}-${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
                image: DentistImg,
                type: isPast ? 'past' : 'upcoming',
                status: app.status === 'completed' ? 'success' :
                    app.status === 'cancelled' ? 'cancelled' :
                    app.status === 'moved' ? 'rescheduled' :
                    app.status === 'pending' ? 'pending' : 'success',
                statusText: app.status === 'completed' ? t("patient.appointments.success_status") :
                    app.status === 'cancelled' ? t("patient.appointments.cancelled_status") :
                    app.status === 'moved' ? t("patient.appointments.rescheduled_status") :
                    app.status === 'pending' ? (t.has("patient.appointments.pending_status") ? t("patient.appointments.pending_status") : "Kutilmoqda") :
                    t("patient.appointments.success_status"),
                comment: app.cancel_reason || app.notes || undefined,
                commentTitle: t("patient.appointments.comment_label")
            };
        });
    }, [apiAppointments, t]);

    const filteredAppointments = appointments.filter(app => app.type === activeTab);

    return (
        <div className="min-h-screen flex flex-col">
            <div className="px-4 py-6 flex items-center justify-center relative">
                <button
                    onClick={() => router.back()}
                    className="absolute left-4 p-2 bg-gray-900 rounded-full text-white hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{t("patient.appointments.title")}</h1>
            </div>

            <AppointmentTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                    </div>
                ) : filteredAppointments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                        {filteredAppointments.map((app) => (
                            activeTab === "upcoming" ? (
                                <UpcomingAppointmentCard key={app.id} appointment={app} />
                            ) : (
                                <PastAppointmentCard key={app.id} appointment={app} />
                            )
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400 font-bold">
                        {t.has("patient.appointments.empty_list") ? t("patient.appointments.empty_list") : t('patient_pages.calendar.empty')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientAppointments;

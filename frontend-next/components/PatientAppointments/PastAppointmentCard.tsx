'use client';

import { Star } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { paths } from "@/lib/paths";
import type { Appointment } from "@/types/patient";

interface PastAppointmentCardProps {
    appointment: Appointment;
}

const PastAppointmentCard = ({ appointment }: PastAppointmentCardProps) => {
    const router = useRouter();
    const t = useTranslations();

    return (
        <div
            onClick={() => router.push(paths.patientAppointmentDetail.replace(":id", String(appointment.id)))}
            className="bg-blue-600 rounded-3xl sm:rounded-4xl lg:rounded-[2.5rem] p-4 sm:p-6 lg:p-10 flex flex-col justify-between text-white relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300 min-h-[180px] sm:min-h-[220px] lg:min-h-[280px] cursor-pointer"
        >
            <div className="flex justify-between items-start gap-3 sm:gap-4 lg:gap-6">
                <div className="space-y-2 sm:space-y-4 lg:space-y-6 flex-1 min-w-0">
                    <p className="text-xs sm:text-sm lg:text-xl font-medium opacity-90 truncate">{t("patient.appointments.doctor_label")}: {appointment.doctor}</p>
                    <div className="space-y-0.5 sm:space-y-1 lg:space-y-2">
                        <p className="text-xs sm:text-sm lg:text-xl font-medium opacity-90">{t("patient.appointments.date_time_label")}:</p>
                        <p className="text-sm sm:text-base lg:text-2xl font-bold">{appointment.date} | {appointment.time}</p>
                    </div>
                </div>

                {appointment.status === "cancelled" && (
                    <div className="text-right max-w-[140px] sm:max-w-[200px] lg:max-w-[280px]">
                        <p className="text-[10px] sm:text-xs lg:text-lg font-bold opacity-90 line-clamp-1">{appointment.commentTitle}</p>
                        <p className="text-[9px] sm:text-[10px] lg:text-base opacity-80 line-clamp-2">{appointment.comment}</p>
                    </div>
                )}
                {appointment.status === "rescheduled" && (
                    <div className="text-right max-w-[140px] sm:max-w-[200px] lg:max-w-[280px]">
                        <p className="text-[10px] sm:text-xs lg:text-lg font-bold opacity-90 line-clamp-1">{appointment.newDateTitle}</p>
                        <p className="text-[9px] sm:text-[10px] lg:text-base opacity-80 line-clamp-2">{appointment.newDate}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mt-6 sm:mt-8 lg:mt-10">
                <div className="flex items-center gap-1 lg:gap-2">
                    <Star size={16} className="sm:size-[20px] lg:size-[28px]" fill={appointment.status === "success" ? "white" : "none"} />
                    {appointment.rating && <span className="text-xs sm:text-sm lg:text-xl italic opacity-80">{appointment.rating}</span>}
                </div>
                <div className={`px-4 sm:px-6 lg:px-10 py-1.5 sm:py-2 lg:py-3 rounded-xl sm:rounded-2xl lg:rounded-3xl font-bold text-xs sm:text-sm lg:text-xl ${appointment.status === "success" ? "bg-emerald-500" :
                    appointment.status === "cancelled" ? "bg-red-600" :
                        "bg-amber-400 text-gray-900"
                    }`}>
                    {appointment.statusText}
                </div>
            </div>
        </div>
    );
};

export default PastAppointmentCard;

'use client';

import { User, Calendar, Clock } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { paths } from "@/lib/paths";
import type { Appointment } from "@/types/patient";

interface UpcomingAppointmentCardProps {
    appointment: Appointment;
}

const UpcomingAppointmentCard = ({ appointment }: UpcomingAppointmentCardProps) => {
    const router = useRouter();
    const isPending = appointment.status === 'pending';

    return (
        <div
            onClick={() => router.push(paths.patientAppointmentDetail.replace(":id", String(appointment.id)))}
            className={`${isPending ? 'bg-slate-500 shadow-slate-500/20' : 'bg-blue-600 shadow-blue-500/20'} rounded-3xl sm:rounded-4xl lg:rounded-[2.5rem] p-3 sm:p-4 lg:p-6 flex gap-3 sm:gap-4 lg:gap-6 text-white shadow-xl group hover:scale-[1.01] transition-transform duration-300 cursor-pointer relative`}
        >
            {isPending && (
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-amber-400 text-amber-900 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full whitespace-nowrap shadow-sm z-10">
                    {appointment.statusText || 'Kutilmoqda'}
                </div>
            )}
            {/* Doctor Card */}
            <div className="w-24 h-32 sm:w-32 sm:h-40 lg:w-48 lg:h-60 bg-white rounded-2xl sm:rounded-3xl lg:rounded-4xl p-1 lg:p-1.5 shrink-0 overflow-hidden shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={appointment.image}
                    alt={appointment.doctor}
                    className="w-full h-full object-cover rounded-xl sm:rounded-2xl lg:rounded-3xl"
                />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between py-1 lg:py-2 min-w-0">
                <div>
                    <h3 className="text-base sm:text-xl lg:text-3xl xl:text-4xl font-bold leading-tight mb-2 sm:mb-4 lg:mb-6 line-clamp-2">
                        {appointment.title}
                    </h3>

                    <div className="space-y-1 lg:space-y-2">
                        <div className="flex items-start gap-1.5 sm:gap-2 lg:gap-3">
                            <User size={14} className="mt-0.5 sm:mt-1 sm:size-[18px] lg:size-[24px] shrink-0" />
                            <div className="min-w-0">
                                <p className="font-bold text-xs sm:text-sm lg:text-xl xl:text-2xl truncate">{appointment.doctor}</p>
                                <p className="text-[9px] sm:text-[10px] lg:text-sm xl:text-base opacity-80 line-clamp-2">{appointment.specialty}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl lg:rounded-3xl py-1.5 sm:py-2 lg:py-3 px-2 sm:px-3 lg:px-6 flex flex-wrap items-center gap-x-2 sm:gap-x-4 lg:gap-x-6 gap-y-1 sm:gap-y-2 text-[9px] sm:text-[10px] lg:text-base xl:text-lg font-bold border border-white/10">
                    <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                        <Calendar size={10} className="sm:size-[14px] lg:size-[20px]" />
                        <span className="truncate">{appointment.date}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                        <Clock size={10} className="sm:size-[14px] lg:size-[20px]" />
                        <span>{appointment.time}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpcomingAppointmentCard;

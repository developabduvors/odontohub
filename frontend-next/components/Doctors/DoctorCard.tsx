'use client';

import React from 'react';
import { useRouter } from '@/i18n/navigation';
import type { Doctor } from '@/types/patient';
import { paths } from '@/lib/paths';
import { FaMapMarkerAlt } from "react-icons/fa";

interface DoctorCardProps {
    doctor: Doctor;
    onBook: (doctor: Doctor) => void;
    onOpenMap: (doctor: Doctor) => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBook, onOpenMap }) => {
    const router = useRouter();
    const coordinateLikeAddress = typeof doctor.address === 'string'
        ? /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/.test(doctor.address)
        : false;
    const displayAddress = coordinateLikeAddress
        ? (doctor.clinic || 'Тошкент')
        : (doctor.address || doctor.clinic || 'Манзил кўрсатилмаган');

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('gosmile:preview_doctor', JSON.stringify(doctor));
        }
        router.push(paths.myDentist);
    };

    return (
        <div
            onClick={handleCardClick}
            className="relative flex cursor-pointer gap-3 overflow-hidden rounded-[24px] bg-[#4D71F8] p-3 shadow-lg shadow-blue-500/20 transition-shadow hover:shadow-xl sm:gap-4 sm:rounded-[32px] sm:p-4 lg:gap-6 lg:p-6"
        >
            <div className="flex h-[80px] w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-white sm:h-[100px] sm:w-[100px] sm:rounded-[24px] lg:h-[130px] lg:w-[130px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={doctor.image} alt={doctor.name} className="h-full w-full object-cover" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between pr-10 sm:pr-14 lg:pr-20">
                <div>
                    <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-tight text-white sm:text-lg lg:mb-2 lg:text-2xl">{doctor.name}</h3>
                    <p className="mb-0.5 truncate text-[10px] font-medium text-white/90 sm:text-xs lg:text-sm">Направление: {doctor.direction || doctor.specialty}</p>
                    {doctor.experience ? (
                        <p className="mb-2 text-[10px] font-medium text-white/90 sm:mb-3 sm:text-xs lg:text-sm">Опыт: {doctor.experience}</p>
                    ) : null}

                    <div className="mb-2 flex items-center gap-1 sm:mb-3 sm:gap-1.5">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF3B30] sm:h-5 sm:w-5">
                            <FaMapMarkerAlt className="text-[7px] text-white sm:text-[9px]" />
                        </div>
                        <span className="truncate text-[10px] font-bold text-white sm:text-sm">{displayAddress}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onBook(doctor);
                        }}
                        className="self-start rounded-full bg-[#11D76A] px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-[#0fc460] hover:shadow-md active:scale-95 sm:px-6 sm:py-2 sm:text-xs lg:px-10 lg:text-sm"
                    >
                        Записаться
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenMap(doctor);
                        }}
                        className="rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-[10px] font-bold text-white transition-all hover:bg-white/25 sm:px-5 sm:py-2 sm:text-xs lg:text-sm"
                    >
                        На карте
                    </button>
                </div>
            </div>

            <div className="absolute right-2.5 top-2.5 flex min-w-[36px] flex-col items-center justify-center rounded-[10px] bg-[#F8BD00] px-2 py-1 shadow-sm sm:right-4 sm:top-4 sm:min-w-[48px] sm:rounded-[14px] lg:right-6 lg:top-6 lg:min-w-[56px]">
                <div className="flex items-center gap-0.5">
                    <span className="text-[8px] text-white sm:text-[10px]">★</span>
                    <span className="text-[12px] font-black leading-none text-white sm:text-base lg:text-lg">{doctor.rating || '0.0'}</span>
                </div>
                {doctor.review_count !== undefined && (
                    <span className="mt-0.5 whitespace-nowrap text-[7px] font-bold uppercase text-white/80 sm:text-[9px]">
                        {doctor.review_count} sharh
                    </span>
                )}
            </div>
        </div>
    );
};

export default DoctorCard;

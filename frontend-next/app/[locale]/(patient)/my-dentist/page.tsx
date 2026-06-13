'use client';

import { useRouter } from "@/i18n/navigation";
import { ArrowLeft, Video, AlertCircle } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import ComplaintModal from "@/components/Complaints/ComplaintModal";
import { useAllDentists } from "@/api/profile";
import { toast } from "@/components/Shared/Toast";
import { paths } from "@/lib/paths";
import { getUser } from "@/utils/auth";

const DentistImg = "/assets/img/photos/Dentist.png";

const formatDate = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ru-RU");
};

const DoctorProfilePreview = () => {
    const router = useRouter();
    const t = useTranslations();
    const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
    const { data: dentists = [] } = useAllDentists();

    const [doctorFromState, setDoctorFromState] = useState<any>(null);
    const [isDentist, setIsDentist] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = sessionStorage.getItem('gosmile:preview_doctor');
        if (raw) {
            try { setDoctorFromState(JSON.parse(raw)); } catch {}
            sessionStorage.removeItem('gosmile:preview_doctor');
        }
        const userData = getUser() || {};
        setIsDentist(userData.role === 'dentist');
    }, []);

    const doctorData = useMemo(() => {
        const matchedDoctor = doctorFromState?.id
            ? dentists.find((dentist) => dentist.id === doctorFromState.id)
            : undefined;

        const source = matchedDoctor || doctorFromState || {};
        const experienceYears = matchedDoctor?.experience_years ?? doctorFromState?.experience_years ?? null;

        return {
            id: source.id || 0,
            name: source.full_name || source.name || t('patient_pages.dentist.default_name'),
            phone: source.phone || t('patient_pages.dentist.not_specified'),
            gender: source.gender === "male" ? t('patient_pages.dentist.gender_male') : source.gender === "female" ? t('patient_pages.dentist.gender_female') : "",
            birthDate: formatDate(source.birth_date),
            email: source.email || "",
            address: source.address || t('patient_pages.dentist.not_specified'),
            clinic: source.clinic || t('patient_pages.dentist.not_specified'),
            specialty: source.specialization || source.specialty || source.direction || t('patient_pages.dentist.default_specialty'),
            experience: experienceYears != null ? `${experienceYears} ${t('doctor_profile.experience_suffix')}` : "",
            image: source.image || DentistImg,
            telegram: source.telegram || "",
            instagram: source.instagram || "",
            whatsapp: source.whatsapp || "",
            work_hours: source.work_hours || "",
            verification_status: source.verification_status || "",
            diploma_photo_url: source.diploma_photo_url || null,
        };
    }, [dentists, doctorFromState, t]);

    const handleBook = async () => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('gosmile:booking_doctor', JSON.stringify({
                id: doctorData.id,
                name: doctorData.name,
                value: doctorData.id?.toString(),
                phone: doctorData.phone,
                specialty: doctorData.specialty,
                image: doctorData.image
            }));
        }
        router.push(paths.booking);
    };

    return (
        <div className="min-h-screen bg-[#F5F7FF] pb-10">
            <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col">
                <div className="flex items-center justify-between p-6">
                    <button
                        onClick={() => router.back()}
                        className="rounded-full p-2 text-[#1D1D2B] transition-colors hover:bg-white/50"
                    >
                        <ArrowLeft size={24} strokeWidth={2.5} />
                    </button>
                    <h1 className="flex-1 pr-8 text-center text-xl font-black text-[#1D1D2B] md:text-2xl">
                        {t('patient_pages.dentist.title')}
                    </h1>
                </div>

                <div className="flex-1 space-y-4 px-4">
                    <div className="flex flex-col items-center">
                        <div className="mb-4 h-[180px] w-[180px] overflow-hidden rounded-full border-8 border-white shadow-xl md:h-[220px] md:w-[220px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={doctorData.image} alt="Doctor" className="h-full w-full object-cover" />
                        </div>

                        <div className="w-full rounded-[24px] bg-white p-5 shadow-sm">
                            <h2 className="text-xl font-black text-[#1D1D2B]">{doctorData.name}</h2>
                            <p className="mt-1 text-xs font-bold text-gray-400">{doctorData.phone}</p>
                            {doctorData.diploma_photo_url && (
                                <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#11D76A]/20 bg-[#E8F8F0] px-3 py-1.5 text-[#11D76A]">
                                    <span className="text-xs font-black">{t('patient_pages.dentist.diploma_uploaded')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 rounded-[24px] bg-white p-6 shadow-sm">
                        {doctorData.gender && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">{t('patient_pages.dentist.gender')}</p>
                                <p className="mt-1 text-lg font-black text-[#1D1D2B]">{doctorData.gender}</p>
                            </div>
                        )}
                        {doctorData.birthDate && (
                            <div className="pt-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">{t('patient_pages.dentist.birth_date')}</p>
                                <p className="mt-1 text-lg font-black text-[#1D1D2B]">{doctorData.birthDate}</p>
                            </div>
                        )}
                        {doctorData.experience && (
                            <div className="pt-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">{t('patient_pages.dentist.experience')}</p>
                                <p className="mt-1 text-lg font-black text-[#1D1D2B]">{doctorData.experience}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            if (typeof window !== 'undefined') sessionStorage.setItem('gosmile:doctor_services_dentist_id', String(doctorData.id));
                            router.push(paths.doctorServices);
                        }}
                        className="group flex w-full items-center justify-between rounded-[24px] bg-[#4E70FF] px-8 py-5 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                    >
                        <span className="text-xl font-black text-black">{t('patient_pages.dentist.services')}</span>
                        <div className="rounded-lg border-2 border-white bg-black p-1">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </button>

                    <button
                        onClick={() => router.push(paths.doctorCases)}
                        className="group flex w-full items-center justify-between rounded-[24px] bg-[#FFBC00] px-8 py-5 text-white shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                    >
                        <span className="text-xl font-black text-black">{t('patient_pages.dentist.cases')}</span>
                        <div className="rounded-lg border-2 border-white bg-black p-1">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </button>

                    <button
                        onClick={() => toast.info(t('patient.alerts.function_in_development'))}
                        className="group flex w-full items-center justify-between rounded-[24px] bg-[#10B981] px-8 py-5 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                        <span className="text-xl font-black text-white">{t('patient_pages.dentist.online_consult')}</span>
                        <div className="rounded-lg bg-white p-2">
                            <Video size={24} className="text-[#10B981]" />
                        </div>
                    </button>

                    <div className="space-y-5 rounded-[24px] bg-white p-8 shadow-sm">
                        <div className="flex items-start gap-4">
                            <span className="min-w-[70px] whitespace-nowrap pt-1 text-[11px] font-bold text-gray-400">{t('patient_pages.dentist.phone')}</span>
                            <span className="text-[13px] font-bold leading-tight text-[#1D1D2B]">{doctorData.phone}</span>
                        </div>
                        <div className="flex items-start gap-4">
                            <span className="min-w-[70px] whitespace-nowrap pt-1 text-[11px] font-bold text-gray-400">{t('patient_pages.dentist.address')}</span>
                            <span className="text-[13px] font-bold leading-tight text-[#1D1D2B]">{doctorData.address}</span>
                        </div>
                        <div className="flex items-start gap-4">
                            <span className="min-w-[70px] whitespace-nowrap pt-1 text-[11px] font-bold text-gray-400">{t('patient_pages.dentist.clinic')}</span>
                            <span className="text-[13px] font-bold leading-tight text-[#1D1D2B]">{doctorData.clinic}</span>
                        </div>
                        <div className="flex items-start gap-4">
                            <span className="min-w-[70px] whitespace-nowrap pt-1 text-[11px] font-bold text-gray-400">{t('patient_pages.dentist.specialty')}</span>
                            <span className="text-[13px] font-bold leading-tight text-[#1D1D2B]">{doctorData.specialty}</span>
                        </div>
                        {doctorData.work_hours && (
                            <div className="flex items-start gap-4">
                                <span className="min-w-[70px] whitespace-nowrap pt-1 text-[11px] font-bold text-gray-400">{t('patient_pages.dentist.work_hours')}</span>
                                <span className="text-[13px] font-bold leading-tight text-[#1D1D2B]">{doctorData.work_hours}</span>
                            </div>
                        )}
                        {doctorData.telegram && (
                            <div className="flex items-start gap-4">
                                <span className="min-w-[70px] whitespace-nowrap pt-1 text-[11px] font-bold text-gray-400">Telegram</span>
                                <span className="text-[13px] font-bold leading-tight text-[#4361EE]">{doctorData.telegram}</span>
                            </div>
                        )}
                        {doctorData.whatsapp && (
                            <div className="flex items-start gap-4">
                                <span className="min-w-[70px] whitespace-nowrap pt-1 text-[11px] font-bold text-gray-400">WhatsApp</span>
                                <span className="text-[13px] font-bold leading-tight text-[#1D1D2B]">{doctorData.whatsapp}</span>
                            </div>
                        )}
                        {doctorData.instagram && (
                            <div className="flex items-start gap-4">
                                <span className="min-w-[70px] whitespace-nowrap pt-1 text-[11px] font-bold text-gray-400">Instagram</span>
                                <span className="text-[13px] font-bold leading-tight text-[#1D1D2B]">{doctorData.instagram}</span>
                            </div>
                        )}
                    </div>

                    {!isDentist && (
                        <div className="pt-6 pb-12">
                            <button
                                onClick={handleBook}
                                className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-[#11D76A] py-6 text-xl font-black text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/40 active:scale-[0.98]"
                            >
                                {t('patient_pages.book')}
                            </button>
                        </div>
                    )}

                    <div className="pb-12">
                        <button
                            onClick={() => setIsComplaintModalOpen(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-red-50 py-4 text-base font-bold text-red-500 transition-all hover:bg-red-100 active:scale-[0.98]"
                        >
                            <AlertCircle size={20} />
                            {t('patient_pages.dentist.complaint')}
                        </button>
                    </div>
                </div>
            </div>

            <ComplaintModal
                isOpen={isComplaintModalOpen}
                onClose={() => setIsComplaintModalOpen(false)}
                dentistId={doctorData.id}
                dentistName={doctorData.name}
            />
        </div>
    );
};

export default DoctorProfilePreview;

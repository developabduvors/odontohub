'use client';

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser } from "@/store/slices/userSlice";
import { paths } from "@/lib/paths";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Bell, Globe, Shield, HelpCircle, Headphones, Info, ChevronRight, LogOut, Check, X, Camera } from "lucide-react";
import type { Language, MenuItem, SupportItem } from "@/types/patient";
import EditProfileModal from "@/components/Shared/EditProfileModal";
import { usePatientProfile, useUpdatePatient } from "@/api/profile";
import { toast } from "@/components/Shared/Toast";
import { getToken } from "@/utils/auth";

const DentistImg = "/assets/img/photos/Dentist.png";

type PatientProfileState = {
    name: string;
    phone: string;
    gender: string;
    birthDate: string;
    region: string;
    city: string;
    district: string;
    address: string;
    avatar: string;
};

const formatBirthDate = (value: string) => {
    if (!value) return "Не указано";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ru-RU");
};

const PatientProfilePage = () => {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const t = useTranslations();
    const locale = useLocale();
    const user = useAppSelector((state) => state.user.user);
    const { data: patientProfile, isLoading } = usePatientProfile();
    const updatePatient = useUpdatePatient();

    const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userData, setUserData] = useState<PatientProfileState>({
        name: user?.full_name || "Пациент",
        phone: user?.phone || "+998 (90) 123 45 67",
        gender: "Мужчина",
        birthDate: "",
        region: "Ташкент",
        city: "Ташкент",
        district: "Юнусабад",
        address: "г. Ташкент, Юнусабад",
        avatar: DentistImg,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const accessToken = localStorage.getItem("access_token");
        const isLocalMode = accessToken?.startsWith("local_token_");

        if (isLocalMode) {
            const storedUserData = localStorage.getItem("user_data");
            if (storedUserData) {
                const parsedData = JSON.parse(storedUserData);
                setUserData((prev) => ({
                    ...prev,
                    name: parsedData.full_name || prev.name,
                    phone: parsedData.phone || prev.phone,
                }));
            }

            const profileData = localStorage.getItem("patient_profile");
            if (profileData) {
                const parsed = JSON.parse(profileData);
                setUserData((prev) => ({
                    ...prev,
                    ...parsed,
                }));
            }
            return;
        }

        if (patientProfile) {
            setUserData({
                name: patientProfile.full_name || user?.full_name || "Пациент",
                phone: patientProfile.phone || user?.phone || "+998 (90) 123 45 67",
                gender: patientProfile.gender === "male" ? "Мужчина" : patientProfile.gender === "female" ? "Женщина" : "Мужчина",
                birthDate: patientProfile.birth_date ? patientProfile.birth_date.slice(0, 10) : "",
                region: "Ташкент",
                city: "Ташкент",
                district: "Юнусабад",
                address: patientProfile.address || "г. Ташкент, Юнусабад",
                avatar: DentistImg,
            });
        }
    }, [patientProfile, user]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const languages: Language[] = [
        { code: "ru", name: "Русский", flag: "🇷🇺" },
        { code: "uz", name: "O'zbekcha", flag: "🇺🇿" },
        { code: "en", name: "English", flag: "🇺🇸" },
        { code: "kz", name: "Қазақша", flag: "🇰🇿" },
    ];

    const changeLanguage = (code: string) => {
        if (typeof window !== 'undefined') localStorage.setItem("appLanguage", code);
        router.replace(pathname, { locale: code });
        setIsLanguageModalOpen(false);
    };

    const handleSaveProfile = async (newData: Partial<PatientProfileState>) => {
        const updatedData = { ...userData, ...newData };
        setUserData(updatedData);

        const accessToken = getToken();
        const isLocalMode = accessToken?.startsWith("local_token_");

        if (isLocalMode) {
            if (typeof window !== 'undefined') localStorage.setItem("patient_profile", JSON.stringify(updatedData));
            setIsEditModalOpen(false);
            return;
        }

        try {
            if (patientProfile?.id) {
                const gender = newData.gender === "Мужчина" ? "male" : newData.gender === "Женщина" ? "female" : null;

                await updatePatient.mutateAsync({
                    id: patientProfile.id,
                    full_name: newData.name,
                    phone: newData.phone,
                    gender,
                    birth_date: newData.birthDate || null,
                    address: newData.address,
                });

                toast.success("Профиль успешно обновлён!");
            }
            setIsEditModalOpen(false);
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error(error.response?.data?.detail || "Ошибка при обновлении профиля");
        }
    };

    const handleLogout = () => {
        if (typeof window !== 'undefined') localStorage.removeItem("access_token");
        dispatch(clearUser());
        router.replace(paths.login);
    };

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setUserData((prev) => ({ ...prev, avatar: url }));
        }
    };

    const triggerAvatarUpload = () => {
        fileInputRef.current?.click();
    };

    const menuItems: MenuItem[] = [
        { icon: <Bell size={24} />, label: t("patient.profile.notification"), color: "bg-white", textColor: "text-gray-900" },
        {
            icon: <Globe size={24} />,
            label: t("patient.profile.language"),
            onClick: () => setIsLanguageModalOpen(true),
            value: languages.find((l) => l.code === locale)?.name || "Русский",
        },
    ];

    const supportItems: SupportItem[] = [
        { icon: <Shield size={20} />, label: t("settings.support_items.privacy_policy"), path: "#" },
        { icon: <HelpCircle size={20} />, label: t("settings.support_items.faq"), path: "#" },
        { icon: <Headphones size={20} />, label: t("settings.support_items.contact"), path: "#" },
        { icon: <Info size={20} />, label: t("settings.support_items.about"), path: "#" },
    ];

    return (
        <div className="min-h-screen bg-[#F5F7FF]">
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
            )}
            <div className="mx-auto w-full max-w-5xl px-4 md:px-6">
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />

                <div className="relative mb-4 flex items-center justify-between py-8">
                    <button
                        onClick={() => router.back()}
                        className="rounded-2xl border border-gray-100 bg-white p-3 text-[#1D1D2B] shadow-sm transition-all hover:bg-gray-50 active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-black tracking-tight text-[#1D1D2B] md:text-3xl">{t("patient.profile.title")}</h1>
                    <div className="w-12" />
                </div>

                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-4">
                        <div className="flex flex-col items-center rounded-[2.5rem] border border-gray-100 bg-white p-8 text-center shadow-sm">
                            <div className="relative mb-6">
                                <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow-xl md:h-48 md:w-48">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={userData.avatar} alt="Profile" className="h-full w-full object-cover" />
                                </div>
                                <button
                                    onClick={triggerAvatarUpload}
                                    className="absolute bottom-2 right-2 rounded-2xl border-4 border-white bg-[#4361EE] p-3 text-white shadow-lg transition-transform hover:scale-110"
                                >
                                    <Camera size={20} />
                                </button>
                            </div>

                            <h2 className="text-2xl font-black text-[#1D1D2B]">{userData.name}</h2>
                            <p className="mt-1 font-bold text-gray-400">{userData.phone}</p>

                            <div className="mt-8 w-full space-y-4 border-t border-gray-50 pt-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">{t("patient.profile.gender")}</p>
                                        <p className="mt-1 text-sm font-bold text-[#1D1D2B]">
                                            {userData.gender === "Мужчина" ? t("patient.profile.male") : t("patient.profile.female")}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Дата рождения</p>
                                        <p className="mt-1 text-sm font-bold text-[#1D1D2B]">{formatBirthDate(userData.birthDate)}</p>
                                    </div>
                                </div>
                                <div className="pt-2 text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Местоположение</p>
                                    <p className="mt-1 text-sm font-bold text-[#1D1D2B]">{userData.region}, {userData.city}</p>
                                    <p className="mt-0.5 text-xs font-semibold text-gray-500">{userData.district}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="w-full cursor-pointer rounded-[2rem] bg-[#4361EE] py-5 text-lg font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:brightness-105 active:scale-[0.98]"
                            >
                                {t("patient.profile.edit")}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-[2rem] border-2 border-transparent bg-white py-5 text-lg font-black text-[#EA4335] transition-all hover:border-[#EA4335]/10"
                            >
                                <LogOut size={20} />
                                {t("patient.profile.logout")}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8 lg:col-span-8">
                        <div className="space-y-4">
                            <h3 className="ml-6 text-xs font-black uppercase tracking-[0.2em] text-gray-400">{t("patient.profile.settings")}</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
                                {menuItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={item.onClick}
                                        className="group flex cursor-pointer items-center justify-between rounded-[2rem] border border-gray-50 bg-white p-5 shadow-sm transition-all hover:translate-x-1 hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F7FF] text-[#1D1D2B] transition-colors group-hover:bg-[#4361EE] group-hover:text-white">
                                                {item.icon}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-lg font-black text-[#1D1D2B]">{item.label}</span>
                                                {item.value && <span className="text-xs font-bold uppercase tracking-wider text-blue-500">{item.value}</span>}
                                            </div>
                                        </div>
                                        <ChevronRight className="text-gray-300 transition-colors group-hover:text-[#4361EE]" size={24} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="ml-6 text-xs font-black uppercase tracking-[0.2em] text-gray-400">{t("patient.profile.support")}</h3>
                            <div className="rounded-[2.5rem] border border-gray-50 bg-white p-2 shadow-sm">
                                {supportItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`group flex cursor-pointer items-center justify-between rounded-3xl p-5 transition-all hover:bg-gray-50 ${
                                            idx !== supportItems.length - 1 ? "border-b border-gray-50 sm:border-b-0" : ""
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F7FF] text-[#1D1D2B] transition-colors group-hover:text-[#4361EE]">
                                                {item.icon}
                                            </div>
                                            <span className="text-base font-bold text-[#1D1D2B]">{item.label}</span>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300 transition-all group-hover:text-[#4361EE]" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isLanguageModalOpen && (
                <div className="fixed inset-0 z-100 flex items-end justify-center p-4 sm:items-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLanguageModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-md animate-in rounded-[2.5rem] bg-white p-8 slide-in-from-bottom duration-300">
                        <div className="mb-8 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-[#1D1D2B]">{t("patient.profile.select_language")}</h3>
                            <button
                                onClick={() => setIsLanguageModalOpen(false)}
                                className="rounded-full bg-gray-100 p-2 text-gray-400 transition-colors hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={`w-full rounded-3xl border-2 p-5 transition-all ${
                                        locale === lang.code ? "border-[#4361EE] bg-blue-50/50" : "border-gray-50 bg-gray-50/50 hover:border-gray-200"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{lang.flag}</span>
                                            <span className={`text-xl font-black ${locale === lang.code ? "text-[#4361EE]" : "text-[#1D1D2B]"}`}>
                                                {lang.name}
                                            </span>
                                        </div>
                                        {locale === lang.code && (
                                            <div className="rounded-full bg-[#4361EE] p-1 text-white">
                                                <Check size={16} strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={userData}
                onSave={handleSaveProfile}
                avatar={userData.avatar}
                triggerAvatarUpload={triggerAvatarUpload}
            />
        </div>
    );
};

export default PatientProfilePage;

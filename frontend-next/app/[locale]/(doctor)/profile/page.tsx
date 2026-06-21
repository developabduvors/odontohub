'use client';

import { useState, useRef, useEffect, type FC } from 'react';
import { useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';

import type { RootState } from '@/store/store';
import PageHeader from '@/components/DoctorProfile/PageHeader';
import DoctorInfoCard from '@/components/DoctorProfile/DoctorInfoCard';
import ContactInfoCard from '@/components/DoctorProfile/ContactInfoCard';
import StatsSection from '@/components/DoctorProfile/StatsSection';
import ServicesSection from '@/components/DoctorProfile/ServicesSection';
import WorksSection from '@/components/DoctorProfile/WorksSection';
import ScheduleCard from '@/components/DoctorProfile/ScheduleCard';
import SocialNetworksCard from '@/components/DoctorProfile/SocialNetworksCard';
import { useDentistProfile } from '@/api/profile';

interface ProfileData {
    phone: string;
    email: string;
    address: string;
    education: string;
    clinic: string;
    specialization: string;
    telegram: string;
    instagram: string;
    whatsapp: string;
    schedule: string;
    workStart: string;
    startMinute: string;
    workEnd: string;
    endMinute: string;
    gender: string;
    birthDate: string;
    experienceYears: string;
    name: string;
}

const formatDate = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('ru-RU');
};

const DoctorProfilePage: FC = () => {
    const t = useTranslations();
    const user = useSelector((state: RootState) => state.user.user);
    const { data: dentistData } = useDentistProfile();

    const [profileData, setProfileData] = useState<ProfileData>({
        phone: String(user?.phone || '+998 (93) 123 45 67'),
        email: String(user?.email || 'example@gmail.com'),
        address: t('doctor_profile.address_placeholder'),
        education: '',
        clinic: 'OdontoHub',
        specialization: '',
        telegram: '@stom',
        instagram: 'stomatolog.uz',
        whatsapp: String(user?.phone || '+998 90 123 45 67'),
        schedule: t('doctor_profile.every_day'),
        workStart: '08',
        startMinute: '00',
        workEnd: '16',
        endMinute: '00',
        gender: t('patient_profile.male'),
        birthDate: '',
        experienceYears: '',
        name: String(user?.full_name || t('common.doctor')),
    });

    useEffect(() => {
        if (!dentistData) return;

        const workHours = dentistData.work_hours?.split('-') || ['08:00', '16:00'];
        const [startHour, startMinute] = workHours[0]?.split(':') || ['08', '00'];
        const [endHour, endMinute] = workHours[1]?.split(':') || ['16', '00'];

        setProfileData((prev) => ({
            ...prev,
            name: dentistData.full_name || prev.name,
            phone: dentistData.phone || prev.phone,
            specialization: dentistData.specialization || prev.specialization,
            education: dentistData.education || prev.education,
            address: dentistData.address || prev.address,
            clinic: dentistData.clinic || prev.clinic,
            schedule: dentistData.schedule || prev.schedule,
            telegram: dentistData.telegram || prev.telegram,
            instagram: dentistData.instagram || prev.instagram,
            whatsapp: dentistData.whatsapp || prev.whatsapp,
            workStart: startHour,
            startMinute,
            workEnd: endHour,
            endMinute,
            birthDate: formatDate(dentistData.birth_date),
            experienceYears: dentistData.experience_years != null ? `${dentistData.experience_years} ${t('doctor_profile.experience_suffix')}` : '',
            gender: dentistData.gender === 'male'
                ? t('patient_profile.male')
                : dentistData.gender === 'female'
                    ? t('patient_profile.female')
                    : prev.gender,
        }));
    }, [dentistData, t]);

    useEffect(() => {
        if (!user) return;
        setProfileData((prev) => ({
            ...prev,
            name: String(user.full_name || prev.name),
            phone: String(user.phone || prev.phone),
            email: String(user.email || prev.email),
            whatsapp: String(user.phone || prev.whatsapp),
        }));
    }, [user]);

    const [avatarUrl, setAvatarUrl] = useState<string>('/assets/img/photos/Dentist.png');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpdateProfile = (newData: Partial<ProfileData>) => {
        setProfileData((prev) => ({ ...prev, ...newData }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarUrl(URL.createObjectURL(file));
    };

    const triggerAvatarUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="min-h-screen bg-[#F3F6FB]">
            <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6">
                <PageHeader />

                <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                        <div className="lg:col-span-12 xl:col-span-4">
                            <DoctorInfoCard
                                name={profileData.name}
                                specialization={profileData.specialization}
                                gender={profileData.gender}
                                birthDate={profileData.birthDate}
                                experienceYears={profileData.experienceYears}
                                avatar={avatarUrl}
                                onAvatarClick={triggerAvatarUpload}
                            />
                        </div>
                        <div className="lg:col-span-12 xl:col-span-8">
                            <ContactInfoCard data={profileData} onSave={handleUpdateProfile} avatar={avatarUrl} triggerAvatarUpload={triggerAvatarUpload} />
                        </div>
                    </div>

                    <StatsSection />
                    <ServicesSection />
                    <WorksSection />

                    <div className="grid grid-cols-1 gap-6 pb-10 lg:grid-cols-2 lg:gap-8 lg:pb-12">
                        <ScheduleCard
                            workStart={profileData.workStart}
                            startMinute={profileData.startMinute}
                            workEnd={profileData.workEnd}
                            endMinute={profileData.endMinute}
                            onSave={handleUpdateProfile}
                        />
                        <SocialNetworksCard telegram={profileData.telegram} instagram={profileData.instagram} whatsapp={profileData.whatsapp} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorProfilePage;

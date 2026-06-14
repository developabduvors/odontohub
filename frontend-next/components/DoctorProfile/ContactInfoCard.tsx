'use client';

import React, { type FC, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
    Phone,
    Mail,
    MapPin,
    GraduationCap,
    Building2,
} from 'lucide-react';

interface ContactItemProps {
    icon: ReactNode;
    label: string;
    value: string;
}

interface ContactData {
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
}

const ContactItem: FC<ContactItemProps> = ({ icon, label, value }) => (
    <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
            {icon}
        </div>

        <div className="min-w-0 flex-1">
            <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-3 mb-0.5">
                {label}
            </span>
            <p className="text-[10.5px] font-bold text-[#1E2532] leading-3 truncate">
                {value}
            </p>
        </div>
    </div>
);

interface ContactInfoCardProps {
    data: ContactData;
    onSave: (newData: Partial<ContactData>) => void;
    avatar?: string;
    onAvatarChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    triggerAvatarUpload?: () => void;
}

const ContactInfoCard: FC<ContactInfoCardProps> = ({ data }) => {
    const t = useTranslations();

    return (
        <div className="w-full h-full bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <ContactItem
                    icon={<Phone className="w-3.5 h-3.5 text-gray-400" />}
                    label={t('doctor_profile.phone_number')}
                    value={data.phone}
                />
                <ContactItem
                    icon={<Mail className="w-3.5 h-3.5 text-gray-400" />}
                    label={t('doctor_profile.email')}
                    value={data.email}
                />
                <ContactItem
                    icon={<MapPin className="w-3.5 h-3.5 text-gray-400" />}
                    label={t('doctor_profile.address')}
                    value={data.address}
                />
                <ContactItem
                    icon={<GraduationCap className="w-3.5 h-3.5 text-gray-400" />}
                    label={t('doctor_profile.education')}
                    value={data.education || t('common.not_specified')}
                />
                <ContactItem
                    icon={<Building2 className="w-3.5 h-3.5 text-gray-400" />}
                    label={t('doctor_profile.clinic')}
                    value={data.clinic}
                />
            </div>
        </div>
    );
};

export default ContactInfoCard;

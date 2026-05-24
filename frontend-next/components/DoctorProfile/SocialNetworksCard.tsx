'use client';

import { type FC, type ReactNode } from 'react';
import { Send, Phone } from 'lucide-react';
import { FaInstagram, FaFacebook } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

interface SocialLinkProps {
    icon: ReactNode;
    label: string;
}

const SocialLink: FC<SocialLinkProps> = ({ icon, label }) => (
    <div className="flex items-center gap-4 bg-[#F5F7FA] p-2 rounded-[20px] border border-gray-50 hover:border-gray-200 transition-colors">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
            {icon}
        </div>
        <span className="font-bold text-xs text-gray-700 truncate">{label}</span>
    </div>
);

interface SocialNetworksCardProps {
    telegram: string;
    instagram: string;
    whatsapp: string;
}

const SocialNetworksCard: FC<SocialNetworksCardProps> = ({ telegram, instagram, whatsapp }) => {
    const t = useTranslations();
    const socialLinks = [
        { icon: <Send className="w-5 h-5 text-sky-500 fill-sky-500" />, label: telegram },
        { icon: <FaInstagram className="w-5 h-5 text-pink-500" />, label: instagram },
        { icon: <FaFacebook className="w-5 h-5 text-blue-600" />, label: instagram },
    ];

    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50">
            <h3 className="text-2xl font-bold text-[#1E2532] mb-8">{t('doctor_profile.social_networks')}</h3>
            <div className="space-y-4">
                {socialLinks.map((link, i) => (
                    <SocialLink key={i} icon={link.icon} label={link.label} />
                ))}
                <SocialLink
                    icon={<Phone className="w-5 h-5 text-emerald-500" />}
                    label={whatsapp}
                />
            </div>
        </div>
    );
};

export default SocialNetworksCard;

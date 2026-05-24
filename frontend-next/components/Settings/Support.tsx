'use client';

import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

const Support: React.FC = () => {
    const t = useTranslations();
    const [showAboutModal, setShowAboutModal] = useState(false);

    const handleContactSupport = () => {
        window.open('https://t.me/AKBARKHONOV', '_blank');
    };

    const handleItemClick = (index: number) => {
        if (index === 0) {
            handleContactSupport();
        } else if (index === 3) {
            setShowAboutModal(true);
        }
    };

    const items = [
        { icon: '/assets/img/icons/OnlineSupport.svg', label: t('settings.support_items.contact') },
        { icon: '/assets/img/icons/FAQ.svg', label: t('settings.support_items.faq') },
        { icon: '/assets/img/icons/PrivacyPolicy.svg', label: t('settings.support_items.privacy_policy') },
        { icon: '/assets/img/icons/About.svg', label: t('settings.support_items.about') },
    ];

    return (
        <>
            <div className="flex flex-col gap-4">
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => handleItemClick(index)}
                        className="w-full bg-white p-4 rounded-2xl flex items-center gap-4 hover:shadow-sm transition-shadow text-left group"
                    >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-blue-50 transition-colors">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.icon} alt={item.label} className="w-6 h-6" />
                        </div>
                        <span className="text-[#1E2532] font-bold flex-1">{item.label}</span>
                    </button>
                ))}
            </div>

            {showAboutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between rounded-t-3xl">
                            <h2 className="text-2xl font-bold text-[#1E2532]">
                                {t('settings.support_items.about')}
                            </h2>
                            <button
                                onClick={() => setShowAboutModal(false)}
                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p className="text-lg font-semibold text-[#1E2532]">
                                    {t('settings.about.welcome')}
                                </p>

                                <p>
                                    {t('settings.about.beta_notice')}
                                </p>

                                <p>
                                    {t('settings.about.issues_notice')}
                                </p>

                                <p>
                                    {t('settings.about.feedback_request')}{' '}
                                    <button
                                        onClick={handleContactSupport}
                                        className="text-blue-600 hover:text-blue-700 font-semibold underline inline-flex items-center gap-1"
                                    >
                                        {t('settings.about.support_link')}
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                </p>

                                <p className="text-sm text-gray-600 italic">
                                    {t('settings.about.thanks')}
                                </p>
                            </div>

                            <button
                                onClick={handleContactSupport}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-5 h-5" />
                                {t('settings.support_items.contact')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Support;

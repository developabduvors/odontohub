'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

export const NotificationSettings: React.FC = () => {
    const t = useTranslations();
    const [news, setNews] = useState(false);
    const [newAppt, setNewAppt] = useState(true);
    const [apptChanges, setApptChanges] = useState(true);
    const [sms, setSms] = useState(true);
    const [telegram, setTelegram] = useState(true);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-6">
                <button
                    onClick={() => setNews(!news)}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${news ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${news ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <div>
                    <h3 className="text-lg font-bold text-[#1E2532]">{t('settings.notifications.news_title')}</h3>
                    <p className="text-sm text-gray-500">{t('settings.notifications.news_desc')}</p>
                </div>
            </div>
            <hr className="border-gray-200" />

            <div className="flex items-center gap-6">
                <button
                    onClick={() => setNewAppt(!newAppt)}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${newAppt ? 'bg-blue-600' : 'bg-gray-400'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${newAppt ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <div>
                    <h3 className="text-lg font-bold text-[#1E2532]">{t('settings.notifications.new_appt_title')}</h3>
                    <p className="text-sm text-gray-500">{t('settings.notifications.new_appt_desc')}</p>
                </div>
            </div>
            <hr className="border-gray-200" />

            <div className="flex items-center gap-6">
                <button
                    onClick={() => setApptChanges(!apptChanges)}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${apptChanges ? 'bg-blue-600' : 'bg-gray-400'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${apptChanges ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <div>
                    <h3 className="text-lg font-bold text-[#1E2532]">{t('settings.notifications.appt_changes_title')}</h3>
                    <p className="text-sm text-gray-500">{t('settings.notifications.appt_changes_desc')}</p>
                </div>
            </div>
            <hr className="border-gray-200" />

            <div className="flex items-center gap-6">
                <button
                    onClick={() => setSms(!sms)}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${sms ? 'bg-blue-600' : 'bg-gray-400'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${sms ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <div>
                    <h3 className="text-lg font-bold text-[#1E2532]">{t('settings.notifications.sms_label')}</h3>
                </div>
            </div>
            <hr className="border-gray-200" />

            <div className="flex items-center gap-6">
                <button
                    onClick={() => setTelegram(!telegram)}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${telegram ? 'bg-blue-600' : 'bg-gray-400'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${telegram ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <div>
                    <h3 className="text-lg font-bold text-[#1E2532]">{t('settings.notifications.telegram_label')}</h3>
                </div>
            </div>
        </div>
    );
};

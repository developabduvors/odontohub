'use client';

import React from 'react';

interface SettingsTabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    tabs: string[];
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({ activeTab, setActiveTab, tabs }) => {
    return (
        <div className="mb-8 flex max-w-full gap-2 overflow-x-auto rounded-[28px] border border-[#e4e8fb] bg-[#f5f7ff] p-2 sm:mb-10">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`shrink-0 whitespace-nowrap rounded-[20px] px-4 py-3 text-sm font-bold transition-all sm:px-6 ${
                        activeTab === tab
                            ? 'bg-[linear-gradient(135deg,#6d83ff_0%,#5667ff_100%)] text-white shadow-[0_14px_30px_rgba(86,103,255,0.22)]'
                            : 'text-[#65709a] hover:bg-white hover:text-[#24304e]'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};

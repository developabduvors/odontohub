'use client';

import { useTranslations } from "next-intl";

interface AppointmentTabsProps {
    activeTab: "upcoming" | "past";
    onTabChange: (tab: "upcoming" | "past") => void;
}

const AppointmentTabs = ({ activeTab, onTabChange }: AppointmentTabsProps) => {
    const t = useTranslations();

    return (
        <div className="border-gray-200">
            <div className="flex max-w-2xl mx-auto px-3 sm:px-4">
                <button
                    onClick={() => onTabChange("upcoming")}
                    className={`flex-1 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-bold transition-all relative ${activeTab === "upcoming" ? "text-gray-900" : "text-gray-400"
                        }`}
                >
                    {t("patient.appointments.upcoming_tab")}
                    {activeTab === "upcoming" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gray-900 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => onTabChange("past")}
                    className={`flex-1 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-bold transition-all relative ${activeTab === "past" ? "text-gray-900" : "text-gray-400"
                        }`}
                >
                    {t("patient.appointments.past_tab")}
                    {activeTab === "past" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gray-900 rounded-t-full" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default AppointmentTabs;

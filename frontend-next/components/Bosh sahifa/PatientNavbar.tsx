'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Calendar, FileText, Home, MessageSquare, User } from 'lucide-react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { getUnreadCount } from '@/api/notifications';
import { paths } from '@/lib/paths';

export default function PatientNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getUnreadCount().then(setUnread).catch(() => {});
    const interval = setInterval(() => {
      getUnreadCount().then(setUnread).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { icon: <Home size={24} />, path: paths.patientHome, label: t('patient.navbar.home') },
    { icon: <Calendar size={24} />, path: paths.patientCalendar, label: t('patient.navbar.appointments') },
    { icon: <MessageSquare size={24} />, path: paths.patientChats, label: t('patient.navbar.chats') },
    { icon: <FileText size={24} />, path: paths.patientHistory, label: t('patient_profile.tabs.medcard') },
    { icon: <User size={24} />, path: paths.patientProfileSettings, label: t('patient.navbar.profile') },
    {
      icon: (
        <div className="relative">
          <Bell size={24} />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      ),
      path: paths.patientNotifications,
      label: 'Bildirishnomalar',
    },
  ];

  return (
    <>
      <nav className="app-panel fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around rounded-[28px] border border-white/60 px-4 py-2 sm:hidden">
        {navItems.map((item, index) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={index}
              onClick={() => router.push(item.path)}
              className={`font-railway flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-[#5667ff]' : 'text-[#7f8ab4]'
              }`}
            >
              <div className={`rounded-xl p-2 transition-all ${isActive ? 'bg-[#eef1ff] text-[#5667ff]' : ''}`}>
                {item.icon}
              </div>
              {isActive && <span className="text-[10px] font-semibold">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <aside className="fixed left-0 top-0 bottom-0 z-50 hidden bg-transparent p-4 sm:flex sm:w-24 lg:w-72">
        <div className="app-panel flex h-full w-full flex-col rounded-[32px] border border-white/70 py-8">
          <div className="mb-10 hidden px-6 lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/img/icons/logo-icon1.png" alt="GoSmile" />
          </div>
          <div className="flex justify-center mb-10 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/img/icons/logo-icon1.png" alt="GoSmile" className="h-11 w-11 object-contain" />
          </div>
          <div className="space-y-4 px-4 lg:px-6">
            {navItems.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={index}
                  onClick={() => router.push(item.path)}
                  className={`group flex w-full items-center gap-4 rounded-2xl p-3 transition-all duration-300 lg:px-4 ${
                    isActive
                      ? 'bg-[linear-gradient(135deg,#6679ff_0%,#5667ff_100%)] text-white shadow-[0_16px_34px_rgba(86,103,255,0.28)]'
                      : 'text-[#7280aa] hover:bg-white/70'
                  }`}
                >
                  <div className={isActive ? 'text-white' : 'transition-colors group-hover:text-[#5667ff]'}>
                    {item.icon}
                  </div>
                  <span className="hidden font-railway text-sm font-bold lg:block lg:text-base">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}

'use client';

import React, { useEffect, useState } from "react";
import { Bell, Calendar, LayoutDashboard, Menu, MessageCircle, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { useMyAppointments } from "@/api/appointments";
import { useUnreadCount } from "@/api/notifications";
import { useAllPatients } from "@/api/profile";
import { paths } from "@/lib/paths";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  path: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const t = useTranslations();

  const { data: appointments } = useMyAppointments();
  const { data: patients } = useAllPatients();
  const { data: unreadCount = 0 } = useUnreadCount();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = appointments?.filter((apt: any) => {
    const aptDate = new Date(apt.start_time);
    return aptDate >= today && aptDate < tomorrow;
  }).length || 0;

  const newPatientsToday = patients?.filter((patient: any) => {
    if (!patient.created_at) return false;
    const createdDate = new Date(patient.created_at);
    createdDate.setHours(0, 0, 0, 0);
    return createdDate.getTime() === today.getTime();
  }).length || 0;

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: t("sidebar.dashboard"), icon: LayoutDashboard, path: paths.menu },
    { id: "patients", label: t("sidebar.patients"), icon: Users, path: paths.patient },
    { id: "appointments", label: t("sidebar.appointments"), icon: Calendar, path: paths.appointments },
    { id: "chats", label: t("sidebar.chats"), icon: MessageCircle, path: paths.chats },
    { id: "notifications", label: t("sidebar.notifications"), icon: Bell, path: paths.notifications },
  ];

  const SidebarInner = ({ isDrawer = false }: { isDrawer?: boolean }) => (
    <div className="app-panel flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] bg-transparent font-railway">
      <div className="flex items-center justify-between border-b border-white/50 bg-transparent px-5 pb-3 pt-1 sm:px-6 sm:pb-4 sm:pt-2">
        <Link href={paths.menu} className="flex items-center gap-3 self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/img/icons/logo1.png" alt="GoSmile" className="h-auto w-[150px] sm:w-[160px]" />
        </Link>
        {isDrawer && (
          <button
            className="rounded-full p-2 text-[#44507e] transition-colors hover:bg-white/60"
            onClick={() => setIsMobileOpen(false)}
            aria-label={t("common.close")}
          >
            <X size={24} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-2 px-4 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.id === "chats" && pathname.startsWith("/chats"));

          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={() => {
                if (isDrawer) setIsMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                isActive
                  ? "bg-[linear-gradient(135deg,#6679ff_0%,#5667ff_100%)] text-white shadow-[0_12px_30px_rgba(86,103,255,0.28)]"
                  : "text-[#42507f] hover:bg-white/70"
              }`}
            >
              <div className="relative shrink-0">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2.1} />
                {item.id === "notifications" && unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-black text-white shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[15px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 mb-4 mt-3 shrink-0 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#6577ff_0%,#8b7cf6_100%)] p-5 text-white shadow-[0_24px_50px_rgba(90,96,195,0.28)]">
        <div className="relative z-10 text-center">
          <h3 className="mb-4 font-space text-lg font-bold">{t("sidebar.focus_title")}</h3>
          <div className="space-y-1.5 text-base font-semibold">
            <p>{todayAppointments} {todayAppointments === 1 ? t("sidebar.focus_appointment_single") : t("sidebar.focus_appointments_plural")}</p>
            <p>{newPatientsToday} {newPatientsToday === 1 ? t("sidebar.focus_new_patient_single") : t("sidebar.focus_new_patients_plural")}</p>
          </div>
          <Link href={paths.analytics}>
            <button className="mt-5 w-full rounded-2xl bg-white py-3 font-space font-bold text-[#5667ff] transition-colors hover:bg-gray-100">
              {t("sidebar.analytics")}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden bg-transparent lg:sticky lg:top-4 lg:flex lg:h-[calc(100vh-32px)] lg:w-[280px] lg:shrink-0 lg:self-start">
        <SidebarInner />
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/40 bg-white/70 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href={paths.menu} className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/img/icons/logo1.png" alt="GoSmile" className="h-9 w-auto" />
          </Link>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-[#42507f] shadow-sm transition-colors hover:bg-white"
            aria-label={t("common.menu")}
          >
            <Menu size={24} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-[#1f2758]/35 backdrop-blur-sm transition-opacity duration-300 ${isMobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMobileOpen(false)}
        />

        <aside
          className={`absolute inset-y-0 left-0 h-full w-[85vw] max-w-xs bg-transparent p-3 shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarInner isDrawer />
        </aside>
      </div>
    </>
  );
}

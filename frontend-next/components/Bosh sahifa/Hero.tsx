'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Star, MessageSquare } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import type { RootState } from '@/store/store';
import { getUnreadCount, getNotifications, markAsRead } from '@/api/notifications';
import { useDentistStats, useDentistProfile } from '@/api/profile';
import { useDentistReviews } from '@/api/reviews';
import type { Notification as NotifType } from '@/api/notifications';

interface HeroProps {
  onSearch?: (query: string) => void;
}
const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  const t = useTranslations();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.user);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [unread, setUnread] = useState(0);
  const [notifList, setNotifList] = useState<NotifType[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const ratingModalRef = useRef<HTMLDivElement>(null);

  const { data: stats } = useDentistStats();
  const { data: dentistProfile } = useDentistProfile();
  // Header avatari jinsga mos default foto bilan (foydalanuvchi rasm yuklamasa).
  const dentistAvatar = dentistProfile?.gender === 'female'
    ? '/assets/img/photos/DentistFemale.jpg'
    : '/assets/img/photos/Dentist.png';
  const u = user as { dentist_profile?: { id?: number }; dentist_id?: number; id?: number } | null;
  const dentistId = dentistProfile?.id || u?.dentist_profile?.id || u?.dentist_id || u?.id;
  const { data: reviewsData, isLoading: reviewsLoading } = useDentistReviews(dentistId);

  const typeLabels: Record<string, string> = {
    appointment_confirmed: 'Qabul tasdiqlandi',
    appointment_cancelled: 'Bekor qilindi',
    appointment_reminder: 'Eslatma',
    review_received: 'Yangi baho',
    system_message: 'Tizim',
  };

  const formatTime = (d: string) => {
    const utcString = d.endsWith('Z') || d.includes('+') ? d : d + 'Z';
    // eslint-disable-next-line react-hooks/purity -- nisbiy vaqt joriy soatga bog'liq, ataylab
    const diff = Date.now() - new Date(utcString).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Hozir';
    if (m < 60) return `${m} daqiqa oldin`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} soat oldin`;
    return `${Math.floor(h / 24)} kun oldin`;
  };

  const handleNotifClick = async (n: NotifType) => {
    if (!n.is_read) {
      await markAsRead(n.id).catch(() => {});
      setNotifList(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setUnread(prev => Math.max(0, prev - 1));
    }
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
      if (ratingModalRef.current && !ratingModalRef.current.contains(e.target as Node)) setIsRatingModalOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (isNotifOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ochilganda yuklash holatini ko'rsatish
      setNotifLoading(true);
      getNotifications().then(data => { setNotifList(data.slice(0, 10)); setNotifLoading(false); }).catch(() => setNotifLoading(false));
    }
  }, [isNotifOpen]);

  useEffect(() => {
    getUnreadCount().then(setUnread).catch(() => {});
    const interval = setInterval(() => getUnreadCount().then(setUnread).catch(() => {}), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onSearch) onSearch(value);
  };

  return (
    <>
      <header className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-6">
            <div className="relative w-full min-w-0 xl:flex-1 xl:max-w-[600px]">
              <input
                value={searchValue}
                onChange={handleSearch}
                placeholder={t('dashboard.search_placeholder')}
                className="w-full h-11 pl-10 sm:pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm"
              />
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-500" />
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2.5 sm:gap-3 xl:w-auto xl:flex-nowrap xl:gap-5">
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="flex h-11 flex-1 min-w-[140px] px-4 sm:px-7 items-center justify-center gap-3 sm:gap-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 xl:flex-none xl:min-w-[180px] xl:justify-start"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/img/icons/Star.svg" alt="" className="w-4 h-4 sm:w-5 sm:h-5 brightness-0 invert shrink-0" />
                <div className="flex min-w-0 flex-col items-start leading-none gap-0.5">
                  <span className="font-black text-lg sm:text-xl">{stats?.average_rating || '0.0'}</span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold opacity-80 whitespace-nowrap">{stats?.total_reviews || 0} ta sharh</span>
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-2.5 sm:gap-3 xl:gap-5">
              <div className="relative" ref={notifRef}>
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="w-11 h-11 p-2.5 rounded-xl border border-gray-200 transition-all flex items-center justify-center hover:bg-gray-50 bg-white relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/img/icons/Notification.svg" alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[9px] sm:text-[10px] font-black rounded-full flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
                {isNotifOpen && (
                  <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 mt-3 sm:w-[380px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">Bildirishnomalar</h3>
                      {unread > 0 && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{unread} yangi</span>}
                    </div>
                    <div className="max-h-[320px] sm:max-h-[360px] overflow-y-auto custom-scrollbar">
                      {notifLoading ? <div className="py-8 text-center text-gray-400 text-sm italic">Yuklanmoqda...</div> : notifList.length === 0 ? <div className="py-8 text-center text-gray-400 text-sm">Bildirishnomalar yo&apos;q</div> :
                        notifList.map(n => (
                        <div key={n.id} onClick={() => handleNotifClick(n)} className={`px-4 sm:px-5 py-3 sm:py-3.5 flex gap-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${n.type === 'review_received' ? 'bg-amber-400' : 'bg-[#5377f7]'}`}>
                            {n.type === 'review_received' ? <Star size={14} className="text-white" /> : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src="/assets/img/icons/Notification.svg" alt="" className="w-3.5 h-3.5 sm:w-4 sm:h-4 brightness-0 invert" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <span className={`text-[10px] font-bold uppercase ${n.type === 'review_received' ? 'text-amber-500' : 'text-[#5377f7]'}`}>{typeLabels[n.type] || n.type}</span>
                              <span className="text-[10px] text-gray-400 font-medium">{formatTime(n.created_at)}</span>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{n.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{n.message}</p>
                          </div>
                          {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { router.push(paths.notifications); setIsNotifOpen(false); }} className="w-full py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100">Hammasini ko&apos;rish</button>
                  </div>
                )}
              </div>

              <Link href={paths.settings} className="w-11 h-11 p-2.5 border border-gray-200 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70 bg-white shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/img/icons/Settings.svg" alt="" className="w-[18px] h-[18px] opacity-70" />
              </Link>

              <Link href={user?.role === 'dentist' ? paths.profile : paths.patientProfileSettings} className="flex h-11 shrink-0 items-center gap-2.5 rounded-2xl bg-gray-900 pl-2.5 pr-2.5 text-white shadow-lg shadow-gray-200 transition-all hover:bg-gray-800 active:scale-95 sm:gap-3 sm:pr-5">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-xl border border-gray-700 sm:h-9 sm:w-9">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dentistAvatar} alt="Profile" className="h-full w-full object-cover" />
                </div>
                <div className="hidden min-w-0 flex-col leading-tight sm:flex">
                  <span className="max-w-[110px] truncate text-xs font-bold">{String(user?.full_name || 'Shifokor')}</span>
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">Boshqaruv</span>
                </div>
              </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isRatingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-3 sm:p-4">
          <div ref={ratingModalRef} className="bg-white rounded-2xl sm:rounded-[32px] w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-white shadow-xl shadow-blue-500/30 shrink-0">
                  <span className="text-xl sm:text-3xl font-black">{stats?.average_rating || '0.0'}</span>
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase opacity-80 italic">O&apos;rtacha</span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-black text-gray-900">Bemorlar fikri</h3>
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">Jami {stats?.total_reviews || 0} ta baho qoldirilgan</p>
                </div>
              </div>
              <button onClick={() => setIsRatingModalOpen(false)} className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 border border-gray-100 transition-all hover:rotate-90 shrink-0">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 custom-scrollbar bg-white">
              {reviewsLoading ? (
                <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" /></div>
              ) : !reviewsData?.reviews?.length ? (
                <div className="py-20 text-center text-gray-400">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="font-bold italic">Hali sharhlar mavjud emas</p>
                </div>
              ) : (
                reviewsData.reviews.map(review => (
                  <div key={review.id} className="p-4 sm:p-5 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100/50 transition-all hover:bg-white hover:shadow-md group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-black text-gray-900 mb-0.5 text-sm sm:text-base">{review.patient_name || 'Bemor'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-0.5 px-3 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs font-black text-gray-900 ml-1">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed italic">
                      &quot;{review.comment || 'Izoh qoldirilmagan'}&quot;
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 flex justify-center">
              <button onClick={() => setIsRatingModalOpen(false)} className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gray-900 text-white rounded-xl sm:rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg text-sm sm:text-base">Tushunarli</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default Hero;


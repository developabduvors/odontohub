'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';

export default function SearchBar() {
  const t = useTranslations();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.full_name || '');
    }
  }, []);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {userName && (
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-blue-900">
            {t('patient.home.greeting', { name: userName })} 👋
          </h1>
          <p className="text-sm sm:text-base lg:text-xl text-gray-500 mt-1 sm:mt-2 font-semibold">
            {t('patient.home.greeting_subtitle')}
          </p>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto w-full">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('patient.home.search')}
          className="w-full bg-white border-none rounded-full py-4 sm:py-5 lg:py-6 pl-12 sm:pl-14 lg:pl-16 pr-14 sm:pr-16 text-base sm:text-lg lg:text-xl font-bold text-gray-700 shadow-xl shadow-blue-500/5 focus:ring-2 focus:ring-blue-500/20 outline-none"
        />
        <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
        {query.trim().length > 0 && (
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#4D71F8] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-full text-sm transition-all active:scale-95 shadow-md"
          >
            Izla
          </button>
        )}
      </div>
    </div>
  );
}

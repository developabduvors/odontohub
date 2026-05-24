'use client';

import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useAllPatients } from '@/api/profile';

interface PatientSearchProps {
  searchQuery: string;
}

export default function PatientSearch({ searchQuery }: PatientSearchProps) {
  const { data: patients, isLoading } = useAllPatients();

  const filteredPatients = useMemo(() => {
    if (!searchQuery || !patients || !Array.isArray(patients)) return [];

    const query = searchQuery.toLowerCase();
    return patients.filter((p: any) =>
      p.full_name?.toLowerCase().includes(query) ||
      p.phone?.includes(query) ||
      p.source?.toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  if (!searchQuery) return null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 shadow-sm">
        <div className="flex items-center justify-center py-6 sm:py-8">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (filteredPatients.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Результаты поиска</h2>
        <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
          Пациенты не найдены по запросу &quot;{searchQuery}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 shadow-sm">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        Результаты поиска
        <span className="bg-black text-white text-xs sm:text-sm px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-semibold">
          {filteredPatients.length}
        </span>
      </h2>

      <div className="space-y-3 sm:space-y-4">
        {filteredPatients.map((patient: any) => (
          <Link
            key={patient.id}
            href={`/patients/${patient.id}`}
            className="block bg-gray-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-xl shrink-0">
                {patient.full_name?.charAt(0) || 'П'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                  {patient.full_name || 'Без имени'}
                </p>
                <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                  {patient.phone && (
                    <p className="truncate">📱 {patient.phone}</p>
                  )}
                  {patient.source && (
                    <p className="truncate">📋 {patient.source}</p>
                  )}
                  {patient.birth_date && (
                    <p>🎂 {new Date(patient.birth_date).toLocaleDateString('ru-RU')}</p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

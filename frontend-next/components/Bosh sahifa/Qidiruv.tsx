'use client';

import { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import AddPatientModal from '@/components/Patients/AddPatientModal';

interface FilterState {
  status: string;
  minAge: string;
  maxAge: string;
}

interface Props {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onAdd: (data: { name: string; phone: string; diagnosis: string }) => void;
  onApplyFilter: (filters: FilterState) => void;
}

export default function Qidiruv({ searchQuery, setSearchQuery, onApplyFilter }: Props) {
  const t = useTranslations();
  const [showFilter, setShowFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const handleApply = () => {
    onApplyFilter({
      status: selectedStatus,
      minAge,
      maxAge
    });
    setShowFilter(false);
  };

  return (
    <div className="w-full mb-4 sm:mb-6">
      <div className="flex flex-row items-center gap-2 sm:gap-4 bg-white rounded-2xl px-2 sm:px-4 py-2 sm:py-3 shadow-sm relative">
        <div className="flex items-center flex-1 gap-1.5 sm:gap-2">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder={t('dashboard.qidiruv.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-xs sm:text-base py-1"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors bg-gray-900 hover:bg-gray-800 text-white shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="relative shrink-0">
            <button
              onClick={() => {
                setShowFilter(!showFilter);
              }}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${showFilter ? 'bg-blue-600' : 'bg-gray-900'
                }`}
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>

            {showFilter && (
              <div className="absolute right-0 top-10 sm:top-12 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-5 w-[280px] sm:w-80 z-20">
                <h3 className="text-lg sm:text-xl font-bold mb-4">{t('dashboard.qidiruv.filter_title')}</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">{t('dashboard.qidiruv.age_label')}</label>
                  <div className="flex gap-3">
                    <div className="bg-gray-200 rounded-full px-4 py-2 flex-1">
                      <input
                        type="number"
                        placeholder={t('dashboard.qidiruv.age_from')}
                        value={minAge}
                        onChange={(e) => setMinAge(e.target.value)}
                        className="bg-transparent w-full outline-none text-xs sm:text-sm placeholder-gray-500"
                      />
                    </div>
                    <div className="bg-gray-200 rounded-full px-4 py-2 flex-1">
                      <input
                        type="number"
                        placeholder={t('dashboard.qidiruv.age_to')}
                        value={maxAge}
                        onChange={(e) => setMaxAge(e.target.value)}
                        className="bg-transparent w-full outline-none text-xs sm:text-sm placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">{t('dashboard.qidiruv.status_label')}</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedStatus(selectedStatus === 'ЛЕЧИТСЯ' ? 'All' : 'ЛЕЧИТСЯ')}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-colors border font-medium ${selectedStatus === 'ЛЕЧИТСЯ'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                        }`}
                    >
                      {t('dashboard.qidiruv.status_treating')}
                    </button>
                    <button
                      onClick={() => setSelectedStatus(selectedStatus === 'НОВЫЙ' ? 'All' : 'НОВЫЙ')}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-colors border font-medium ${selectedStatus === 'НОВЫЙ'
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                        }`}
                    >
                      {t('dashboard.qidiruv.status_new')}
                    </button>
                    <button
                      onClick={() => setSelectedStatus(selectedStatus === 'ЗАПИСАН' ? 'All' : 'ЗАПИСАН')}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-colors border font-medium ${selectedStatus === 'ЗАПИСАН'
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {t('dashboard.qidiruv.status_recorded')}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleApply}
                  className="w-full bg-[#1e2532] text-white rounded-full py-2.5 sm:py-3 font-medium hover:bg-[#2c3545] transition-colors text-sm sm:text-base"
                >
                  {t('dashboard.qidiruv.apply_button')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddPatientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
        }}
      />
    </div>
  );
}

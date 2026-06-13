'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { usePatientPhotos } from '@/api/photos';
import AddPhotoModal from './AddPhotoModal';

interface PhotosSectionProps {
  patientId: number;
}

const PhotosSection = ({ patientId }: PhotosSectionProps) => {
  const t = useTranslations();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = [
    { id: 'all', label: t('patients_modals.photos_section.cat_all'), icon: '📁' },
    { id: 'xray', label: t('patients_modals.photos_section.cat_xray'), icon: '🦷' },
    { id: 'treatment', label: t('patients_modals.photos_section.cat_treatment'), icon: '💉' },
    { id: 'other', label: t('patients_modals.photos_section.cat_other'), icon: '📷' },
  ];

  const { data: photos = [], isLoading, isError } = usePatientPhotos(patientId, selectedCategory);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{t('patients_modals.photos_section.title')}</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          + {t('patients_modals.photos_section.upload')}
        </button>
      </div>

      {isError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {t('patients_modals.photos_section.load_error')}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500">{t('patients_modals.photos_section.empty')}</p>
          <p className="text-sm text-gray-400 mt-1">
            {t('patients_modals.photos_section.empty_hint')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square bg-gray-200 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.file_url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <button className="bg-white text-gray-900 px-3 py-1 rounded-lg text-sm font-medium">
                  {t('patients_modals.photos_section.view')}
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600 truncate">{photo.title}</div>
              {photo.description && (
                <div className="text-xs text-gray-400 truncate">{photo.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPhotoModal
          patientId={patientId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default PhotosSection;

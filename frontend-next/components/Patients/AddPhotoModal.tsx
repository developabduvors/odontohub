'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import { useCreatePhoto } from '@/api/photos';

interface AddPhotoModalProps {
  patientId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPhotoModal = ({ patientId, onClose, onSuccess }: AddPhotoModalProps) => {
  const t = useTranslations();
  const createPhoto = useCreatePhoto(patientId);
  const [formData, setFormData] = useState({
    title: '',
    category: 'treatment',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('patients_modals.photo.err_image'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('patients_modals.photo.err_size'));
      return;
    }

    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError(t('patients_modals.photo.err_file'));
      return;
    }
    if (!formData.title.trim()) {
      setError(t('patients_modals.photo.err_title'));
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await createPhoto.mutateAsync({
          title: formData.title,
          file_url: reader.result as string,
          category: formData.category,
          description: formData.description || undefined,
        });
        onSuccess();
      } catch (err) {
        console.error('Error creating photo:', err);
        setError(t('patients_modals.photo.err_save'));
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const isPending = createPhoto.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t('patients_modals.photo.title')}</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.photo.name')}</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('patients_modals.photo.name_ph')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.photo.file')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('patients_modals.photo.file_hint')}
            </p>
          </div>

          {previewUrl && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('patients_modals.photo.preview')}</label>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.photo.category')}</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="xray">{t('patients_modals.photo.cat_xray')}</option>
              <option value="treatment">{t('patients_modals.photo.cat_treatment')}</option>
              <option value="before">{t('patients_modals.photo.cat_before')}</option>
              <option value="after">{t('patients_modals.photo.cat_after')}</option>
              <option value="other">{t('patients_modals.photo.cat_other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.photo.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder={t('patients_modals.photo.description_ph')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isPending}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? t('common.adding') : t('common.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPhotoModal;

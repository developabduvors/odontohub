'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import type { AllergyCreate, AllergySeverity } from '@/types/allergy';
import { useAddAllergy } from '@/api/allergies';

interface AddAllergyModalProps {
  patientId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const AddAllergyModal = ({ patientId, onClose, onSuccess }: AddAllergyModalProps) => {
  const t = useTranslations();
  const addAllergy = useAddAllergy(patientId);
  const [formData, setFormData] = useState<AllergyCreate>({
    allergen_name: '',
    reaction_type: '',
    severity: 'mild',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.allergen_name || !formData.reaction_type) {
      setError(t('patient_profile.allergies_view.error_required'));
      return;
    }

    try {
      setError(null);
      await addAllergy.mutateAsync(formData);
      onSuccess();
    } catch (err) {
      console.error('Error adding allergy:', err);
      setError(t('patient_profile.allergies_view.error_add'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-[#1D1D2B] mb-4">
          {t('patient_profile.allergies_view.add_title')}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient_profile.allergies_view.allergen')} *
            </label>
            <input
              type="text"
              value={formData.allergen_name}
              onChange={(e) => setFormData({ ...formData, allergen_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={t('patient_profile.allergies_view.placeholder_allergen')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient_profile.allergies_view.reaction_type')} *
            </label>
            <input
              type="text"
              value={formData.reaction_type}
              onChange={(e) => setFormData({ ...formData, reaction_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={t('patient_profile.allergies_view.placeholder_reaction')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient_profile.allergies_view.severity_label')} *
            </label>
            <select
              value={formData.severity}
              onChange={(e) =>
                setFormData({ ...formData, severity: e.target.value as AllergySeverity })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="mild">{t('patient_profile.allergies_view.severity.mild')}</option>
              <option value="moderate">{t('patient_profile.allergies_view.severity.moderate')}</option>
              <option value="severe">{t('patient_profile.allergies_view.severity.severe')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient_profile.allergies_view.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
              placeholder={t('patient_profile.allergies_view.placeholder_notes')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={addAllergy.isPending}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              disabled={addAllergy.isPending}
            >
              {addAllergy.isPending
                ? t('patient_profile.allergies_view.saving')
                : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAllergyModal;

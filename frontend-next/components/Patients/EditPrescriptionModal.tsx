'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import type { Prescription, PrescriptionUpdate } from '@/types/prescription';
import { useUpdatePrescription } from '@/api/prescriptions';

interface EditPrescriptionModalProps {
  prescription: Prescription;
  patientId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const EditPrescriptionModal = ({
  prescription,
  patientId,
  onClose,
  onSuccess,
}: EditPrescriptionModalProps) => {
  const t = useTranslations();
  const updatePrescription = useUpdatePrescription(patientId);
  const [formData, setFormData] = useState<PrescriptionUpdate>({
    medication_name: prescription.medication_name,
    dosage: prescription.dosage,
    frequency: prescription.frequency,
    duration: prescription.duration,
    notes: prescription.notes || '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setError(null);
      await updatePrescription.mutateAsync({ prescriptionId: prescription.id, data: formData });
      onSuccess();
    } catch (err) {
      console.error('Error updating prescription:', err);
      setError(t('patient_profile.prescriptions_view.save_error'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-[#1D1D2B] mb-4">
          {t('patient_profile.prescriptions_view.edit_title')}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient_profile.prescriptions_view.medication_label')}
            </label>
            <input
              type="text"
              value={formData.medication_name}
              onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient_profile.prescriptions_view.dosage_label')}
            </label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient_profile.prescriptions_view.frequency_label')}
            </label>
            <input
              type="text"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient_profile.prescriptions_view.duration_label')}
            </label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient_profile.prescriptions_view.notes_label')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={updatePrescription.isPending}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={updatePrescription.isPending}
            >
              {updatePrescription.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPrescriptionModal;

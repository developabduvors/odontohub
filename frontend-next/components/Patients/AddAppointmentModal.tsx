'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import { useCreateAppointment } from '@/api/appointments';

interface AddAppointmentModalProps {
  patientId: number;
  dentistId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const AddAppointmentModal = ({
  patientId,
  dentistId,
  onClose,
  onSuccess,
}: AddAppointmentModalProps) => {
  const t = useTranslations();
  const createAppointment = useCreateAppointment();
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    service: '',
    notes: '',
    visit_type: 'primary' as 'primary' | 'follow_up',
    price: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.start_time || !formData.end_time) {
      setError(t('patients_modals.appointment.err_time'));
      return;
    }

    try {
      setError(null);
      await createAppointment.mutateAsync({
        dentist_id: dentistId,
        patient_id: patientId,
        start_time: formData.start_time,
        end_time: formData.end_time,
        service: formData.service || undefined,
        notes: formData.notes || undefined,
        visit_type: formData.visit_type,
        price: formData.price ? parseFloat(formData.price) : undefined,
      });
      onSuccess();
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(t('patients_modals.appointment.err_save'));
    }
  };

  const isPending = createAppointment.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t('patients_modals.appointment.title')}</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.appointment.start_time')}</label>
            <input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.appointment.end_time')}</label>
            <input
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.appointment.service')}</label>
            <input
              type="text"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('patients_modals.appointment.service_ph')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.appointment.price')}</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('patients_modals.appointment.price_ph')}
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.appointment.visit_type')}</label>
            <select
              value={formData.visit_type}
              onChange={(e) =>
                setFormData({ ...formData, visit_type: e.target.value as 'primary' | 'follow_up' })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="primary">{t('patients_modals.appointment.visit_primary')}</option>
              <option value="follow_up">{t('patients_modals.appointment.visit_followup')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.appointment.notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder={t('patients_modals.appointment.notes_ph')}
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

export default AddAppointmentModal;

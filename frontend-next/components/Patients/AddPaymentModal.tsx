'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import { useCreatePayment } from '@/api/payments';

interface AddPaymentModalProps {
  patientId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPaymentModal = ({ patientId, onClose, onSuccess }: AddPaymentModalProps) => {
  const t = useTranslations();
  const createPayment = useCreatePayment(patientId);
  const [formData, setFormData] = useState({
    amount: '',
    service_name: '',
    payment_method: 'cash',
    notes: '',
    status: 'paid',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError(t('patients_modals.payment.err_amount'));
      return;
    }

    if (!formData.service_name.trim()) {
      setError(t('patients_modals.payment.err_service'));
      return;
    }

    try {
      setError(null);
      const amount = parseFloat(formData.amount);
      const paidAmount = formData.status === 'unpaid' ? 0 : amount;

      await createPayment.mutateAsync({
        amount,
        paid_amount: paidAmount,
        service_name: formData.service_name,
        status: formData.status,
        notes: formData.notes || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error('Error creating payment:', err);
      setError(t('patients_modals.payment.err_save'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t('patients_modals.payment.title')}</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patients_modals.payment.service')}
            </label>
            <input
              type="text"
              value={formData.service_name}
              onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('patients_modals.payment.service_ph')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.payment.amount')}</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.payment.status')}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="paid">{t('patients_modals.payment.status_paid')}</option>
              <option value="partial">{t('patients_modals.payment.status_partial')}</option>
              <option value="unpaid">{t('patients_modals.payment.status_unpaid')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients_modals.payment.notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder={t('patients_modals.payment.notes_ph')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={createPayment.isPending}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={createPayment.isPending}
            >
              {createPayment.isPending ? t('common.adding') : t('common.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;

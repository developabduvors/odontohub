'use client';

import { useState, type FormEvent } from 'react';

import { useCreatePayment } from '@/api/payments';

interface AddPaymentModalProps {
  patientId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPaymentModal = ({ patientId, onClose, onSuccess }: AddPaymentModalProps) => {
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
      setError('Введите корректную сумму');
      return;
    }

    if (!formData.service_name.trim()) {
      setError('Введите название услуги');
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
      setError('Не удалось добавить платёж');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Добавить платёж</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название услуги *
            </label>
            <input
              type="text"
              value={formData.service_name}
              onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Например: Лечение кариеса"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сумма *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="paid">Оплачено</option>
              <option value="partial">Частично</option>
              <option value="unpaid">Не оплачено</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Дополнительная информация..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={createPayment.isPending}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={createPayment.isPending}
            >
              {createPayment.isPending ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;

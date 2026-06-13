'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  usePatientPayments,
  usePaymentStats,
  useUpdatePayment,
  type Payment,
} from '@/api/payments';
import AddPaymentModal from './AddPaymentModal';

interface PaymentsSectionProps {
  patientId: number;
}

const PaymentsSection = ({ patientId }: PaymentsSectionProps) => {
  const t = useTranslations();
  const [showAddModal, setShowAddModal] = useState(false);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paymentsQuery = usePatientPayments(patientId);
  const statsQuery = usePaymentStats(patientId);
  const updatePayment = useUpdatePayment(patientId);

  const payments = paymentsQuery.data ?? [];
  const stats = statsQuery.data ?? { total_amount: 0, total_paid: 0, total_debt: 0 };
  const loading = paymentsQuery.isLoading || statsQuery.isLoading;
  const sum = t('patients_modals.payments_section.sum');

  const handleMarkAsPaid = async (payment: Payment) => {
    try {
      setError(null);
      setUpdatingPaymentId(payment.id);
      await updatePayment.mutateAsync({
        paymentId: payment.id,
        data: { status: 'paid', paid_amount: payment.amount },
      });
    } catch (err) {
      console.error('Error updating payment:', err);
      setError(t('patients_modals.payments_section.update_error'));
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const utcString = dateString.endsWith('Z') || dateString.includes('+') ? dateString : dateString + 'Z';
    const date = new Date(utcString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{t('patients_modals.payments_section.title')}</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          + {t('patients_modals.payments_section.add')}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <div className="text-sm text-green-700 font-medium mb-1">{t('patients_modals.payments_section.paid')}</div>
          <div className="text-2xl font-bold text-green-900">
            {stats.total_paid.toLocaleString()} {sum}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
          <div className="text-sm text-red-700 font-medium mb-1">{t('patients_modals.payments_section.debt')}</div>
          <div className="text-2xl font-bold text-red-900">
            {stats.total_debt.toLocaleString()} {sum}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="text-sm text-blue-700 font-medium mb-1">{t('patients_modals.payments_section.total')}</div>
          <div className="text-2xl font-bold text-blue-900">
            {stats.total_amount.toLocaleString()} {sum}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : payments.length === 0 ? (
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
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-gray-500">{t('patients_modals.payments_section.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        payment.status === 'paid'
                          ? 'bg-green-500'
                          : payment.status === 'partial'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                    ></span>
                    <div className="font-semibold text-gray-900">{payment.service_name}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatDate(payment.payment_date)}
                  </div>
                  {payment.notes && (
                    <div className="text-sm text-gray-500 mt-1">{payment.notes}</div>
                  )}
                  {payment.paid_amount > 0 && payment.paid_amount < payment.amount && (
                    <div className="text-xs text-yellow-600 mt-1">
                      {t('patients_modals.payments_section.paid_of', {
                        paid: payment.paid_amount.toLocaleString(),
                        amount: payment.amount.toLocaleString(),
                      })}
                    </div>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div>
                    <div
                      className={`text-lg font-bold ${
                        payment.status === 'paid'
                          ? 'text-green-600'
                          : payment.status === 'partial'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {payment.amount.toLocaleString()} {sum}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {payment.status === 'paid'
                        ? t('patients_modals.payments_section.paid')
                        : payment.status === 'partial'
                          ? t('patients_modals.payments_section.partial')
                          : t('patients_modals.payments_section.unpaid')}
                    </div>
                  </div>
                  {payment.status !== 'paid' && (
                    <button
                      onClick={() => handleMarkAsPaid(payment)}
                      disabled={updatingPaymentId === payment.id}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {updatingPaymentId === payment.id ? t('patients_modals.payments_section.updating') : t('patients_modals.payments_section.mark_paid')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPaymentModal
          patientId={patientId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default PaymentsSection;

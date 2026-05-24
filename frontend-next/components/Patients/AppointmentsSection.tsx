'use client';

import { useState } from 'react';

import { usePatientAppointments, type Appointment } from '@/api/appointments';
import AddAppointmentModal from './AddAppointmentModal';

interface AppointmentsSectionProps {
  patientId: number;
  dentistId: number;
}

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
  completed: 'Завершён',
  cancelled: 'Отменён',
  moved: 'Перенесён',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  moved: 'bg-purple-100 text-purple-800',
};

const AppointmentsSection = ({ patientId, dentistId }: AppointmentsSectionProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: appointments = [], isLoading, error } = usePatientAppointments(patientId);

  const formatDate = (dateString: string) => {
    const utcString = dateString.endsWith('Z') || dateString.includes('+') ? dateString : dateString + 'Z';
    const date = new Date(utcString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">История приёмов</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Добавить приём
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">Не удалось загрузить приёмы</div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : appointments.length === 0 ? (
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500">Нет записей о приёмах</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment: Appointment) => (
            <div
              key={appointment.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{appointment.service || 'Приём'}</div>
                  <div className="text-sm text-gray-600 mt-1">{formatDate(appointment.start_time)}</div>
                  {appointment.notes && (
                    <div className="text-sm text-gray-500 mt-1">{appointment.notes}</div>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[appointment.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {statusLabels[appointment.status] || appointment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddAppointmentModal
          patientId={patientId}
          dentistId={dentistId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default AppointmentsSection;

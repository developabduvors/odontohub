'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import AppointmentModal from '@/components/Appointments/AppointmentModal';
import AddPatientModal from '@/components/Patients/AddPatientModal';
import AddNoteModal from '@/components/Patients/AddNoteModal';

type Action = {
  titleKey: string;
  action: 'appointment' | 'patient' | 'note' | 'message';
};

const Tezroq: React.FC = () => {
  const t = useTranslations();
  const router = useRouter();
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const actions: Action[] = [
    { titleKey: 'dashboard.quick_actions.add_appointment', action: 'appointment' },
    { titleKey: 'dashboard.quick_actions.new_note', action: 'note' },
    { titleKey: 'dashboard.quick_actions.message_patient', action: 'message' },
    { titleKey: 'dashboard.quick_actions.add_patient', action: 'patient' },
  ];

  const handleActionClick = (action: Action) => {
    switch (action.action) {
      case 'appointment':
        setIsAppointmentModalOpen(true);
        break;
      case 'patient':
        setIsPatientModalOpen(true);
        break;
      case 'note':
        setIsNoteModalOpen(true);
        break;
      case 'message':
        router.push('/chats');
        break;
    }
  };

  const handleNoteSuccess = (patientId: number, note: string) => {
    const notesKey = `patient_notes_${patientId}`;
    const existingNotes = localStorage.getItem(notesKey);
    const notes = existingNotes ? JSON.parse(existingNotes) : [];

    notes.push({
      id: Date.now(),
      text: note,
      date: new Date().toISOString(),
      createdBy: t('common.doctor'),
    });

    localStorage.setItem(notesKey, JSON.stringify(notes));
  };

  return (
    <div>
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">{t('dashboard.quick_actions.title')}</h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className="bg-gray-50 hover:bg-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center transition-colors relative"
            >
              <p className="font-semibold text-gray-900 text-xs sm:text-base">{t(action.titleKey)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSuccess={() => {
          setIsAppointmentModalOpen(false);
          router.push('/appointments');
        }}
      />

      <AddPatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={() => {
          setIsPatientModalOpen(false);
        }}
      />

      <AddNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSuccess={handleNoteSuccess}
      />
    </div>
  );
};

export default Tezroq;

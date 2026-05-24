'use client';

import { useState, type FC } from 'react';
import { useParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { useDentistProfile, useDeletePatient } from '@/api/profile';
import { toast } from '@/components/Shared/Toast';
import { paths } from '@/lib/paths';
import PatientInfoSection from '@/components/Patients/PatientInfoSection';
import AllergySection from '@/components/Patients/AllergySection';
import PrescriptionSection from '@/components/Patients/PrescriptionSection';
import PaymentsSection from '@/components/Patients/PaymentsSection';
import PhotosSection from '@/components/Patients/PhotosSection';
import AppointmentsSection from '@/components/Patients/AppointmentsSection';
import MedcardSection from '@/components/Patients/MedcardSection';

type TabType = 'info' | 'appointments' | 'prescriptions' | 'allergies' | 'photos' | 'payments' | 'medcard';

const PatientDetailPage: FC = () => {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const { data: dentistProfile } = useDentistProfile();
  const deletePatient = useDeletePatient();

  const patientId = parseInt(params?.id || '0', 10);
  const dentistId = dentistProfile?.id || 0;

  const handleDeletePatient = async () => {
    if (window.confirm(t('patient_profile.patient_detail.delete_confirm'))) {
      try {
        await deletePatient.mutateAsync(patientId);
        toast.success(t('patient_profile.patient_detail.delete_success'));
        router.push(paths.patient);
      } catch (error) {
        console.error('Error deleting patient:', error);
        toast.error(t('patient_profile.patient_detail.delete_error'));
      }
    }
  };

  const tabs: { id: TabType; label: string; color: string }[] = [
    { id: 'info', label: t('patient_profile.tabs.info'), color: 'blue' },
    { id: 'medcard', label: t('patient_profile.tabs.medcard'), color: 'teal' },
    { id: 'appointments', label: t('patient_profile.tabs.appointments'), color: 'purple' },
    { id: 'prescriptions', label: t('patient_profile.tabs.prescriptions'), color: 'blue' },
    { id: 'allergies', label: t('patient_profile.tabs.allergies'), color: 'red' },
    { id: 'photos', label: t('patient_profile.tabs.photo'), color: 'indigo' },
    { id: 'payments', label: t('patient_profile.tabs.payments'), color: 'green' },
  ];

  const getTabColorClass = (tabId: TabType, isActive: boolean) => {
    const colors: Record<string, string> = {
      blue: isActive ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100',
      red: isActive ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-100',
      green: isActive ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100',
      purple: isActive ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100',
      indigo: isActive ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100',
      teal: isActive ? 'bg-teal-500 text-white' : 'text-gray-600 hover:bg-gray-100',
    };
    const tab = tabs.find((tt) => tt.id === tabId);
    return colors[tab?.color || 'blue'] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-[#E8E8E8] pb-8">
      <div className="bg-white px-4 py-6 flex items-center justify-between gap-4 sticky top-14 lg:top-0 z-30 rounded-b-[40px] shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center bg-[#1D1D2B] rounded-full p-2 transition-transform active:scale-95"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-[#1D1D2B]">{t('patient_profile.patient_detail.title')}</h1>
        </div>

        <button
          onClick={handleDeletePatient}
          disabled={deletePatient.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline font-bold">{t('patient_profile.patient_detail.delete_btn')}</span>
        </button>
      </div>

      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl p-2 shadow-sm overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
                  getTabColorClass(tab.id, activeTab === tab.id)
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm min-h-[400px]">
          {activeTab === 'info' && <PatientInfoSection patientId={patientId} />}
          {activeTab === 'medcard' && <MedcardSection patientId={patientId} />}
          {activeTab === 'allergies' && <AllergySection patientId={patientId} />}
          {activeTab === 'prescriptions' && <PrescriptionSection patientId={patientId} />}
          {activeTab === 'payments' && <PaymentsSection patientId={patientId} />}
          {activeTab === 'photos' && <PhotosSection patientId={patientId} />}
          {activeTab === 'appointments' && <AppointmentsSection patientId={patientId} dentistId={dentistId} />}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;

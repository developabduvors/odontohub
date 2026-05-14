'use client';

import { useTranslations } from 'next-intl';

import { usePatient } from '@/api/profile';

interface PatientInfoSectionProps {
  patientId: number;
}

const PatientInfoSection = ({ patientId }: PatientInfoSectionProps) => {
  const t = useTranslations();
  const { data: patient, isLoading } = usePatient(patientId);

  const calculateAge = (birthDate: string | null | undefined) => {
    if (!birthDate) return t('patient_profile.labels.not_specified');
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} ${t('patient_profile.labels.years_label')}`;
  };

  const formatGender = (gender: string | null | undefined) => {
    if (!gender) return t('patient_profile.labels.not_specified');
    return gender === 'male'
      ? t('patient_profile.male')
      : gender === 'female'
        ? t('patient_profile.female')
        : gender;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('patient_profile.labels.info_not_found')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t('patient_profile.labels.personal_data')}</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="w-32 text-gray-600 font-medium">{t('patient_profile.labels.full_name')}:</div>
            <div className="flex-1 text-gray-900 font-semibold">{patient.full_name || t('patient_profile.labels.not_specified')}</div>
          </div>
          <div className="flex items-start">
            <div className="w-32 text-gray-600 font-medium">{t('patient_profile.labels.phone')}:</div>
            <div className="flex-1 text-gray-900">{patient.phone || t('patient_profile.labels.not_specified')}</div>
          </div>
          <div className="flex items-start">
            <div className="w-32 text-gray-600 font-medium">{t('patient_profile.labels.age')}:</div>
            <div className="flex-1 text-gray-900">{calculateAge(patient.birth_date)}</div>
          </div>
          <div className="flex items-start">
            <div className="w-32 text-gray-600 font-medium">{t('patient_profile.labels.gender')}:</div>
            <div className="flex-1 text-gray-900">{formatGender(patient.gender)}</div>
          </div>
          {patient.address && (
            <div className="flex items-start">
              <div className="w-32 text-gray-600 font-medium">{t('patient_profile.labels.address')}:</div>
              <div className="flex-1 text-gray-900">{patient.address}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientInfoSection;

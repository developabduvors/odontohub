'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import type { Allergy, AllergySeverity } from '@/types/allergy';
import { useAllergies, useDeleteAllergy } from '@/api/allergies';
import { toast } from '@/components/Shared/Toast';
import AddAllergyModal from './AddAllergyModal';
import EditAllergyModal from './EditAllergyModal';

interface AllergySectionProps {
  patientId: number;
}

const severityColors: Record<AllergySeverity, string> = {
  mild: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  moderate: 'bg-orange-100 text-orange-800 border-orange-300',
  severe: 'bg-red-100 text-red-800 border-red-300',
};

const AllergySection = ({ patientId }: AllergySectionProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);

  const { data: allergies = [], isLoading, isError } = useAllergies(patientId);
  const deleteAllergy = useDeleteAllergy(patientId);

  const handleDelete = async (allergyId: number) => {
    if (typeof window === 'undefined') return;
    if (!window.confirm(t('patient_profile.allergies_view.delete_confirm'))) return;

    try {
      await deleteAllergy.mutateAsync(allergyId);
    } catch (err) {
      console.error('Error deleting allergy:', err);
      toast.error(t('patient_profile.allergies_view.delete_error'));
    }
  };

  const getSeverityLabel = (severity: AllergySeverity) => {
    switch (severity) {
      case 'mild':
        return t('patient_profile.allergies_view.severity.mild');
      case 'moderate':
        return t('patient_profile.allergies_view.severity.moderate');
      case 'severe':
        return t('patient_profile.allergies_view.severity.severe');
      default:
        return severity;
    }
  };

  const formatDate = (dateString: string) => {
    const utcString = dateString.endsWith('Z') || dateString.includes('+') ? dateString : dateString + 'Z';
    const date = new Date(utcString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">{t('common.loading')}</div>;
  }

  if (isError) {
    return (
      <div className="text-center py-4 text-red-500">
        {t('patient_profile.allergies_view.fetch_error')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#1D1D2B]">{t('patient_profile.allergies_view.title')}</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          {t('patient_profile.allergies_view.add_btn')}
        </button>
      </div>

      {allergies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('patient_profile.allergies_view.no_allergies')}
        </div>
      ) : (
        <div className="space-y-3">
          {allergies.map((allergy) => (
            <div
              key={allergy.id}
              className={`rounded-lg p-4 shadow-sm border-2 ${severityColors[allergy.severity]}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-lg">{allergy.allergen_name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${severityColors[allergy.severity]}`}>
                      {getSeverityLabel(allergy.severity)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">{t('patient_profile.allergies_view.reaction')}:</span>{' '}
                      {allergy.reaction_type}
                    </p>
                    {allergy.notes && (
                      <p>
                        <span className="font-medium">{t('patient_profile.allergies_view.notes')}:</span>{' '}
                        {allergy.notes}
                      </p>
                    )}
                    <p className="text-xs opacity-70 mt-2">
                      {t('patient_profile.allergies_view.documented_at')}: {formatDate(allergy.documented_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingAllergy(allergy)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    aria-label="Edit"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(allergy.id)}
                    disabled={deleteAllergy.isPending}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Delete"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddAllergyModal
          patientId={patientId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}

      {editingAllergy && (
        <EditAllergyModal
          allergy={editingAllergy}
          patientId={patientId}
          onClose={() => setEditingAllergy(null)}
          onSuccess={() => setEditingAllergy(null)}
        />
      )}
    </div>
  );
};

export default AllergySection;

'use client';

import { User, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useDeletePatient } from '@/api/profile';
import { toast } from '@/components/Shared/Toast';

interface Patient {
  id: number;
  name: string;
  age: number;
  phone: string;
  diagnosis: string;
  status: string;
  statusColor: string;
  img: string;
}

interface Props {
  patients: Patient[];
}

export default function PatientsTable({ patients }: Props) {
  const t = useTranslations();
  const deletePatient = useDeletePatient();

  const handleDelete = async (e: React.MouseEvent, patientId: number, patientName: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(t('patients_list.delete_confirm', { name: patientName }))) {
      try {
        await deletePatient.mutateAsync(patientId);
      } catch (error) {
        console.error('Error deleting patient:', error);
        toast.error(t('patients_list.delete_error'));
      }
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ЛЕЧИТСЯ':
        return t('patients_list.statuses.treating');
      case 'НОВЫЙ':
        return t('patients_list.statuses.new');
      case 'ЗАПИСАН':
        return t('patients_list.statuses.recorded');
      default:
        return status;
    }
  };

  return (
    <div className="w-full">
      <div className="hidden sm:grid grid-cols-6 px-6 py-3 bg-white border-b text-sm font-medium text-gray-600 rounded-t-2xl">
        <div>{t('patients_list.table.name')}</div>
        <div>{t('patients_list.table.age')}</div>
        <div>{t('patients_list.table.phone')}</div>
        <div>{t('patients_list.table.diagnosis')}</div>
        <div>{t('patients_list.table.status')}</div>
        <div className="text-right">{t('patients_list.table.actions')}</div>
      </div>

      <div className="space-y-3 sm:space-y-2 mt-2">
        {patients.map(p => (
          <div
            key={p.id}
            className="flex flex-col sm:grid sm:grid-cols-6 items-start sm:items-center px-4 py-4 sm:px-6 bg-white rounded-2xl sm:rounded-none sm:last:rounded-b-2xl shadow-sm hover:shadow-md transition-shadow relative gap-3 sm:gap-0"
          >
            <Link href={`/patients/${p.id}`} className="absolute inset-0 z-10" />

            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
              </div>
              <div className="flex flex-col sm:block">
                <span className="font-bold sm:font-medium text-gray-900 line-clamp-1">{p.name}</span>
                <span className="sm:hidden text-xs text-gray-500 mt-0.5">{p.phone}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:hidden w-full text-sm text-gray-600 border-t pt-3">
              <div className="flex-1">
                <span className="text-[10px] uppercase text-gray-400 block">{t('patients_list.table.age')}</span>
                {p.age} {t('patients_list.table.age_label')}
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase text-gray-400 block">{t('patients_list.table.diagnosis')}</span>
                <span className="line-clamp-1">{p.diagnosis}</span>
              </div>
              <div className="shrink-0">
                <span className="text-[10px] uppercase text-gray-400 block mb-1">{t('patients_list.table.status')}</span>
                <div className={`font-bold text-xs px-2.5 py-1 rounded-full bg-opacity-10 ${p.statusColor} ${p.status === 'ЛЕЧИТСЯ' ? 'bg-blue-100' : p.status === 'НОВЫЙ' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {getStatusLabel(p.status)}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, p.id, p.name)}
                className="relative z-20 p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="hidden sm:block text-gray-600">{p.age}</div>
            <div className="hidden sm:block text-gray-600">{p.phone}</div>
            <div className="hidden sm:block text-gray-600 italic">{p.diagnosis}</div>

            <div className={`font-bold text-sm sm:text-base px-3 py-1 sm:p-0 rounded-full sm:rounded-none bg-opacity-10 sm:bg-transparent ${p.statusColor} ${p.status === 'ЛЕЧИТСЯ' ? 'bg-blue-100' : p.status === 'НОВЫЙ' ? 'bg-green-100' : 'bg-gray-100'}`}>
              {getStatusLabel(p.status)}
            </div>

            <div className="hidden sm:flex justify-end">
              <button
                onClick={(e) => handleDelete(e, p.id, p.name)}
                className="relative z-20 p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {patients.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t('patients_list.table.not_found')}
        </div>
      )}
    </div>
  );
}

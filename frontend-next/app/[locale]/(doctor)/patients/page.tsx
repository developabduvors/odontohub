'use client';

import { useState, useMemo, type FC } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import Qidiruv from '@/components/Bosh sahifa/Qidiruv';
import PatientsTable from '@/components/Bosh sahifa/PatsentTable';
import DoctorPageShell from '@/components/Layout/DoctorPageShell';
import { type Patient } from '@/data/patients';
import { useAllPatients, useCreatePatient } from '@/api/profile';
import { toast } from '@/components/Shared/Toast';
import { paths } from '@/lib/paths';

interface Filters {
  status: string;
  minAge: string;
  maxAge: string;
}

const PatientsPage: FC = () => {
  const t = useTranslations();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<Filters>({
    status: 'All',
    minAge: '',
    maxAge: ''
  });

  const { data: apiPatients, isLoading } = useAllPatients();
  const createPatientMutation = useCreatePatient();

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 25;
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const patients = useMemo(() => {
    if (!apiPatients || !Array.isArray(apiPatients)) return [];
    return apiPatients.map((p: any) => {
      const status = p.status || 'НОВЫЙ';
      let statusColor = 'text-green-600';

      if (status === 'ЛЕЧИТСЯ') {
        statusColor = 'text-blue-600';
      } else if (status === 'ЗАПИСАН') {
        statusColor = 'text-gray-600';
      }

      return {
        id: p.id,
        name: p.full_name || 'No Name',
        age: calculateAge(p.birth_date),
        phone: p.phone || '',
        diagnosis: p.source === 'doctor_added' ? 'Konsultatsiya' : (p.source || 'Checkup'),
        status: status,
        statusColor: statusColor,
        img: '/assets/img/photos/Subtract.png'
      };
    }) as Patient[];
  }, [apiPatients]);

  const handleAddPatient = async (data: { name: string; phone: string; diagnosis: string }) => {
    try {
      await createPatientMutation.mutateAsync({
        full_name: data.name,
        phone: data.phone,
        source: data.diagnosis
      });
      toast.success(t('patients_list.new_patient_added'));
    } catch (error: any) {
      console.error("Failed to add patient", error);
      const errorMessage = error.response?.data?.detail || "Failed to add patient";
      toast.error(errorMessage);
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filters.status === 'All' || p.status === filters.status;

    let matchesAge = true;
    if (filters.minAge) matchesAge = matchesAge && p.age >= parseInt(filters.minAge);
    if (filters.maxAge) matchesAge = matchesAge && p.age <= parseInt(filters.maxAge);

    return matchesSearch && matchesStatus && matchesAge;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DoctorPageShell
      badge="Patients"
      title={t('sidebar.patients')}
      accent="Карточки и поиск"
      description="Просматривайте базу пациентов, применяйте фильтры и добавляйте новые карточки в едином интерфейсе врача."
      contentClassName="p-4 sm:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
          <button
            type="button"
            onClick={() => router.push(paths.menu)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dfe4ff] bg-[#eef1ff] text-[#5667ff] transition hover:bg-[#e4e9ff]"
            aria-label="Orqaga qaytish"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <p
              className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7080ff]"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              Patient base
            </p>
            <h2
              className="mt-1 text-2xl font-bold text-[#141b33] sm:text-3xl"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              {t('sidebar.patients')}
            </h2>
          </div>
        </div>

        <Qidiruv
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAdd={handleAddPatient}
          onApplyFilter={setFilters}
        />

        <div className="mt-5 sm:mt-6">
          <PatientsTable patients={filteredPatients} />
        </div>
      </div>
    </DoctorPageShell>
  );
};

export default PatientsPage;

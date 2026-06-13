'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MapPin, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { useDentistProfile, useUpdateDentistProfile, useUploadDiploma } from '@/api/profile';
import { toast } from '@/components/Shared/Toast';

const MapModal = dynamic(() => import('@/components/EditDoctorProfile/MapModal'), { ssr: false });

export default function EditDoctorProfilePage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: dentist, refetch } = useDentistProfile();
  const updateProfile = useUpdateDentistProfile();
  const uploadDiploma = useUploadDiploma();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diplomaInputRef = useRef<HTMLInputElement>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [hasPickedLocation, setHasPickedLocation] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 41.2995, lng: 69.2401 });
  const [avatar, setAvatar] = useState<string>('/assets/img/photos/Dentist.png');

  const [formData, setFormData] = useState({
    specialization: '',
    phone: '',
    address: '',
    clinic: '',
    birthDate: '',
    experienceYears: '',
    schedule: 'Каждый день',
    workStartHour: '08',
    workStartMinute: '00',
    workEndHour: '16',
    workEndMinute: '00',
    telegram: '',
    instagram: '',
    whatsapp: '',
    gender: '',
  });

  useEffect(() => {
    if (!dentist) return;

    const workHours = dentist.work_hours?.split('-') || ['08:00', '16:00'];
    const [startHour, startMinute] = workHours[0]?.split(':') || ['08', '00'];
    const [endHour, endMinute] = workHours[1]?.split(':') || ['16', '00'];

    setFormData({
      specialization: dentist.specialization || '',
      phone: dentist.phone || '',
      address: dentist.address || '',
      clinic: dentist.clinic || '',
      birthDate: dentist.birth_date ? dentist.birth_date.slice(0, 10) : '',
      experienceYears: dentist.experience_years != null ? String(dentist.experience_years) : '',
      schedule: dentist.schedule || 'Каждый день',
      workStartHour: startHour,
      workStartMinute: startMinute,
      workEndHour: endHour,
      workEndMinute: endMinute,
      telegram: dentist.telegram || '',
      instagram: dentist.instagram || '',
      whatsapp: dentist.whatsapp || '',
      gender: dentist.gender || '',
    });

    if (dentist.latitude && dentist.longitude) {
      setCoordinates({ lat: dentist.latitude, lng: dentist.longitude });
      setHasPickedLocation(true);
    }
  }, [dentist]);

  // value = stored DB string (kept stable across locales); label = translated display text
  const specializations = [
    { value: 'Хирург', label: t('doctor_edit.specs.surgeon') },
    { value: 'Терапевт', label: t('doctor_edit.specs.therapist') },
    { value: 'Ортодонт', label: t('doctor_edit.specs.orthodontist') },
    { value: 'Ортопед', label: t('doctor_edit.specs.orthopedist') },
    { value: 'Пародонтолог', label: t('doctor_edit.specs.periodontist') },
    { value: 'Имплантолог', label: t('doctor_edit.specs.implantologist') },
    { value: 'Общая стоматология', label: t('doctor_edit.specs.general') },
  ];
  const scheduleOptions = [
    { value: 'Каждый день', label: t('doctor_edit.schedules.everyday') },
    { value: 'Будние дни', label: t('doctor_edit.schedules.weekdays') },
    { value: 'Выходные', label: t('doctor_edit.schedules.weekends') },
    { value: 'Понедельник - Пятница', label: t('doctor_edit.schedules.mon_fri') },
    { value: 'Индивидуальный график', label: t('doctor_edit.schedules.custom') },
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(URL.createObjectURL(file));
  };

  const handleDiplomaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.success(t('doctor_edit.toast_uploading_diploma'));
    try {
      await uploadDiploma.mutateAsync(file);
      await refetch();
      toast.success(t('doctor_edit.toast_diploma_success'));
    } catch (error) {
      console.error('Failed to upload diploma:', error);
      toast.error(t('doctor_edit.toast_diploma_error'));
    }
  };

  const handleMapConfirm = (address: string, lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, address }));
    setCoordinates({ lat, lng });
    setHasPickedLocation(true);
    setIsMapModalOpen(false);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        specialization: formData.specialization,
        phone: formData.phone,
        address: formData.address,
        clinic: formData.clinic,
        birth_date: formData.birthDate || null,
        experience_years: formData.experienceYears ? parseInt(formData.experienceYears, 10) : null,
        schedule: formData.schedule,
        work_hours: `${formData.workStartHour}:${formData.workStartMinute}-${formData.workEndHour}:${formData.workEndMinute}`,
        telegram: formData.telegram,
        instagram: formData.instagram,
        whatsapp: formData.whatsapp,
        gender: formData.gender || null,
      };

      if (hasPickedLocation) {
        payload.latitude = coordinates.lat;
        payload.longitude = coordinates.lng;
      }

      await updateProfile.mutateAsync(payload);
      await refetch();
      toast.success(t('doctor_edit.toast_profile_success'));
      setTimeout(() => router.push('/profile'), 1200);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t('doctor_edit.toast_profile_error'));
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6FB] p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.push('/profile')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold">{t('doctor_edit.title')}</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-gray-600">{t('doctor_edit.specialization')}</label>
              <div className="relative">
                <select
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="h-14 w-full appearance-none rounded-2xl border-2 border-blue-200 bg-white px-4 text-lg font-semibold focus:border-blue-400 focus:outline-none"
                >
                  <option value="">{t('doctor_edit.not_selected')}</option>
                  {specializations.map((spec) => (
                    <option key={spec.value} value={spec.value}>{spec.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-gray-600">{t('doctor_edit.birth_date')}</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="h-14 w-full rounded-2xl border-2 border-blue-200 bg-white px-4 text-lg font-semibold focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-600">{t('doctor_edit.experience')}</label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                  className="h-14 w-full rounded-2xl border-2 border-blue-200 bg-white px-4 text-lg font-semibold focus:border-blue-400 focus:outline-none"
                  placeholder="5"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-600">{t('doctor_edit.gender')}</label>
                <div className="relative">
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="h-14 w-full appearance-none rounded-2xl border-2 border-blue-200 bg-white px-4 text-lg font-semibold focus:border-blue-400 focus:outline-none"
                  >
                    <option value="">{t('doctor_edit.not_selected')}</option>
                    <option value="male">{t('doctor_edit.gender_male')}</option>
                    <option value="female">{t('doctor_edit.gender_female')}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">{t('doctor_edit.phone')}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-14 w-full rounded-2xl border-2 border-blue-200 bg-white px-4 text-lg font-semibold focus:border-blue-400 focus:outline-none"
                placeholder="+998 93 123 45 67"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">{t('doctor_edit.address')}</label>
              <div className="group relative">
                <input
                  type="text"
                  value={formData.address}
                  onClick={() => setIsMapModalOpen(true)}
                  className="h-14 w-full cursor-pointer rounded-2xl border-2 border-blue-200 bg-white px-4 pr-28 text-lg font-semibold transition-colors group-hover:border-blue-300 focus:border-blue-400 focus:outline-none"
                  placeholder={t('doctor_edit.address_ph')}
                  readOnly
                />
                <span className="absolute right-11 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600">{t('doctor_edit.open_map')}</span>
                <MapPin className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">{t('doctor_edit.clinic')}</label>
              <input
                type="text"
                value={formData.clinic}
                onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                className="h-14 w-full rounded-2xl border-2 border-blue-200 bg-white px-4 text-lg font-semibold focus:border-blue-400 focus:outline-none"
                placeholder={t('doctor_edit.clinic_ph')}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">{t('doctor_edit.schedule')}</label>
              <div className="relative">
                <select
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="h-14 w-full appearance-none rounded-2xl border-2 border-blue-200 bg-white px-4 text-lg font-semibold focus:border-blue-400 focus:outline-none"
                >
                  {scheduleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">{t('doctor_edit.work_time')}</label>
              <div className="flex gap-4">
                <div className="flex h-14 items-center gap-2 rounded-2xl border-2 border-blue-200 bg-white px-4">
                  <input
                    type="text"
                    value={formData.workStartHour}
                    onChange={(e) => setFormData({ ...formData, workStartHour: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    className="w-12 bg-transparent text-center text-2xl font-black outline-none"
                  />
                  <div className="h-8 w-[2px] bg-gray-300" />
                  <input
                    type="text"
                    value={formData.workStartMinute}
                    onChange={(e) => setFormData({ ...formData, workStartMinute: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    className="w-12 bg-transparent text-center text-2xl font-black outline-none"
                  />
                </div>
                <div className="flex h-14 items-center gap-2 rounded-2xl border-2 border-blue-200 bg-white px-4">
                  <input
                    type="text"
                    value={formData.workEndHour}
                    onChange={(e) => setFormData({ ...formData, workEndHour: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    className="w-12 bg-transparent text-center text-2xl font-black outline-none"
                  />
                  <div className="h-8 w-[2px] bg-gray-300" />
                  <input
                    type="text"
                    value={formData.workEndMinute}
                    onChange={(e) => setFormData({ ...formData, workEndMinute: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    className="w-12 bg-transparent text-center text-2xl font-black outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-48 w-48 overflow-hidden rounded-3xl bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
              <button onClick={() => fileInputRef.current?.click()} className="text-lg font-semibold text-blue-600 hover:underline">
                {t('doctor_profile.change_photo')}
              </button>
            </div>

            <div className="rounded-3xl border-2 border-blue-200 bg-white p-6">
              <h3 className="mb-4 text-xl font-bold">{t('doctor_edit.diploma_title')}</h3>
              {dentist?.diploma_photo_url ? (
                <div className="mb-4">
                  <div className="mb-3 h-48 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${dentist.diploma_photo_url}`} alt="Diploma" className="h-full w-full object-cover" />
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
                  {t('doctor_edit.diploma_not_uploaded')}
                </div>
              )}

              <input type="file" ref={diplomaInputRef} onChange={handleDiplomaChange} className="hidden" accept="image/*,application/pdf" />
              <button
                onClick={() => diplomaInputRef.current?.click()}
                disabled={uploadDiploma.isPending}
                className="w-full rounded-xl bg-blue-50 py-3 font-bold text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50"
              >
                {uploadDiploma.isPending ? t('common.loading') : dentist?.diploma_photo_url ? t('doctor_edit.diploma_upload_new') : t('doctor_edit.diploma_add')}
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">Telegram</label>
              <input
                type="text"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                className="h-14 w-full rounded-2xl border-2 border-blue-200 bg-white px-4 text-lg font-semibold focus:border-blue-400 focus:outline-none"
                placeholder="@stomatolog"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">Instagram</label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="h-14 w-full rounded-2xl border-2 border-blue-200 bg-white px-4 text-lg font-semibold focus:border-blue-400 focus:outline-none"
                placeholder="stomatolog.uz"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">Whatsapp</label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="h-14 w-full rounded-2xl border-2 border-blue-200 bg-white px-4 text-lg font-semibold focus:border-blue-400 focus:outline-none"
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="rounded-2xl bg-blue-600 px-12 py-4 text-lg font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {updateProfile.isPending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleMapConfirm}
        initialLat={coordinates.lat}
        initialLng={coordinates.lng}
        initialAddress={formData.address}
      />
    </div>
  );
}

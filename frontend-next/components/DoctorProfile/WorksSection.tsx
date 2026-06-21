'use client';

import { type FC, useRef, useState, useEffect } from 'react';
import { Plus, ImageIcon, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useDentistProfile, useUpdateDentistProfile } from '@/api/profile';
import { toast } from '@/components/Shared/Toast';

const MAX_PHOTOS = 20;

const WorksSection: FC = () => {
    const t = useTranslations();
    const { data: dentist } = useDentistProfile();
    const updateProfile = useUpdateDentistProfile();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [workPhotos, setWorkPhotos] = useState<string[]>([]);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);

    useEffect(() => {
        if (dentist?.works_photos) {
            try {
                const photos = JSON.parse(dentist.works_photos);
                if (photos && Array.isArray(photos)) {
                    // eslint-disable-next-line react-hooks/set-state-in-effect -- dentist propidan rasmlarni boshlang'ich yuklash
                    setWorkPhotos(photos);
                }
            } catch (e) {
                console.error('Error parsing works_photos:', e);
            }
        }
    }, [dentist]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = MAX_PHOTOS - workPhotos.length;
        if (remainingSlots <= 0) {
            toast.warning(t('doctor_profile.max_photos_reached'));
            return;
        }

        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        const newPhotos: string[] = [];

        for (const file of filesToProcess) {
            const reader = new FileReader();
            await new Promise<void>((resolve) => {
                reader.onloadend = () => {
                    newPhotos.push(reader.result as string);
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        }

        const updatedPhotos = [...workPhotos, ...newPhotos];
        setWorkPhotos(updatedPhotos);

        try {
            await updateProfile.mutateAsync({
                works_photos: JSON.stringify(updatedPhotos)
            });

            setShowSuccessNotification(true);
            setTimeout(() => setShowSuccessNotification(false), 2000);
        } catch (error) {
            console.error('Failed to save photos:', error);
            toast.error(t('doctor_profile.photo_save_error'));
        }

        e.target.value = '';
    };

    const handleRemovePhoto = async (index: number) => {
        const updatedPhotos = workPhotos.filter((_, i) => i !== index);
        setWorkPhotos(updatedPhotos);

        try {
            await updateProfile.mutateAsync({
                works_photos: JSON.stringify(updatedPhotos)
            });
        } catch (error) {
            console.error('Failed to remove photo:', error);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                multiple
            />

            <div className="flex justify-between items-center mb-5">
                <h3 className="text-2xl font-bold text-[#1E2532]">
                    {t('doctor_profile.my_works')}
                    <span className="text-sm text-gray-500 ml-2">({workPhotos.length}/{MAX_PHOTOS})</span>
                </h3>
                {workPhotos.length < MAX_PHOTOS && (
                    <button
                        onClick={triggerFileUpload}
                        className="flex items-center gap-1.5 bg-[#5B7FFF] text-white px-4 py-1.5 rounded-full text-[11px] font-bold hover:bg-blue-600 transition-all"
                    >
                        {t('doctor_profile.add')}
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <Plus className="w-2.5 h-2.5 text-blue-600" strokeWidth={4} />
                        </div>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {workPhotos.map((photo, index) => (
                    <div
                        key={index}
                        className="aspect-square bg-gray-200 rounded-[24px] relative overflow-hidden group cursor-pointer border border-gray-100"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={photo}
                            alt={`Work photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <button
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {workPhotos.length < MAX_PHOTOS && (
                    <div
                        onClick={triggerFileUpload}
                        className="aspect-square bg-gray-200 rounded-[24px] flex items-center justify-center relative overflow-hidden group hover:bg-gray-300 transition-all cursor-pointer border border-gray-100"
                    >
                        <div className="w-12 h-12 flex items-center justify-center opacity-40 group-hover:scale-110 transition-transform">
                            <ImageIcon className="w-10 h-10 text-gray-500" strokeWidth={1} />
                        </div>
                    </div>
                )}
            </div>

            {showSuccessNotification && (
                <div className="fixed top-4 right-4 z-50 animate-slide-in">
                    <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-semibold text-lg">{t('doctor_profile.photo_saved')}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorksSection;

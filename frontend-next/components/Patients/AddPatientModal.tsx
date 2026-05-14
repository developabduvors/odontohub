'use client';

import React, { useState } from 'react';
import { X, Loader2, User, Phone, MapPin, Calendar, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCreatePatient } from '@/api/profile';
import { toast } from '@/components/Shared/Toast';

interface AddPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (patientId: number) => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const t = useTranslations();
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        birth_date: '',
        gender: '',
        address: ''
    });

    const createPatient = useCreatePatient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.full_name.trim() || !formData.phone.trim()) {
            toast.warning(t('patients_list.add_modal.error_required'));
            return;
        }

        try {
            const newPatient = await createPatient.mutateAsync({
                full_name: formData.full_name,
                phone: formData.phone,
                birth_date: formData.birth_date || undefined,
                gender: formData.gender || undefined,
                address: formData.address || undefined,
                source: 'doctor_added'
            });

            toast.success(t('patients_list.add_modal.success_added'));

            setFormData({
                full_name: '',
                phone: '',
                birth_date: '',
                gender: '',
                address: ''
            });

            if (onSuccess) {
                onSuccess(newPatient.id);
            }
        } catch (error: any) {
            console.error("Failed to create patient", error);
            const errorMessage = error.response?.data?.detail || "Xatolik yuz berdi";
            toast.error(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-lg rounded-[32px] p-6 md:p-10 relative shadow-2xl animate-in zoom-in-95 duration-300"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                    <X className="w-6 h-6 text-gray-400" />
                </button>

                <h2 className="text-3xl md:text-4xl font-black text-[#1a1f36] mb-8 pr-8">
                    {t('patients_list.add_modal.title')}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-500 ml-1">
                            <User size={16} />
                            {t('patients_list.add_modal.full_name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder={t('patients_list.add_modal.full_name_placeholder')}
                            className="w-full h-14 bg-[#efefef] rounded-[20px] px-6 text-base font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none transition-all placeholder:text-gray-400"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 ml-1">
                                <Phone size={16} />
                                {t('patients_list.add_modal.phone')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+998 XX XXX XX XX"
                                className="w-full h-14 bg-[#efefef] rounded-[20px] px-6 text-base font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none transition-all placeholder:text-gray-400"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 ml-1">
                                <Check size={16} />
                                {t('patients_list.add_modal.gender')}
                            </label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="w-full h-14 bg-[#efefef] rounded-[20px] px-6 text-base font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none appearance-none cursor-pointer"
                            >
                                <option value="">{t('patients_list.add_modal.gender_select')}</option>
                                <option value="male">{t('patients_list.add_modal.gender_male')}</option>
                                <option value="female">{t('patients_list.add_modal.gender_female')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-500 ml-1">
                            <Calendar size={16} />
                            {t('patients_list.add_modal.birth_date')}
                        </label>
                        <input
                            type="date"
                            value={formData.birth_date}
                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                            className="w-full h-14 bg-[#efefef] rounded-[20px] px-6 text-base font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none transition-all cursor-pointer"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-500 ml-1">
                            <MapPin size={16} />
                            {t('patients_list.add_modal.address')}
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder={t('patients_list.add_modal.address_placeholder')}
                            rows={3}
                            className="w-full bg-[#efefef] rounded-[24px] px-6 py-4 text-base font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none resize-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-100 text-gray-500 text-lg font-black rounded-[22px] hover:bg-gray-200 transition-all active:scale-[0.98] cursor-pointer"
                        >
                            {t('patients_list.add_modal.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={createPatient.isPending}
                            className="flex-2 py-4 bg-[#00e396] text-white text-lg font-black rounded-[22px] shadow-xl shadow-[#00e396]/20 hover:bg-[#00d08a] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {createPatient.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                            {t('patients_list.add_modal.add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPatientModal;

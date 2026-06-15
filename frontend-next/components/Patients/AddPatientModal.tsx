'use client';

import React, { useState } from 'react';
import { X, Loader2, User, Phone, MapPin, Calendar, Check, Link2, Copy, CheckCircle2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useCreatePatient, useGetMagicLink } from '@/api/profile';
import { toast } from '@/components/Shared/Toast';

interface AddPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (patientId: number) => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const t = useTranslations();
    const locale = useLocale();
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        birth_date: '',
        gender: '',
        address: ''
    });

    // Bemor yaratilgach magic-havolani ko'rsatadigan muvaffaqiyat ekrani holati
    const [created, setCreated] = useState<{ id: number; name: string } | null>(null);
    const [magicUrl, setMagicUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const createPatient = useCreatePatient();
    const getMagicLink = useGetMagicLink();

    const resetAll = () => {
        setFormData({ full_name: '', phone: '', birth_date: '', gender: '', address: '' });
        setCreated(null);
        setMagicUrl('');
        setCopied(false);
    };

    const handleClose = () => {
        resetAll();
        onClose();
    };

    const handleDone = () => {
        if (created && onSuccess) onSuccess(created.id);
        resetAll();
        onClose();
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(magicUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(t('magic.copy_failed'));
        }
    };

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

            // Magic-havola yaratamiz va muvaffaqiyat ekraniga o'tamiz (modal yopilmaydi)
            try {
                const link = await getMagicLink.mutateAsync(newPatient.id);
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                setMagicUrl(`${origin}/${locale}/magic/${link.token}`);
            } catch (linkErr) {
                console.error('Failed to generate magic link', linkErr);
                // Havola yaratilmasa ham bemor qo'shilgan — shunchaki havolasiz ko'rsatamiz
            }
            setCreated({ id: newPatient.id, name: newPatient.full_name });
        } catch (error: any) {
            console.error("Failed to create patient", error);
            const errorMessage = error.response?.data?.detail || "Xatolik yuz berdi";
            toast.error(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={handleClose}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-lg rounded-[32px] p-6 md:p-10 relative shadow-2xl animate-in zoom-in-95 duration-300"
            >
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                    <X className="w-6 h-6 text-gray-400" />
                </button>

                {created ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[#00e396]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                            <CheckCircle2 className="w-9 h-9 text-[#00e396]" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-[#1a1f36] mb-2">
                            {t('magic.created_title', { name: created.name })}
                        </h2>
                        <p className="text-gray-500 font-medium mb-6">{t('magic.created_desc')}</p>

                        {magicUrl ? (
                            <>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2 ml-1">
                                    <Link2 size={16} /> {t('magic.link_label')}
                                </label>
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        readOnly
                                        value={magicUrl}
                                        onFocus={(e) => e.target.select()}
                                        className="flex-1 h-14 bg-[#efefef] rounded-[18px] px-4 text-sm font-bold text-[#1a1f36] border-none outline-none truncate"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className={`h-14 px-5 rounded-[18px] font-bold flex items-center gap-2 transition-all shrink-0 ${
                                            copied ? 'bg-[#00e396] text-white' : 'bg-[#4f6bff] text-white hover:bg-[#3d56d5]'
                                        }`}
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                        {copied ? t('magic.copied') : t('magic.copy')}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 font-medium mb-6">{t('magic.link_hint')}</p>
                            </>
                        ) : (
                            <p className="text-sm text-amber-600 font-bold bg-amber-50 rounded-[16px] py-3 px-4 mb-6">
                                {t('magic.link_unavailable')}
                            </p>
                        )}

                        <button
                            onClick={handleDone}
                            className="w-full py-4 bg-[#1a1f36] text-white text-lg font-black rounded-[22px] hover:bg-[#2c3545] transition-all active:scale-[0.98]"
                        >
                            {t('magic.done')}
                        </button>
                    </div>
                ) : (
                <>
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
                            onClick={handleClose}
                            className="flex-1 py-4 bg-gray-100 text-gray-500 text-lg font-black rounded-[22px] hover:bg-gray-200 transition-all active:scale-[0.98] cursor-pointer"
                        >
                            {t('patients_list.add_modal.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={createPatient.isPending || getMagicLink.isPending}
                            className="flex-2 py-4 bg-[#00e396] text-white text-lg font-black rounded-[22px] shadow-xl shadow-[#00e396]/20 hover:bg-[#00d08a] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {(createPatient.isPending || getMagicLink.isPending) && <Loader2 className="w-5 h-5 animate-spin" />}
                            {t('patients_list.add_modal.add')}
                        </button>
                    </div>
                </form>
                </>
                )}
            </div>
        </div>
    );
};

export default AddPatientModal;

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Loader2, ChevronDown, Plus, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAllPatients, useCreatePatient } from '@/api/profile';
import { toast } from '@/components/Shared/Toast';

interface AddNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (patientId: number, note: string) => void;
}

type PatientOption = { id: number; full_name?: string; phone?: string };
type ApiError = { response?: { data?: { detail?: string } }; message?: string };

const AddNoteModal: React.FC<AddNoteModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const t = useTranslations();
    const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Quick Add State
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [newPatientPhone, setNewPatientPhone] = useState('');

    const { data: patients, isLoading: isLoadingPatients } = useAllPatients();
    const createPatient = useCreatePatient();

    const transliterate = (text: string) => {
        const latinToCyrillic: { [key: string]: string } = {
            'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'yo': 'ё', 'zh': 'ж',
            'z': 'з', 'i': 'и', 'y': 'й', 'k': 'k', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о',
            'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф', 'h': 'х', 'ts': 'ц',
            'ch': 'ч', 'sh': 'ш', 'sch': 'щ', '`': 'ъ', 'y`': 'ы', 'e`': 'э', 'yu': 'ю', 'ya': 'я'
        };
        return text.toLowerCase().split('').map(char => latinToCyrillic[char] || char).join('');
    };

    const filteredPatients = useMemo(() => {
        if (!patients || !Array.isArray(patients)) return [];
        const term = searchTerm.toLowerCase().trim();
        if (!term) return patients;

        const cyrillicTerm = transliterate(term);

        return patients.filter((p: PatientOption) => {
            const name = (p.full_name || '').toLowerCase();
            const phone = p.phone || '';
            // Basic fuzzy matching (check if name contains current term or transliterated term)
            return name.includes(term) || name.includes(cyrillicTerm) || phone.includes(term);
        });
    }, [patients, searchTerm]);

    // Ensure dropdown stays open while typing
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- qidiruv yozilganda ro'yxatni ochish kerak
        if (searchTerm.length > 0 && !selectedPatientId && !showQuickAdd) {
            setIsDropdownOpen(true);
        }
    }, [searchTerm, selectedPatientId, showQuickAdd]);

    const handleQuickAdd = async () => {
        if (!searchTerm || !newPatientPhone) return;
        try {
            const patient = await createPatient.mutateAsync({
                full_name: searchTerm,
                phone: newPatientPhone
            });
            setSelectedPatientId(patient.id);
            setSearchTerm(patient.full_name);
            setShowQuickAdd(false);
            setIsDropdownOpen(false);
            toast.success(t('patients_modals.note.toast_added'));
        } catch (error) {
            const e = error as ApiError;
            toast.error(e?.response?.data?.detail || t('patients_modals.note.toast_error'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalId = selectedPatientId;
        if (!finalId && searchTerm.trim()) {
            const match = patients?.find((p: PatientOption) =>
                (p.full_name || '').toLowerCase() === searchTerm.trim().toLowerCase() ||
                (p.full_name || '').toLowerCase() === transliterate(searchTerm.trim()).toLowerCase()
            );
            if (match) finalId = match.id;
        }

        if (!finalId || !note.trim()) {
            if (!finalId && searchTerm.trim()) {
                setShowQuickAdd(true);
                toast.info(t('patients_modals.note.toast_not_found'));
            } else {
                toast.warning(t('patients_modals.note.toast_select'));
            }
            return;
        }

        setIsSubmitting(true);
        try {
            onSuccess?.(finalId as number, note);
            setSelectedPatientId('');
            setSearchTerm('');
            setNote('');
            onClose();
            toast.success(t('patients_modals.note.toast_note_added'));
        } catch {
            toast.error(t('patients_modals.note.toast_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-lg rounded-[32px] p-6 md:p-8 relative shadow-2xl animate-in zoom-in-95 duration-200"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-gray-400" />
                </button>

                <h2 className="text-2xl md:text-3xl font-black text-[#1a1f36] mb-8">
                    {t('patients_modals.note.title')}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Patient Selection Row */}
                    <div className="relative" ref={dropdownRef}>
                        <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">
                            {t('patients_modals.note.patient')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('patients_modals.note.patient_ph')}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (selectedPatientId) setSelectedPatientId('');
                                    if (!showQuickAdd) setIsDropdownOpen(true);
                                }}
                                onFocus={() => !showQuickAdd && setIsDropdownOpen(true)}
                                autoComplete="off"
                                className="w-full h-14 bg-[#efefef] rounded-[18px] px-5 pr-12 text-base font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none"
                            />
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer hover:opacity-70"
                            >
                                {isLoadingPatients ? (
                                    <Loader2 className="w-6 h-6 text-[#1a1f36] animate-spin opacity-40" />
                                ) : (
                                    <ChevronDown className={`w-6 h-6 text-[#1a1f36] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                )}
                            </div>
                        </div>

                        {isDropdownOpen && !showQuickAdd && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-100 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map((p: PatientOption) => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedPatientId(p.id);
                                                setSearchTerm(p.full_name);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="px-6 py-4 hover:bg-[#4f6bff]/5 cursor-pointer transition-colors flex items-center gap-4 border-b border-gray-50 last:border-0"
                                        >
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-[#1a1f36] shrink-0">
                                                {p.full_name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[#1a1f36] truncate">{p.full_name}</p>
                                                <p className="text-xs text-gray-400">{p.phone || t('patients_modals.note.no_phone')}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-6 py-6 text-center">
                                        <p className="text-gray-400 font-bold mb-3">{t('patients_modals.note.no_patient')}</p>
                                        {searchTerm.trim().length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowQuickAdd(true)}
                                                className="w-full py-3 bg-[#4f6bff] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3d56d5] transition-all"
                                            >
                                                <Plus size={18} />
                                                {t('patients_modals.note.add_new')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {showQuickAdd && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] shadow-2xl border border-gray-100 z-100 p-6 animate-in slide-in-from-top-2 duration-200">
                                <h3 className="font-bold text-[#1a1f36] mb-4 flex items-center gap-2">
                                    <Plus size={18} /> {t('patients_modals.note.quick_add_title')}
                                </h3>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            placeholder={t('patients_modals.note.phone_ph')}
                                            value={newPatientPhone}
                                            onChange={(e) => setNewPatientPhone(e.target.value)}
                                            className="w-full h-14 bg-[#efefef] rounded-[15px] px-10 text-lg font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none"
                                        />
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickAdd(false)}
                                            className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-[15px] hover:bg-gray-200"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleQuickAdd}
                                            disabled={!newPatientPhone || createPatient.isPending}
                                            className="flex-2 py-3 bg-[#4f6bff] text-white font-bold rounded-[15px] hover:bg-[#3d56d5] disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {createPatient.isPending && <Loader2 size={18} className="animate-spin" />}
                                            {t('common.add')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">
                            {t('patients_modals.note.note_label')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={t('patients_modals.note.note_ph')}
                            rows={5}
                            className="w-full bg-[#efefef] rounded-[20px] p-5 text-base font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none resize-none"
                            required
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-[20px] hover:bg-gray-200 transition-all cursor-pointer"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (!selectedPatientId && !searchTerm.trim()) || !note.trim()}
                            className="flex-2 py-4 bg-[#00e396] text-white text-lg font-black rounded-[20px] shadow-lg shadow-[#00e396]/20 hover:bg-[#00d08a] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                            {t('patients_modals.note.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddNoteModal;

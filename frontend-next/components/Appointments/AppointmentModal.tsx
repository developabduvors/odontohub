'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ChevronDown, Loader2, Plus, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useCreateAppointment } from '@/api/appointments';
import { useAllPatients, useCreatePatient, useDentistProfile } from '@/api/profile';
import { useServices } from '@/api/services';
import { toast } from '@/components/Shared/Toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const AppointmentModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const t = useTranslations();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: patients, isLoading: isLoadingPatients } = useAllPatients();
    const { data: dentist } = useDentistProfile();
    const { data: servicesData = [] } = useServices(dentist?.id);
    const createAppointment = useCreateAppointment();
    const createPatient = useCreatePatient();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState<string | number>('');
    const [selectedService, setSelectedService] = useState('');
    const [notes, setNotes] = useState('');
    const [visitType, setVisitType] = useState<'primary' | 'repeat'>('primary');

    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [newPatientPhone, setNewPatientPhone] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const now = new Date();
    const [selectedDay, setSelectedDay] = useState(now.getDate());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [hour, setHour] = useState(String(now.getHours()).padStart(2, '0'));
    const [minute, setMinute] = useState('00');

    // Doktorning haqiqiy xizmatlari API'dan — qotirilgan mock ro'yxat o'rniga
    const services = servicesData.map((s) => ({
        id: s.id,
        name: s.name,
        label: s.name,
        price: String(s.price),
        currency: s.currency || 'UZS',
    }));

    // Xizmatlar yuklangach birinchisini avtomatik tanlash
    useEffect(() => {
        if (!selectedService && services.length > 0) {
            setSelectedService(services[0].name);
        }
    }, [services, selectedService]);

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

        return patients.filter((p: any) => {
            const name = p.full_name?.toLowerCase() || '';
            const phone = p.phone || '';
            return name.includes(term) || name.includes(cyrillicTerm) || phone.includes(term);
        });
    }, [searchTerm, patients]);

    useEffect(() => {
        if (searchTerm.length > 0 && !selectedPatientId) {
            setIsDropdownOpen(true);
        }
    }, [searchTerm, selectedPatientId]);

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: t(`common.months.${i}`)
    }));
    const years = Array.from({ length: 11 }, (_, i) => 2024 + i);

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
            toast.success(t('modal.toast_patient_added'));
        } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || error?.message || t('appointments.toasts.error');
            toast.error(errorMessage);
        }
    };

    const handleSave = async () => {
        let finalPatientId = selectedPatientId;

        if (!finalPatientId) {
            if (searchTerm.trim().length > 0) {
                const exactMatch = patients?.find((p: any) =>
                    p.full_name?.toLowerCase() === searchTerm.trim().toLowerCase() ||
                    p.full_name?.toLowerCase() === transliterate(searchTerm.trim()).toLowerCase()
                );

                if (exactMatch) {
                    finalPatientId = exactMatch.id;
                    setSelectedPatientId(exactMatch.id);
                    setSearchTerm(exactMatch.full_name);
                } else {
                    setShowQuickAdd(true);
                    toast.info(t('modal.toast_not_found'));
                    return;
                }
            } else {
                toast.error(t('modal.select_patient'));
                return;
            }
        }

        if (!selectedService) {
            toast.error(t('modal.no_services'));
            return;
        }

        let dentistId = dentist?.id;
        if (!dentistId) {
            try {
                const u = JSON.parse(localStorage.getItem('user_data') || '{}');
                dentistId = u.dentist_id;
            } catch {}
        }

        if (!dentistId) {
            toast.error(t('modal.no_dentist'));
            return;
        }

        try {
            const start = new Date(selectedYear, selectedMonth, selectedDay, parseInt(hour), parseInt(minute));
            const end = new Date(start.getTime() + 60 * 60 * 1000);

            const selectedServiceObj = services.find(s => s.name === selectedService);
            const servicePrice = selectedServiceObj ? parseFloat(selectedServiceObj.price) : undefined;

            await createAppointment.mutateAsync({
                dentist_id: dentistId,
                patient_id: Number(finalPatientId),
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                service: selectedService,
                notes: notes,
                price: servicePrice
            });

            toast.success(t('modal.saved'));
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || error?.message || t('appointments.toasts.error');
            toast.error(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-2xl rounded-[32px] p-6 md:p-8 relative shadow-2xl animate-in zoom-in-95 duration-200 cursor-default overflow-visible"
            >
                <div
                    onClick={onClose}
                    className="absolute top-4 right-4 md:top-6 md:right-6 cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors group"
                >
                    <X className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:text-[#1a1f36] transition-colors" />
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-center text-[#1a1f36] mb-6 md:mb-8 tracking-tight">
                    {t('modal.title')}
                </h2>

                <div className="space-y-4 md:space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:gap-5 relative" ref={dropdownRef}>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('modal.name_placeholder')}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (selectedPatientId) setSelectedPatientId('');
                                    if (!showQuickAdd) setIsDropdownOpen(true);
                                }}
                                onFocus={() => !showQuickAdd && setIsDropdownOpen(true)}
                                autoComplete="off"
                                className="w-full h-12 md:h-14 bg-[#efefef] rounded-[16px] px-5 text-base md:text-lg font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none"
                            />
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer hover:opacity-70 transition-opacity"
                            >
                                {isLoadingPatients ? (
                                    <Loader2 className="w-6 h-6 text-[#1a1f36] animate-spin opacity-40" />
                                ) : (
                                    <ChevronDown className={`w-6 h-6 text-[#1a1f36] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                )}
                            </div>
                        </div>

                        {isDropdownOpen && !showQuickAdd && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] shadow-2xl border border-gray-100 z-100 max-h-72 overflow-y-auto overflow-x-hidden animate-in slide-in-from-top-2 duration-200">
                                {filteredPatients && filteredPatients.length > 0 ? (
                                    filteredPatients.map((p: any) => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedPatientId(p.id);
                                                setSearchTerm(p.full_name || '');
                                                setIsDropdownOpen(false);
                                            }}
                                            className="px-6 py-4 hover:bg-[#4f6bff]/10 cursor-pointer transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                                        >
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-[#1a1f36] shrink-0">
                                                {p.full_name?.charAt(0) || 'P'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[#1a1f36] truncate">{p.full_name || t('modal.unnamed_patient')}</p>
                                                <p className="text-xs text-gray-400">{p.phone || t('modal.no_phone')}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 px-6">
                                        <div className="py-4 text-center text-gray-400 font-bold">
                                            {(patients?.length || 0) > 0
                                                ? t('common.no_results')
                                                : t('modal.empty_patients')}
                                        </div>
                                        {searchTerm.trim().length > 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowQuickAdd(true);
                                                }}
                                                className="w-full mt-2 py-4 bg-[#4f6bff] text-white rounded-[18px] font-bold flex items-center justify-center gap-2 hover:bg-[#3d56d5] transition-all shadow-lg shadow-[#4f6bff]/20"
                                            >
                                                <Plus size={20} />
                                                <span>{t('modal.add_new_named', { term: searchTerm })}</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {showQuickAdd && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] shadow-2xl border border-gray-100 z-100 p-6 animate-in slide-in-from-top-2 duration-200">
                                <h3 className="font-bold text-[#1a1f36] mb-4 flex items-center gap-2">
                                    <Plus size={18} /> {t('modal.quick_add_title')}
                                </h3>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            placeholder={t('modal.phone_placeholder')}
                                            value={newPatientPhone}
                                            onChange={(e) => setNewPatientPhone(e.target.value)}
                                            className="w-full h-14 bg-[#efefef] rounded-[15px] px-10 text-lg font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none"
                                        />
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowQuickAdd(false)}
                                            className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-[15px] hover:bg-gray-200 transition-colors"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            onClick={handleQuickAdd}
                                            disabled={!newPatientPhone || createPatient.isPending}
                                            className="flex-2 py-3 bg-[#4f6bff] text-white font-bold rounded-[15px] hover:bg-[#3d56d5] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            {createPatient.isPending && <Loader2 size={18} className="animate-spin" />}
                                            {t('modal.create_select')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                        <div className="relative">
                            <select
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                                className="w-full h-12 md:h-14 bg-[#efefef] rounded-[16px] px-5 text-base md:text-lg font-bold text-[#1a1f36] border-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#4f6bff]/20 outline-none"
                            >
                                {services?.map((s: any) => (
                                    <option key={s.id} value={s.name}>
                                        {s.label} - {s.price} {s.currency || 'UZS'}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1f36] pointer-events-none opacity-40" />
                        </div>
                        <div className="relative">
                            <select
                                value={visitType}
                                onChange={(e) => setVisitType(e.target.value as 'primary' | 'repeat')}
                                className="w-full h-12 md:h-14 bg-[#efefef] rounded-[16px] px-5 text-base md:text-lg font-bold text-[#1a1f36] border-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#4f6bff]/20 outline-none"
                            >
                                <option value="primary">{t('modal.patient_statuses.primary')}</option>
                                <option value="repeat">{t('modal.patient_statuses.recurring')}</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1f36] pointer-events-none opacity-40" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr] gap-4 md:gap-5 items-end">
                        <div className="flex flex-col gap-2">
                            <label className="text-left text-sm font-bold text-gray-500 ml-2">{t('modal.date_placeholder')}</label>
                            <div className="flex gap-2 h-12 md:h-14">
                                <div className="relative flex-1">
                                    <select
                                        value={selectedDay}
                                        onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                                        className="w-full h-full bg-[#efefef] rounded-[16px] px-3 pr-8 text-base md:text-lg font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none appearance-none cursor-pointer"
                                    >
                                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5f6377] pointer-events-none" />
                                </div>
                                <div className="relative flex-2">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="w-full h-full bg-[#efefef] rounded-[16px] px-3 pr-8 text-base md:text-lg font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none appearance-none cursor-pointer"
                                    >
                                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5f6377] pointer-events-none" />
                                </div>
                                <div className="relative flex-1">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="w-full h-full bg-[#efefef] rounded-[16px] px-3 pr-8 text-base md:text-lg font-bold text-[#1a1f36] border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none appearance-none cursor-pointer"
                                    >
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5f6377] pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-right text-sm font-bold text-gray-500 mr-2">{t('modal.time_label')}</label>
                            <div className="flex items-center gap-2 bg-[#efefef] rounded-[16px] p-2 h-12 md:h-14 px-4 justify-center">
                                <input
                                    type="text"
                                    value={hour}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                        const num = parseInt(val) || 0;
                                        setHour(num > 23 ? '23' : val);
                                    }}
                                    className="w-12 md:w-16 bg-transparent text-center text-2xl md:text-3xl font-black text-[#1a1f36] outline-none border-none p-0 focus:ring-0"
                                />
                                <div className="h-6 md:h-8 w-[2px] bg-gray-300 mx-1 md:mx-2"></div>
                                <input
                                    type="text"
                                    value={minute}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                        const num = parseInt(val) || 0;
                                        setMinute(num > 59 ? '59' : val);
                                    }}
                                    className="w-12 md:w-16 bg-transparent text-center text-2xl md:text-3xl font-black text-[#1a1f36] outline-none border-none p-0 focus:ring-0"
                                />
                            </div>
                        </div>
                    </div>

                    <textarea
                        placeholder={t('modal.notes_placeholder')}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full h-24 md:h-32 bg-[#efefef] rounded-[16px] p-4 md:p-5 text-base md:text-lg font-bold text-[#1a1f36] placeholder:text-gray-500 border-none focus:ring-2 focus:ring-[#4f6bff]/20 outline-none resize-none"
                    ></textarea>

                    <button
                        onClick={handleSave}
                        disabled={createAppointment.isPending}
                        className={`w-full py-4 md:py-5 rounded-[20px] text-white text-lg md:text-xl font-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer ${
                            createAppointment.isPending
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-[#00e396] hover:bg-[#00d08a] shadow-lg shadow-[#00e396]/20'
                        }`}
                    >
                        {createAppointment.isPending && <Loader2 className="animate-spin" />}
                        {createAppointment.isPending ? t('common.saving') : t('modal.record')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentModal;

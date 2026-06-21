'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Paperclip, Plus, Clock, Save, Edit3, Loader2, X, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUpdateAppointment } from '@/api/appointments';
import { createPayment } from '@/api/payments';
import { toast } from '@/components/Shared/Toast';

interface InProgressViewProps {
    onBack: () => void;
    appointment: {
        id: number;
        patientName: string;
        service: string;
        notes?: string | null;
        raw?: Record<string, unknown>;
    } | null;
}

const InProgressView: React.FC<InProgressViewProps> = ({ onBack, appointment }) => {
    const t = useTranslations();
    const updateMutation = useUpdateAppointment();

    const [notes, setNotes] = useState(appointment?.notes || '');
    const [isEditingNotes, setIsEditingNotes] = useState(false);

    // visit_type state — default from appointment or "primary"
    const [visitType, setVisitType] = useState<'primary' | 'follow_up'>(
        appointment?.raw?.visit_type === 'follow_up' ? 'follow_up' : 'primary'
    );

    // "Завершить лечение" modal
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [treatmentPrice, setTreatmentPrice] = useState<string>(
        appointment?.raw?.price ? String(appointment.raw.price) : ''
    );
    const [isFinishing, setIsFinishing] = useState(false);

    /* eslint-disable react-hooks/set-state-in-effect -- appointment prop o'zgarganda derived holatlarni sinxronlash kerak */
    useEffect(() => {
        if (appointment?.notes) setNotes(appointment.notes);
        if (appointment?.raw?.visit_type) {
            setVisitType(appointment.raw.visit_type === 'follow_up' ? 'follow_up' : 'primary');
        }
        if (appointment?.raw?.price) {
            setTreatmentPrice(String(appointment.raw.price));
        }
    }, [appointment]);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (!appointment) return null;

    const patientId = appointment.raw?.patient_id as number | undefined;

    const handleSaveNotes = async () => {
        try {
            await updateMutation.mutateAsync({ id: appointment.id, notes });
            setIsEditingNotes(false);
            toast.success(t('appointments.toasts.notes_saved'));
        } catch {
            toast.error(t('appointments.toasts.error'));
        }
    };

    const handleVisitTypeChange = async (vt: 'primary' | 'follow_up') => {
        setVisitType(vt);
        try {
            await updateMutation.mutateAsync({ id: appointment.id, visit_type: vt });
        } catch {
            toast.error(t('appointments.toasts.error'));
        }
    };

    // Завершить приём — faqat appointmentni yopadi
    const handleFinishAppointment = async () => {
        try {
            await updateMutation.mutateAsync({ id: appointment.id, status: 'completed' });
            toast.success(t('appointments.toasts.appointment_finished'));
            onBack();
        } catch {
            toast.error(t('appointments.toasts.error'));
        }
    };

    // Завершить лечение — appointmentni yopadi + to'lov yaratadi
    const handleFinishTreatment = async () => {
        const amount = parseFloat(treatmentPrice);
        if (!amount || amount <= 0) {
            toast.error(t('appointments.progress.err_price'));
            return;
        }
        if (!patientId) {
            toast.error(t('appointments.progress.err_patient_id'));
            return;
        }
        setIsFinishing(true);
        try {
            await updateMutation.mutateAsync({ id: appointment.id, status: 'completed' });
            await createPayment(patientId, {
                amount,
                paid_amount: 0,
                service_name: appointment.service,
                appointment_id: appointment.id,
                status: 'pending',
                notes: `Davolanish tugallandi: ${appointment.service}`,
            });
            toast.success(t('appointments.progress.payment_created', { amount: amount.toLocaleString() }));
            setShowFinishModal(false);
            onBack();
        } catch {
            toast.error(t('appointments.toasts.error'));
        } finally {
            setIsFinishing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="bg-[#1a1f36] rounded-full p-1 cursor-pointer hover:bg-[#2a2f46] transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-3xl font-black text-[#1a1f36] tracking-tight">
                        {t('appointments.title')}
                    </h1>
                </div>
                <h2 className="text-4xl lg:text-5xl font-extrabold text-[#4f6bff] tracking-tight">
                    {t('appointments.statuses.in_progress')}
                </h2>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Card + Visit Type */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm flex flex-col gap-5">
                    <div className="flex items-center gap-6">
                        <div className="w-32 h-32 bg-[#e0e0e0] rounded-[24px] shrink-0 flex items-center justify-center font-black text-4xl text-gray-400">
                            {appointment.patientName?.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-[#1a1f36] leading-tight">
                                {appointment.patientName}
                            </h3>
                            <p className="text-gray-400 font-bold mt-1">{appointment.service}</p>
                        </div>
                    </div>

                    {/* Первичный / Повторный toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleVisitTypeChange('primary')}
                            className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${
                                visitType === 'primary'
                                    ? 'bg-[#4f6bff] text-white shadow-lg shadow-[#4f6bff]/20'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {t('appointments.progress.visit_primary')}
                        </button>
                        <button
                            onClick={() => handleVisitTypeChange('follow_up')}
                            className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${
                                visitType === 'follow_up'
                                    ? 'bg-[#4f6bff] text-white shadow-lg shadow-[#4f6bff]/20'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {t('appointments.progress.visit_repeat')}
                        </button>
                    </div>
                </div>

                {/* Timer */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm flex items-center justify-center">
                    <div className="flex items-center gap-4 text-6xl md:text-7xl font-black text-[#1a1f36]">
                        <span>01</span>
                        <span className="opacity-30">:</span>
                        <span>20</span>
                        <span className="opacity-30">:</span>
                        <span className="text-[#4f6bff]">54</span>
                    </div>
                </div>

                {/* Medical Cards */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Recipe */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm relative group min-h-[220px]">
                        <h4 className="text-2xl font-black text-[#1a1f36] mb-4">{t('appointments.progress.recipe')}</h4>
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-300 italic">
                            <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                            <span>{t('appointments.progress.no_recipe')}</span>
                        </div>
                        <button className="absolute bottom-6 right-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#4f6bff] hover:text-white transition-all cursor-pointer">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm relative group min-h-[220px] flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-2xl font-black text-[#fdbc31]">{t('appointments.progress.notes')}</h4>
                            {!isEditingNotes && (
                                <button
                                    onClick={() => setIsEditingNotes(true)}
                                    className="p-2 bg-amber-50 text-[#fdbc31] rounded-xl hover:bg-[#fdbc31] hover:text-white transition-all cursor-pointer"
                                >
                                    <Edit3 size={18} />
                                </button>
                            )}
                        </div>
                        <div className="flex-1">
                            {isEditingNotes ? (
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={t('appointments.detail.notes_ph')}
                                    className="w-full h-24 bg-amber-50/50 rounded-2xl p-4 text-[#1a1f36] font-bold border-none focus:ring-2 focus:ring-[#fdbc31]/20 outline-none resize-none"
                                    autoFocus
                                />
                            ) : (
                                <div className="flex items-start gap-3 text-lg font-medium text-[#1a1f36] italic">
                                    <div className="w-2 h-2 bg-[#fdbc31] rounded-full mt-2.5 shrink-0"></div>
                                    <p className={notes ? "" : "text-gray-300"}>{notes || t('appointments.detail.no_notes')}</p>
                                </div>
                            )}
                        </div>
                        {isEditingNotes && (
                            <div className="mt-4 flex gap-2">
                                <button onClick={() => setIsEditingNotes(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={updateMutation.isPending}
                                    className="flex-1 py-3 bg-[#fdbc31] text-white font-black rounded-xl shadow-lg shadow-[#fdbc31]/20 hover:bg-[#e09d15] transition-all flex items-center justify-center gap-2"
                                >
                                    {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {t('common.save')}
                                </button>
                            </div>
                        )}
                        {!isEditingNotes && !notes && (
                            <button onClick={() => setIsEditingNotes(true)} className="absolute bottom-6 right-6 w-12 h-12 bg-[#fdbc31] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#fdbc31]/20 hover:scale-110 transition-all cursor-pointer">
                                <Plus className="w-6 h-6" />
                            </button>
                        )}
                    </div>

                    {/* Allergies */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm relative group min-h-[220px]">
                        <h4 className="text-2xl font-black text-[#ff3b30] mb-4">{t('appointments.progress.allergies')}</h4>
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-300 italic">
                            <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                            <span>{t('appointments.progress.no_allergies')}</span>
                        </div>
                        <button className="absolute bottom-6 right-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#4f6bff] hover:text-white transition-all cursor-pointer">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Media & Service */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    <div className="md:col-span-5 bg-[#e9ebf0] rounded-[32px] p-10 flex items-center justify-center gap-4 cursor-pointer hover:bg-gray-200 transition-colors">
                        <Paperclip className="w-8 h-8 text-[#1a1f36]" />
                        <span className="text-2xl font-black text-[#1a1f36] underline">
                            {t('appointments.progress.attach_photo')}
                        </span>
                    </div>

                    <div className="md:col-span-4 bg-[#5377f7] rounded-[32px] p-8 text-white flex flex-col justify-between min-h-[160px]">
                        <div className="flex justify-between items-start">
                            <h3 className="text-2xl font-black">{appointment.service}</h3>
                        </div>
                        <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                            <span className="text-2xl font-black">
                                {appointment.raw?.price
                                    ? `${Number(appointment.raw.price).toLocaleString()} ${t('appointments.detail.sum')}`
                                    : `— ${t('appointments.detail.sum')}`}
                            </span>
                            <span className="text-[12px] font-bold opacity-70 italic">
                                {visitType === 'primary' ? t('appointments.progress.visit_primary') : t('appointments.progress.visit_repeat')}
                            </span>
                        </div>
                    </div>

                    <button className="md:col-span-3 bg-[#10d16d] rounded-[32px] p-8 text-white flex flex-col items-center justify-center gap-4 hover:bg-[#0eca69] transition-all active:scale-[0.98] shadow-lg shadow-[#10d16d]/20 cursor-pointer text-center">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Clock className="w-8 h-8" />
                        </div>
                        <span className="text-lg font-black leading-tight">
                            {t('appointments.progress.schedule_next')}
                        </span>
                    </button>
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
                {/* Завершить приём */}
                <button
                    onClick={handleFinishAppointment}
                    disabled={updateMutation.isPending}
                    className="flex-1 min-w-[200px] h-16 bg-[#5377f7] text-white text-xl font-black rounded-3xl shadow-lg shadow-[#5377f7]/20 hover:bg-[#4669eb] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 disabled:opacity-60"
                >
                    {updateMutation.isPending
                        ? <Loader2 size={20} className="animate-spin" />
                        : <CheckCircle size={20} />}
                    {t('appointments.actions.finish_appointment')}
                </button>

                {/* Завершить лечение */}
                <button
                    onClick={() => setShowFinishModal(true)}
                    className="flex-1 min-w-[200px] h-16 bg-[#10d16d] text-white text-xl font-black rounded-3xl shadow-lg shadow-[#10d16d]/20 hover:bg-[#0eca69] transition-all active:scale-[0.98] cursor-pointer"
                >
                    {t('appointments.actions.finish_treatment')}
                </button>
            </div>

            {/* ── Завершить лечение modal ── */}
            {showFinishModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFinishModal(false)} />
                    <div className="relative bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
                        <button
                            onClick={() => setShowFinishModal(false)}
                            className="absolute top-5 right-5 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-2xl font-black text-[#1a1f36] mb-1">{t('appointments.actions.finish_treatment')}</h3>
                        <p className="text-gray-400 font-medium mb-6">
                            {appointment.service} · {appointment.patientName}
                        </p>

                        <label className="block text-sm font-bold text-gray-500 mb-2">
                            {t('appointments.progress.payment_amount')}
                        </label>
                        <input
                            type="number"
                            value={treatmentPrice}
                            onChange={(e) => setTreatmentPrice(e.target.value)}
                            placeholder={t('appointments.progress.price_ph')}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-2xl font-black text-[#1a1f36] outline-none focus:ring-2 focus:ring-[#10d16d]/30 focus:border-[#10d16d] transition-all mb-2"
                            autoFocus
                        />
                        {treatmentPrice && (
                            <p className="text-sm text-gray-400 mb-6">
                                = {Number(treatmentPrice).toLocaleString()} {t('appointments.detail.sum')}
                            </p>
                        )}

                        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-6 text-sm text-amber-700 font-medium">
                            {t('appointments.progress.finish_note')}
                        </div>

                        <button
                            onClick={handleFinishTreatment}
                            disabled={isFinishing || !treatmentPrice}
                            className="w-full py-5 bg-[#10d16d] text-white text-xl font-black rounded-2xl shadow-lg shadow-[#10d16d]/20 hover:bg-[#0eca69] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isFinishing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                            {t('appointments.progress.confirm')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InProgressView;

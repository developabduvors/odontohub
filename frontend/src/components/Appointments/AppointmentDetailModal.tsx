import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Video, Edit3, Save, Loader2, X, CheckCircle } from 'lucide-react';
import { type AppointmentStatus } from './AppointmentCard';
import { useCancelAppointment, useRescheduleAppointment, useUpdateAppointment } from '../../api/appointments';
import RescheduleModal from './RescheduleModal';
import { toast } from '../Shared/Toast';

interface AppointmentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: {
        id: number;
        time: string;
        date: string;
        service: string;
        patientName: string;
        status: AppointmentStatus;
        raw?: any;
    } | null;
    onSuccess?: (message: string, type: 'success' | 'error') => void;
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({ isOpen, onClose, appointment, onSuccess }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

    // Notes editing state
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notes, setNotes] = useState(appointment?.raw?.notes || '');

    const cancelMutation = useCancelAppointment();
    const rescheduleMutation = useRescheduleAppointment();
    const updateMutation = useUpdateAppointment();

    useEffect(() => {
        if (appointment?.raw?.notes) {
            setNotes(appointment.raw.notes);
        } else {
            setNotes('');
        }
    }, [appointment?.raw?.notes, isOpen]);

    if (!isOpen || !appointment) return null;

    const handleCancel = async () => {
        if (confirm('Вы уверены что хотите отменить этот приём?')) {
            try {
                await cancelMutation.mutateAsync({ id: appointment.id });
                onSuccess?.('Приём успешно отменён', 'success');
                onClose();
            } catch (error) {
                onSuccess?.('Ошибка при отмене приёма', 'error');
            }
        }
    };

    const handleReschedule = async (startTime: string, endTime: string) => {
        try {
            await rescheduleMutation.mutateAsync({
                id: appointment.id,
                start_time: startTime,
                end_time: endTime
            });
            onSuccess?.('Приём успешно перенесён', 'success');
            setIsRescheduleOpen(false);
            onClose();
        } catch (error) {
            onSuccess?.('Ошибка при переносе приёма', 'error');
        }
    };

    const handleSaveNotes = async () => {
        try {
            await updateMutation.mutateAsync({
                id: appointment.id,
                notes: notes
            });
            setIsEditingNotes(false);
            toast.success(t('appointments.toasts.notes_saved'));
        } catch (error) {
            toast.error('Хатолик юз берди');
        }
    };

    const handleStart = async () => {
        try {
            await updateMutation.mutateAsync({
                id: appointment.id,
                status: 'in_progress'
            });
            toast.success(t('appointments.toasts.started'));
            onClose();
        } catch (error) {
            toast.error('Хатолик юз берди');
        }
    };

    const statusColors: Record<AppointmentStatus, string> = {
        'completed': 'text-[#10d16d]',
        'cancelled': 'text-[#ff4560]',
        'rescheduled': 'text-[#feb019]',
        'in_progress': 'text-[#4f6bff]',
        'in_queue': 'text-[#6c757d]',
        'pending': 'text-[#feb019]',
    };

    const canStart = appointment.status === 'pending' || appointment.status === 'in_queue';

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-[400px] h-full shadow-2xl animate-in slide-in-from-right duration-300 p-8 flex flex-col overflow-y-auto"
            >
                {/* Header with Close */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-[#1a1f36]">Детальная информация</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Patient Info */}
                <div className="space-y-6 flex-1">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold">{t('appointments.detail.patient')}</span>
                        <span className="text-[#1a1f36] text-xl font-black">{appointment.patientName}</span>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold">{t('appointments.detail.time')}</span>
                            <span className="text-[#1a1f36] text-xl font-black">{appointment.time}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold">{t('appointments.detail.date')}</span>
                            <span className="text-[#1a1f36] text-xl font-black">{appointment.date || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold">{t('appointments.detail.status')}</span>
                            <span className={`text-xl font-black ${statusColors[appointment.status]}`}>
                                {t(`appointments.statuses.${appointment.status}`)}
                            </span>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-500 font-bold">Эслатмалар (Заметки):</span>
                            {!isEditingNotes && (
                                <button
                                    onClick={() => setIsEditingNotes(true)}
                                    className="p-2 bg-amber-50 text-[#fdbc31] rounded-lg hover:bg-[#fdbc31] hover:text-white transition-all cursor-pointer"
                                >
                                    <Edit3 size={16} />
                                </button>
                            )}
                        </div>

                        {isEditingNotes ? (
                            <div className="space-y-3">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Заметка ёзинг..."
                                    className="w-full h-32 bg-amber-50/50 rounded-2xl p-4 text-[#1a1f36] font-medium border-none focus:ring-2 focus:ring-[#fdbc31]/20 outline-none resize-none"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditingNotes(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Бекор қилиш
                                    </button>
                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={updateMutation.isPending}
                                        className="flex-2 py-3 bg-[#fdbc31] text-white font-black rounded-xl shadow-lg shadow-[#fdbc31]/20 hover:bg-[#e09d15] transition-all flex items-center justify-center gap-2"
                                    >
                                        {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        Сақлаш
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className={`text-[#1a1f36] font-medium italic ${!notes ? 'text-gray-300' : ''}`}>
                                {notes || "Эслатмалар йўқ"}
                            </p>
                        )}
                    </div>

                    {/* Service Box */}
                    <div className="mt-8 bg-[#4f6bff] rounded-[24px] p-6 text-white space-y-4">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-black">{appointment.service}</h3>
                            <span className="text-[12px] font-bold bg-white/20 px-3 py-1 rounded-full text-white">
                                {t('appointments.detail.initial')}
                            </span>
                        </div>
                        {appointment.raw?.price && (
                            <div className="pt-4 border-t border-white/20">
                                <span className="text-2xl font-black">{appointment.raw.price.toLocaleString()} <span className="text-sm">сум</span></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col gap-3 mt-8">
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/video-call', {
                                    state: {
                                        participant: { name: appointment.patientName, role: 'patient' },
                                        appointmentId: appointment.id
                                    }
                                });
                            }}
                            className="w-full py-5 bg-[#4E70FF] text-white text-xl font-black rounded-[24px] shadow-lg shadow-blue-500/30 hover:bg-[#3d5ce0] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <Video size={22} />
                            Онлайн консультация
                        </button>
                    )}

                    {canStart && (
                        <button
                            onClick={handleStart}
                            disabled={updateMutation.isPending}
                            className="w-full py-5 bg-[#10d16d] text-white text-xl font-black rounded-[24px] shadow-lg shadow-[#10d16d]/30 hover:bg-[#0eca69] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60"
                        >
                            {updateMutation.isPending ? <Loader2 size={22} className="animate-spin" /> : <CheckCircle size={22} className="text-white" />}
                            {t('appointments.actions.start')}
                        </button>
                    )}
                    <div className="flex gap-3">
                        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                            <>
                                <button
                                    onClick={() => setIsRescheduleOpen(true)}
                                    className="flex-1 py-5 bg-[#feb019] text-white text-xl font-black rounded-[24px] shadow-lg shadow-[#feb019]/30 hover:bg-[#e09d15] transition-all active:scale-[0.98]"
                                >
                                    Перенести
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-5 bg-[#ff4560] text-white text-xl font-black rounded-[24px] shadow-lg shadow-[#ff4560]/30 hover:bg-[#e03d54] transition-all active:scale-[0.98]"
                                >
                                    Отменить
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Reschedule Modal */}
            {appointment.raw?.start_time && (
                <RescheduleModal
                    isOpen={isRescheduleOpen}
                    onClose={() => setIsRescheduleOpen(false)}
                    onConfirm={handleReschedule}
                    currentStartTime={appointment.raw.start_time}
                />
            )}
        </div>
    );
};

export default AppointmentDetailModal;

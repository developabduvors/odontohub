'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FaStar } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import api from '@/api/api';
import { toast } from '@/components/Shared/Toast';

interface ReviewButtonProps {
    inline?: boolean;
}

const ReviewButton: React.FC<ReviewButtonProps> = ({ inline = false }) => {
    const t = useTranslations();
    const { id } = useParams<{ id: string }>();
    const [showModal, setShowModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!rating) { toast.warning('Yulduz tanlang'); return; }
        setSubmitting(true);
        try {
            // appointment dan dentist_id ni olish
            const aptRes = await api.get(`/appointments/${id}`);
            const dentist_id = aptRes.data.dentist_id;

            await api.post('/reviews/', {
                dentist_id,
                appointment_id: parseInt(id || '0'),
                rating,
                comment: comment || null,
            });
            toast.success(t('patient.appointment_detail.review_success'));
            setSubmitted(true);
            setShowModal(false);
        } catch {
            toast.error('Xatolik yuz berdi');
        } finally {
            setSubmitting(false);
        }
    };

    if (inline) {
        if (submitted) {
            return (
                <div className="text-center py-6 bg-green-50 rounded-2xl border border-green-100 animate-in fade-in duration-500">
                    <p className="text-[#11D76A] font-black text-lg">✓ {t('patient.appointment_detail.review_success')}</p>
                    <p className="text-gray-500 text-sm font-bold mt-1">{t('patient.appointment_detail.thanks_review')}</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Stars */}
                <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map(star => (
                        <FaStar
                            key={star}
                            size={44}
                            className="cursor-pointer transition-all duration-150 hover:scale-110 active:scale-90"
                            color={star <= (hover || rating) ? '#FFC107' : '#E4E5E9'}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
                {rating > 0 && (
                    <p className="text-center text-sm font-black text-[#FFC107] animate-in zoom-in duration-200">
                        {t(`patient.appointment_detail.rating_${rating}`)}
                    </p>
                )}

                <textarea
                    className="w-full h-32 bg-[#f5f7fb] rounded-[24px] p-5 text-[#1D1D2B] placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#5377f7]/20 border-none text-base font-bold shadow-inner"
                    placeholder={t('patient.appointment_detail.placeholder_review')}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                />

                <button
                    onClick={handleSubmit}
                    disabled={submitting || !rating}
                    className="w-full py-5 rounded-[20px] bg-[#11D76A] text-white text-xl font-black shadow-lg shadow-[#11D76A]/20 hover:bg-[#0eca69] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                >
                    {submitting ? <Loader2 size={24} className="animate-spin text-white" /> : t('patient.appointment_detail.send_review')}
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <button
                    onClick={() => setShowModal(true)}
                    disabled={submitted}
                    className={`w-full h-14 rounded-[20px] text-white text-lg font-bold transition-all active:scale-95 shadow-lg ${submitted
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-[#5377f7] hover:bg-[#4156d9] shadow-blue-500/20'
                        }`}
                >
                    {submitted ? '✓ Baho qoldirildi' : '⭐ Baho qoldirish'}
                </button>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-black text-[#1D1D2B] text-center mb-2">Baho qoldiring</h2>
                        <p className="text-gray-400 text-sm text-center mb-6">Doktor xizmatini baholang</p>

                        {/* Stars */}
                        <div className="flex justify-center gap-3 mb-6">
                            {[1, 2, 3, 4, 5].map(star => (
                                <FaStar
                                    key={star}
                                    size={44}
                                    className="cursor-pointer transition-all duration-150 hover:scale-110"
                                    color={star <= (hover || rating) ? '#FFC107' : '#E4E5E9'}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-center text-sm font-bold text-[#FFC107] mb-4">
                                {['', 'Yomon', 'Qoniqarli', 'Yaxshi', 'Juda yaxshi', 'Ajoyib!'][rating]}
                            </p>
                        )}

                        <textarea
                            className="w-full h-32 bg-[#f5f7fb] rounded-[20px] p-4 text-[#1D1D2B] placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#5377f7]/30 text-sm font-medium mb-6"
                            placeholder="Izoh qoldiring (ixtiyoriy)..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                            >
                                Bekor
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !rating}
                                className="flex-[2] py-3.5 rounded-2xl bg-[#11D76A] text-white font-bold hover:bg-[#0fc460] transition disabled:opacity-50"
                            >
                                {submitting ? 'Yuborilmoqda...' : 'Yuborish'}
                            </button>
                        </div>
                    </div>
                    <div className="absolute inset-0 -z-10" onClick={() => setShowModal(false)} />
                </div>
            )}
        </>
    );
};

export default ReviewButton;

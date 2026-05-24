'use client';

import React, { useState } from 'react';
import { submitComplaint } from '@/api/complaints';
import { X, AlertCircle } from 'lucide-react';
import { toast } from '@/components/Shared/Toast';

interface ComplaintModalProps {
    isOpen: boolean;
    onClose: () => void;
    dentistId: number;
    dentistName: string;
}

const ComplaintModal: React.FC<ComplaintModalProps> = ({ isOpen, onClose, dentistId, dentistName }) => {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.warning("Iltimos, shikoyat sababini kiriting");
            return;
        }

        try {
            setIsSubmitting(true);
            await submitComplaint({ dentist_id: dentistId, reason });
            toast.success("Shikoyatingiz qabul qilindi. Tez orada ko'rib chiqiladi.");
            setReason("");
            onClose();
        } catch (error) {
            console.error("Complaint error:", error);
            toast.error("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-xl transform transition-all">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <AlertCircle className="text-red-500" />
                        Shikoyat qilish
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <p className="text-sm text-gray-500 mb-6 font-medium">
                    <span className="font-bold text-gray-900">{dentistName}</span> ustidan shikoyatingizni yozib qoldiring. Bu shifokorning reytingiga bevosita ta'sir qiladi.
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Shikoyat sababi
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Nima bo'lganini batafsil yozing..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none font-medium h-32"
                    />
                </div>

                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                        disabled={isSubmitting}
                    >
                        Bekor qilish
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-3.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Yuborish"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComplaintModal;

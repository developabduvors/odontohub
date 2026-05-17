'use client';

import React, { useState } from 'react';
import { FaStar } from "react-icons/fa";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit(rating, comment);
        // Reset state
        setRating(0);
        setComment("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Stars */}
                <div className="flex justify-center gap-3 mb-8 mt-2">
                    {[...Array(5)].map((_, index) => {
                        const ratingValue = index + 1;
                        return (
                            <FaStar
                                key={index}
                                className="cursor-pointer transition-colors duration-200"
                                color={ratingValue <= (hover || rating) ? "#FFC107" : "#E4E5E9"} // Yellow or Gray
                                size={42}
                                onMouseEnter={() => setHover(ratingValue)}
                                onMouseLeave={() => setHover(0)}
                                onClick={() => setRating(ratingValue)}
                                style={{ stroke: "#FFC107", strokeWidth: "20px" }} // Outline effect if needed, but solid is standard
                            />
                        );
                    })}
                </div>

                {/* Text Area */}
                <div className="mb-8">
                    <textarea
                        className="w-full h-[160px] bg-[#EBEBEB] rounded-[24px] p-5 text-[#1D1D2B] placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#11D76A]/50 text-base font-medium"
                        placeholder="Отзыв"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    className="w-full bg-[#11D76A] text-white font-bold text-xl py-4 rounded-[30px] shadow-lg shadow-green-500/30 hover:bg-[#0fc460] active:scale-[0.98] transition-all"
                >
                    Отправить
                </button>
            </div>
            {/* Close on backdrop click */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};

export default ReviewModal;

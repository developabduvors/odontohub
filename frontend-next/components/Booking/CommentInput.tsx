'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface CommentInputProps {
    value: string;
    onChange: (value: string) => void;
}

const CommentInput: React.FC<CommentInputProps> = ({ value, onChange }) => {
    const t = useTranslations('booking');
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('comment_placeholder')}
            className="w-full bg-white rounded-3xl p-6 h-48 shadow-sm resize-none focus:outline-none placeholder-gray-300 text-lg"
        ></textarea>
    );
};

export default CommentInput;

'use client';

import React from 'react';

interface CommentInputProps {
    value: string;
    onChange: (value: string) => void;
}

const CommentInput: React.FC<CommentInputProps> = ({ value, onChange }) => {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Комментарии врачу"
            className="w-full bg-white rounded-3xl p-6 h-48 shadow-sm resize-none focus:outline-none placeholder-gray-300 text-lg"
        ></textarea>
    );
};

export default CommentInput;

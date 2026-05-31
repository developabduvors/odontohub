'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Trash2, Edit2 } from 'lucide-react';

interface Props {
    id: number;
    text: string;
    image_data?: string | null;
    time: string;
    isMe: boolean;
    onDelete?: (id: number) => void;
    onEdit?: (id: number, text: string) => void;
}

export default function MessageBubble({ id, text, image_data, time, isMe, onDelete, onEdit }: Props) {
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const t = useTranslations('patient.chats');

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        setShowMenu(false);
    };

    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
            <div className="relative max-w-[70%] min-w-[60px] pt-3" ref={menuRef}>
                {/* Message bubble */}
                <div
                    onClick={() => { if (isMe) setShowMenu(v => !v); }}
                    className={`px-4 py-3 rounded-2xl shadow-sm ${isMe ? 'cursor-pointer' : 'cursor-default'} select-none ${
                        isMe
                            ? 'bg-[#5377f7] text-white rounded-tr-none'
                            : 'bg-gray-200 text-gray-900 rounded-tl-none'
                    }`}
                >
                    {image_data && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image_data} alt="" className="rounded-xl max-w-[240px] max-h-[200px] object-cover mb-1" />
                    )}
                    {text && <p className="text-sm leading-relaxed break-words">{text}</p>}
                    <p className={`text-[11px] mt-1.5 text-right ${isMe ? 'text-white/70' : 'text-gray-500'}`}>{time}</p>
                </div>

                {/* Context menu - faqat o'z xabarlarimda */}
                {showMenu && isMe && (
                    <div className={`absolute z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 w-44 right-0 top-full mt-2`}>
                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Copy size={15} className="text-gray-400" />
                            {copied ? t('copied') : t('copy')}
                        </button>
                        {onEdit && (
                            <button
                                onClick={() => { onEdit(id, text); setShowMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Edit2 size={15} className="text-gray-400" />
                                {t('edit')}
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => { onDelete(id); setShowMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={15} />
                                {t('delete')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

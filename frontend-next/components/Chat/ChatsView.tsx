'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, ArrowLeft, MessageCircle, Image } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useMyAppointments } from '@/api/appointments';
import { sendMessage, getMessages, deleteMessage, editMessage } from '@/api/chat';
import type { ChatMessage } from '@/api/chat';
import { paths } from '@/lib/paths';
import MessageBubble from '@/components/Chat/MessageBubble';

const DENTIST_IMG = '/assets/img/photos/Dentist.png';

interface ChatsViewProps {
    appointmentId: number | null;
    variant?: 'doctor' | 'patient';
}

export default function ChatsView({ appointmentId, variant = 'doctor' }: ChatsViewProps) {
    const isPatient = variant === 'patient';
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [chatPreviews, setChatPreviews] = useState<Record<number, { last: string; time: string; unread: number }>>({});
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);

    const { data: appointments = [] } = useMyAppointments();
    const [myUserId] = useState<number>(() => {
        if (typeof window === 'undefined') return 0;
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        return Number(userData.id) || 0;
    });

    // Patient view groups conversations by dentist; doctor view by patient.
    const chatMap = new Map<number, typeof appointments[number]>();
    appointments.filter(a => a.status !== 'cancelled').forEach(a => {
        const key = isPatient ? a.dentist_id : a.patient_id;
        const existing = chatMap.get(key);
        if (!existing || new Date(a.start_time) > new Date(existing.start_time)) {
            chatMap.set(key, a);
        }
    });
    const chats = Array.from(chatMap.values())
        .filter(a => ((isPatient ? a.dentist_name : a.patient_name) || '').toLowerCase().includes(searchQuery.toLowerCase()));

    const activeApt = appointmentId ? appointments.find(a => a.id === appointmentId) : null;

    const formatTime = (dateStr: string) => {
        const utc = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
        return new Date(utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        if (chats.length === 0) return;
        const readMap: Record<number, number> = JSON.parse(localStorage.getItem('chat_read') || '{}');
        chats.forEach(async apt => {
            try {
                const msgs = await getMessages(apt.id);
                const last = msgs[msgs.length - 1];
                const lastReadId = readMap[apt.id] || 0;
                const unread = last && last.sender_id !== myUserId && last.id > lastReadId ? 1 : 0;
                setChatPreviews(prev => ({
                    ...prev,
                    [apt.id]: {
                        last: last ? last.text || '📷 Rasm' : '',
                        time: last ? formatTime(last.created_at) : '',
                        unread,
                    }
                }));
            } catch {}
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(chats.map(c => c.id))]);

    useEffect(() => {
        if (!appointmentId) return;
        setMessages([]);
        fetchMessages();

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const apiUrl = new URL(apiBase);
        const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${apiUrl.host}/api/chat/ws?token=${encodeURIComponent(token)}`;
        let isUnmounted = false;

        const connect = () => {
            if (isUnmounted) return;
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.appointment_id === appointmentId) {
                    setMessages(prev => {
                        if (prev.find(m => m.id === data.id)) return prev;
                        return [...prev, data];
                    });
                } else if (data.appointment_id && data.id) {
                    setChatPreviews(prev => {
                        const current = prev[data.appointment_id];
                        return {
                            ...prev,
                            [data.appointment_id]: {
                                last: data.text || '📷 Rasm',
                                time: formatTime(data.created_at),
                                unread: (current?.unread || 0) + 1,
                            },
                        };
                    });
                }
            };

            socket.onclose = () => {
                if (isUnmounted) return;
                reconnectTimerRef.current = window.setTimeout(connect, 1500);
            };

            socket.onerror = () => {
                socket.close();
            };
        };

        connect();

        return () => {
            isUnmounted = true;
            if (reconnectTimerRef.current) {
                window.clearTimeout(reconnectTimerRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId]);

    useEffect(() => {
        if (!appointmentId) return;
        getMessages(appointmentId).then(msgs => {
            if (msgs.length > 0) {
                const readMap = JSON.parse(localStorage.getItem('chat_read') || '{}');
                readMap[appointmentId] = msgs[msgs.length - 1].id;
                localStorage.setItem('chat_read', JSON.stringify(readMap));
                setChatPreviews(prev => ({ ...prev, [appointmentId]: { ...prev[appointmentId], unread: 0 } }));
            }
        }).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
        }
    }, [newMessage, editText, editingId]);

    const fetchMessages = async () => {
        if (!appointmentId) return;
        try {
            const data = await getMessages(appointmentId);
            setMessages(data);
        } catch {
            setTimeout(async () => {
                try {
                    const retryData = await getMessages(appointmentId);
                    setMessages(retryData);
                } catch {}
            }, 700);
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (editingId) {
            if (!editText.trim()) return;
            await editMessage(editingId, editText).catch(() => {});
            setMessages(prev => prev.map(m => m.id === editingId ? { ...m, text: editText } : m));
            setEditingId(null); setEditText('');
            return;
        }
        if ((!newMessage.trim() && !imagePreview) || !appointmentId) return;
        if (sending) return;
        setSending(true);
        try {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    appointment_id: appointmentId,
                    text: newMessage,
                    image_data: imagePreview || undefined
                }));
                setNewMessage('');
                setImagePreview(null);
            } else {
                const sent = await sendMessage(appointmentId, newMessage, imagePreview || undefined);
                setMessages(prev => [...prev, sent]);
                setNewMessage('');
                setImagePreview(null);
            }
        } catch {} finally {
            setSending(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleDelete = async (msgId: number) => {
        await deleteMessage(msgId).catch(() => {});
        setMessages(prev => prev.filter(m => m.id !== msgId));
    };

    const handleEdit = (msgId: number, text: string) => {
        setEditingId(msgId);
        setEditText(text);
    };

    return (
        // Height = viewport minus MainLayout <main> chrome: below lg it reserves pt-20 (80px);
        // md+ also has m-4 (32px); at lg pt-0 with m-4 (32px). Keeps the message input on-screen.
        <div className="flex h-[calc(100dvh-80px)] md:h-[calc(100vh-112px)] lg:h-[calc(100vh-32px)] md:m-4 bg-white md:rounded-[24px] overflow-hidden border border-gray-100 shadow-sm transition-all duration-300">
            {/* Chat list */}
            <div className={`w-full lg:w-[350px] border-r border-gray-100 flex flex-col shrink-0 ${appointmentId ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            type="button"
                            onClick={() => router.push(isPatient ? paths.patientHome : paths.menu)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                            aria-label="Orqaga qaytish"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">Chatlar</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Qidirish..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all border border-transparent focus:border-blue-200"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {chats.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                            <MessageCircle size={32} className="opacity-20" />
                            <p className="text-sm font-medium">Chatlar topilmadi</p>
                        </div>
                    )}
                    {chats.map(apt => {
                        const preview = chatPreviews[apt.id];
                        const isActive = appointmentId === apt.id;
                        return (
                            <div
                                key={apt.id}
                                onClick={() => {
                                    const readMap = JSON.parse(localStorage.getItem('chat_read') || '{}');
                                    getMessages(apt.id).then(msgs => {
                                        if (msgs.length > 0) {
                                            readMap[apt.id] = msgs[msgs.length - 1].id;
                                            localStorage.setItem('chat_read', JSON.stringify(readMap));
                                        }
                                    }).catch(() => {});
                                    setChatPreviews(prev => ({ ...prev, [apt.id]: { ...prev[apt.id], unread: 0 } }));
                                    router.push((isPatient ? paths.patientChatDetail : paths.chatDetail).replace(':id', String(apt.id)));
                                }}
                                className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-all border-b border-gray-50/50 ${isActive ? 'bg-blue-50/80 border-l-4 border-l-[#4D71F8]' : ''}`}
                            >
                                <div className="relative shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={DENTIST_IMG} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                    {preview?.unread ? <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div> : null}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <p className={`font-bold text-sm truncate ${isActive ? 'text-[#4D71F8]' : 'text-gray-900'}`}>{isPatient ? (apt.dentist_name || 'Shifokor') : (apt.patient_name || 'Bemor')}</p>
                                        <span className="text-[10px] font-bold text-gray-400 shrink-0 ml-1 uppercase">{preview?.time || ''}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-500 truncate font-medium">{preview?.last || apt.service || 'Qabul'}</p>
                                        {preview?.unread ? (
                                            <span className="ml-2 px-1.5 py-0.5 bg-[#4D71F8] text-white text-[10px] font-black rounded-full shadow-sm shadow-blue-500/20">
                                                {preview.unread}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chat area */}
            <div className={`flex-1 flex flex-col bg-gray-50/30 ${!appointmentId ? 'hidden lg:flex' : 'flex'}`}>
                {activeApt ? (
                    <>
                        <div className="p-3 sm:p-4 bg-white border-b border-gray-100 flex items-center gap-4 shrink-0 shadow-sm z-10">
                            <button onClick={() => router.push(isPatient ? paths.patientChats : paths.chats)} className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                                <ArrowLeft size={20} className="text-gray-600" />
                            </button>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={DENTIST_IMG} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                            <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{isPatient ? (activeApt.dentist_name || 'Shifokor') : (activeApt.patient_name || 'Bemor')}</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <p className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-wider">Online</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 no-scrollbar scroll-smooth">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                                    <MessageCircle size={40} className="opacity-10" />
                                    <p className="text-sm italic font-medium">{isPatient ? 'Shifokor bilan muloqotni boshlang' : 'Bemor bilan muloqotni boshlang'}</p>
                                </div>
                            )}
                            {messages.map(msg => (
                                <MessageBubble
                                    key={msg.id}
                                    id={msg.id}
                                    text={msg.text}
                                    image_data={msg.image_data}
                                    time={formatTime(msg.created_at)}
                                    isMe={msg.sender_id === myUserId}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />
                            ))}
                            <div ref={bottomRef} className="h-2" />
                        </div>

                        <div className="p-3 sm:p-4 bg-white border-t border-gray-100 shrink-0 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
                            {editingId && (
                                <div className="mb-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-blue-700 flex justify-between items-center animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-1 h-8 bg-blue-400 rounded-full shrink-0"></div>
                                        <span className="font-semibold truncate">Tahrirlash: {editText}</span>
                                    </div>
                                    <button onClick={() => { setEditingId(null); setEditText(''); }} className="text-blue-400 p-1 hover:bg-blue-100 rounded-full transition-colors ml-2">✕</button>
                                </div>
                            )}
                            {imagePreview && (
                                <div className="mb-3 relative inline-block animate-in zoom-in-95 group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imagePreview} alt="" className="h-24 sm:h-32 rounded-2xl object-cover border-2 border-white shadow-xl" />
                                    <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-110 active:scale-95 transition-all">✕</button>
                                </div>
                            )}
                            <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleImageSelect} />
                            <form onSubmit={handleSend} className="flex items-end gap-2 sm:gap-3 px-1">
                                <button type="button" onClick={() => fileRef.current?.click()} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-400 hover:text-[#4D71F8] hover:bg-blue-50 rounded-full transition-all shrink-0 active:scale-90">
                                    <Image size={22} className="sm:size-[26px]" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <textarea
                                        ref={textareaRef}
                                        value={editingId ? editText : newMessage}
                                        onChange={e => editingId ? setEditText(e.target.value) : setNewMessage(e.target.value)}
                                        placeholder={editingId ? "Tahrirlash..." : "Xabar yozing..."}
                                        className="w-full bg-gray-50 rounded-2xl px-4 py-3 sm:py-4 text-sm sm:text-base font-medium outline-none border border-transparent focus:border-blue-200 focus:ring-4 focus:ring-blue-100/50 transition-all resize-none max-h-32 custom-scrollbar"
                                        rows={1}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={sending || (editingId ? !editText.trim() : (!newMessage.trim() && !imagePreview))}
                                    className="w-10 h-10 sm:w-12 sm:h-12 bg-[#4D71F8] hover:bg-[#3b5cd9] text-white rounded-2xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 active:scale-95 transition-all shrink-0 mb-0.5"
                                >
                                    <Send size={18} className="sm:size-[22px]" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                        <MessageCircle size={48} className="opacity-20" />
                        <p className="font-medium">Chat tanlang</p>
                    </div>
                )}
            </div>
        </div>
    );
}

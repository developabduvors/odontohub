# Doctor Chat (WebSocket) — frontend-next port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Vite doctor chat (`/chats` + `/chats/:id`, REST + live WebSocket) to `frontend-next`, completing the last unported Doctor-flow feature of Phase 2d.

**Architecture:** The Vite `Chats.tsx` is a single responsive master-detail screen driven by a `:id` route param. Next.js App Router needs two routes, so we extract the whole screen into one shared `'use client'` component `ChatsView` that takes an optional `appointmentId: number | null`. Two thin page files (`/chats` static, `/chats/[id]` dynamic) render it. REST lives in `api/chat.ts`; the WebSocket is opened client-only inside `useEffect` and authenticates via a `?token=` query param.

**Tech Stack:** Next.js 16.2.6 (App Router), React 19, next-intl navigation, TanStack Query (`useMyAppointments`), native `WebSocket`, Tailwind v4, lucide-react.

**Testing note:** This repo has **no test runner** (see root `CLAUDE.md` and `frontend-next/AGENTS.md`). User instruction overrides the skill's TDD default. Verification for every task is: `npx tsc --noEmit` (must exit 0), and at the end `npm run build` (must exit 0) plus a manual smoke test with the backend running. Do **not** introduce a test framework.

**Pre-flight:** Work on branch `patient/abduvoris` (already checked out). Confirm `frontend-next/api/api.ts` uses `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'` and `frontend-next/lib/paths.ts` defines `chats: '/chats'` and `chatDetail: '/chats/:id'` — both are already true at time of writing. The doctor sidebar (`layouts/Doshboard.tsx`) already links `paths.chats` and highlights when `pathname.startsWith('/chats')`, so no nav changes are needed.

---

### Task 1: Port the chat REST module

**Files:**
- Create: `frontend-next/api/chat.ts`

The Vite source (`frontend/src/api/chat.ts`) already imports `./api`, which resolves identically in `frontend-next`. This is a 1:1 copy — no transformation needed.

- [ ] **Step 1: Create `frontend-next/api/chat.ts`**

```ts
import api from './api';

export interface ChatMessage {
    id: number;
    appointment_id: number;
    sender_id: number;
    text: string;
    image_data?: string | null;
    created_at: string;
}

export const sendMessage = async (appointment_id: number, text: string, image_data?: string): Promise<ChatMessage> => {
    const response = await api.post<ChatMessage>('/api/chat/send', { appointment_id, text: text || '', image_data: image_data || null });
    return response.data;
};

export const getMessages = async (appointment_id: number): Promise<ChatMessage[]> => {
    const response = await api.get<ChatMessage[]>(`/api/chat/${appointment_id}`);
    return response.data;
};

export const deleteMessage = async (message_id: number): Promise<void> => {
    await api.delete(`/api/chat/${message_id}`);
};

export const editMessage = async (message_id: number, text: string): Promise<ChatMessage> => {
    const response = await api.patch<ChatMessage>(`/api/chat/${message_id}`, { text });
    return response.data;
};
```

- [ ] **Step 2: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: exit code 0, no output.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/api/chat.ts
git -c commit.gpgsign=false commit -m "feat(frontend-next): port chat REST api module (Phase 2d)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Port the MessageBubble component

**Files:**
- Create: `frontend-next/components/Chat/MessageBubble.tsx`

Identical to the Vite component except it gains a `'use client'` directive (it uses `useState`/`useRef`/`useEffect`, `document`, `navigator.clipboard`).

- [ ] **Step 1: Create `frontend-next/components/Chat/MessageBubble.tsx`**

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
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
                            {copied ? 'Nusxalandi!' : 'Nusxalash'}
                        </button>
                        {onEdit && (
                            <button
                                onClick={() => { onEdit(id, text); setShowMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Edit2 size={15} className="text-gray-400" />
                                O&apos;zgartirish
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => { onDelete(id); setShowMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={15} />
                                O&apos;chirish
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/components/Chat/MessageBubble.tsx
git -c commit.gpgsign=false commit -m "feat(frontend-next): port Chat MessageBubble (Phase 2d)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Create the shared `ChatsView` client component

**Files:**
- Create: `frontend-next/components/Chat/ChatsView.tsx`

This is the ported Vite `Chats.tsx` logic, parameterised by `appointmentId` instead of `useParams`. Key transformations vs. the Vite original:

1. `useParams()`/`const { id }` → `appointmentId: number | null` prop. Everywhere Vite used the string `id`, use `appointmentId` (already a number or null). `Number(id)` → `appointmentId`. `if (!id) return` → `if (!appointmentId) return`. `id ? ... : null` → `appointmentId ? ... : null`.
2. `useNavigate` → `useRouter` from `@/i18n/navigation`. `navigate(paths.menu)` → `router.push(paths.menu)`. `navigate(paths.chats)` → `router.push(paths.chats)`. `navigate(paths.chatDetail.replace(':id', String(apt.id)))` → `router.push(paths.chatDetail.replace(':id', String(apt.id)))`.
3. `paths` import: `@/lib/paths`.
4. `import DentistImg from '../assets/img/photos/Dentist.png'` → constant string `'/assets/img/photos/Dentist.png'` (the file already exists at `frontend-next/public/assets/img/photos/Dentist.png`). Render with `<img>` plus an `eslint-disable-next-line @next/next/no-img-element` comment (same pattern used by the already-ported `/notifications` page).
5. `import.meta.env.VITE_API_URL` → `process.env.NEXT_PUBLIC_API_URL`.
6. **SSR safety:** the Vite component reads `localStorage` at render top-level (`const userData = JSON.parse(localStorage.getItem('user_data') || '{}')`). Next.js prerenders client components on the server, where `localStorage` is undefined and would throw. Read `myUserId` via a `useState` lazy initializer guarded by `typeof window`. All other `localStorage` reads are already inside effects/handlers and are safe.
7. `window.setTimeout`/`window.clearTimeout` return types: keep `useRef<number | null>`. Browser `window.setTimeout` returns `number`; this matches the Vite code.
8. `useMyAppointments` from `@/api/appointments` (same shape: items expose `id`, `patient_id`, `patient_name`, `start_time`, `status`, `service`).
9. The two `useEffect`s with intentionally narrow dependency arrays (`[JSON.stringify(chats.map(c => c.id))]` and `[appointmentId]`) get a `// eslint-disable-next-line react-hooks/exhaustive-deps` line directly above the dependency array — preserves Vite behaviour and keeps `next build` output clean (`exhaustive-deps` is a warning and would not fail the build, but suppress it deliberately since the narrow deps are intentional).

- [ ] **Step 1: Create `frontend-next/components/Chat/ChatsView.tsx`**

```tsx
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
}

export default function ChatsView({ appointmentId }: ChatsViewProps) {
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

    const chatMap = new Map<number, typeof appointments[number]>();
    appointments.filter(a => a.status !== 'cancelled').forEach(a => {
        const existing = chatMap.get(a.patient_id);
        if (!existing || new Date(a.start_time) > new Date(existing.start_time)) {
            chatMap.set(a.patient_id, a);
        }
    });
    const chats = Array.from(chatMap.values())
        .filter(a => (a.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()));

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
        <div className="flex h-[calc(100dvh-56px)] md:h-[calc(100vh-88px)] lg:h-[calc(100vh-32px)] md:m-4 bg-white md:rounded-[24px] overflow-hidden border border-gray-100 shadow-sm transition-all duration-300">
            {/* Chat list */}
            <div className={`w-full lg:w-[350px] border-r border-gray-100 flex flex-col shrink-0 ${appointmentId ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            type="button"
                            onClick={() => router.push(paths.menu)}
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
                                    router.push(paths.chatDetail.replace(':id', String(apt.id)));
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
                                        <p className={`font-bold text-sm truncate ${isActive ? 'text-[#4D71F8]' : 'text-gray-900'}`}>{apt.patient_name || 'Bemor'}</p>
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
                            <button onClick={() => router.push(paths.chats)} className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                                <ArrowLeft size={20} className="text-gray-600" />
                            </button>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={DENTIST_IMG} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                            <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{activeApt.patient_name || 'Bemor'}</p>
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
                                    <p className="text-sm italic font-medium">Bemor bilan muloqotni boshlang</p>
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
```

- [ ] **Step 2: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: exit code 0. If `typeof appointments[number]` errors, confirm `useMyAppointments` returns a typed array (it does — `app/[locale]/(doctor)/analytics/page.tsx` already filters it the same way); do not change the API module.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/components/Chat/ChatsView.tsx
git -c commit.gpgsign=false commit -m "feat(frontend-next): shared ChatsView component with WebSocket (Phase 2d)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Wire the `/chats` and `/chats/[id]` routes

**Files:**
- Create: `frontend-next/app/[locale]/(doctor)/chats/page.tsx`
- Create: `frontend-next/app/[locale]/(doctor)/chats/[id]/page.tsx`

Both are thin wrappers around `ChatsView`. `/chats` passes `appointmentId={null}` (renders the list, empty detail pane). `/chats/[id]` reads the dynamic segment. In Next.js 16 App Router, `params` is a Promise in async Server Components — but to keep these as the simplest possible wrappers and match the existing pattern in this repo (`app/[locale]/(doctor)/patients/[id]/page.tsx`), follow whatever that file does. The code below uses `React.use()` to unwrap the params Promise in a client component, which is the Next 16 idiom; if `patients/[id]/page.tsx` uses a different (e.g. `async function` + `await params`) pattern, mirror that instead.

- [ ] **Step 1: Read the existing dynamic-route pattern**

Run: `cat "frontend-next/app/[locale]/(doctor)/patients/[id]/page.tsx"`
Note whether it is `'use client'` + `React.use(params)` or an `async` server component with `await params`. Mirror that exact pattern in Step 3.

- [ ] **Step 2: Create `frontend-next/app/[locale]/(doctor)/chats/page.tsx`**

```tsx
import ChatsView from '@/components/Chat/ChatsView';

export default function ChatsPage() {
    return <ChatsView appointmentId={null} />;
}
```

- [ ] **Step 3: Create `frontend-next/app/[locale]/(doctor)/chats/[id]/page.tsx`**

Use the pattern observed in Step 1. If `patients/[id]/page.tsx` is an async server component:

```tsx
import ChatsView from '@/components/Chat/ChatsView';

export default async function ChatDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <ChatsView appointmentId={Number(id)} />;
}
```

If instead it is a `'use client'` component using `React.use`:

```tsx
'use client';

import { use } from 'react';
import ChatsView from '@/components/Chat/ChatsView';

export default function ChatDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    return <ChatsView appointmentId={Number(id)} />;
}
```

- [ ] **Step 4: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add "frontend-next/app/[locale]/(doctor)/chats/page.tsx" "frontend-next/app/[locale]/(doctor)/chats/[id]/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): /chats + /chats/[id] routes (Phase 2d)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Full build verification + manual smoke test

**Files:** none (verification only)

- [ ] **Step 1: Production build**

Run: `cd frontend-next && npm run build`
Expected: exit code 0. In the route table, confirm `/[locale]/chats` is listed (SSG `●`) and `/[locale]/chats/[id]` is listed (Dynamic `ƒ`). Total should be **51 static + 2 dynamic** (the second dynamic being `/[locale]/chats/[id]`, alongside the pre-existing `/[locale]/patients/[id]`).

- [ ] **Step 2: Manual smoke test**

Terminal 1: `cd backend && python run.py`
Terminal 2: `cd frontend-next && npm run dev`

In a browser, log in as a dentist, then:
1. Open `/uz/chats` — chat list renders from appointments, empty-state pane shows "Chat tanlang".
2. Click a chat — URL becomes `/uz/chats/<appointmentId>`, history loads, the WebSocket connects (Network → WS shows a `101` for `/api/chat/ws?token=...` and the first frame is `{"status":"connected","user_id":...}`).
3. Send a text message — it appears immediately; sending from a second session/browser shows it arriving live without refresh.
4. Send an image (clip icon) — preview shows, send delivers it as a bubble.
5. Long-press/click your own bubble — copy / edit / delete menu works.
6. Kill `python run.py`, wait, restart it — the socket auto-reconnects within ~1.5 s (no page reload).

- [ ] **Step 3: No commit**

This task only verifies. If the build fails or smoke test reveals a regression, fix it under the relevant earlier task and re-run Steps 1–2.

---

## Out of scope

- `AddChatModal.tsx`, `ChatProfilePage.tsx`, `PatientChats*.tsx`, `PatientChatDetail.tsx` — these belong to the **Patient** flow (Phase 3). Doctor `Chats.tsx` does not import `AddChatModal`, so it is intentionally excluded here.
- Replacing `<img>` with `next/image` — deferred; `<img>` + the `@next/next/no-img-element` disable comment matches the already-merged `/notifications` and `/analytics/finance` ports and keeps the port faithful.

## Self-Review

- **Spec coverage:** REST (Task 1), MessageBubble (Task 2), master-detail screen + WebSocket + reconnect + unread previews + edit/delete/image (Task 3), both routes (Task 4), build + WS smoke test (Task 5). All Phase 2d "chats" bullets covered.
- **Placeholder scan:** none — every file has complete code; the only branch is Task 4 Step 3, which gives both concrete variants and a rule (mirror `patients/[id]`) for choosing.
- **Type consistency:** `ChatMessage` (Task 1) is consumed unchanged in Tasks 2–3; `MessageBubble` `Props` (Task 2) match the call site in Task 3; `ChatsViewProps.appointmentId: number | null` is produced by both pages in Task 4 (`null` and `Number(id)`).
```

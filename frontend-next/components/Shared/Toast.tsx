'use client';

import { useEffect, useState } from "react";
import { AlertCircle, Info, X, ShieldCheck, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

function notify(listeners: typeof toastListeners, items: ToastItem[]) {
    listeners.forEach(fn => fn([...items]));
}

export const toast = {
    show(message: string, type: ToastType = "info") {
        const id = Math.random().toString(36).slice(2);
        toasts = [...toasts, { id, message, type }];
        notify(toastListeners, toasts);
        setTimeout(() => {
            toasts = toasts.filter(t => t.id !== id);
            notify(toastListeners, toasts);
        }, 4000);
    },
    success(message: string) { this.show(message, "success"); },
    error(message: string) { this.show(message, "error"); },
    warning(message: string) { this.show(message, "warning"); },
    info(message: string) { this.show(message, "info"); },
};

const styles = {
    success: {
        bg: "bg-white/95 border-emerald-100",
        icon: <ShieldCheck size={24} className="text-emerald-500" />,
        bar: "bg-emerald-500",
        title: "text-emerald-900",
    },
    error: {
        bg: "bg-white/95 border-red-100",
        icon: <AlertCircle size={24} className="text-red-500" />,
        bar: "bg-red-500",
        title: "text-red-900",
    },
    warning: {
        bg: "bg-white/95 border-amber-100",
        icon: <AlertTriangle size={24} className="text-amber-500" />,
        bar: "bg-amber-500",
        title: "text-amber-900",
    },
    info: {
        bg: "bg-white/95 border-blue-100",
        icon: <Info size={24} className="text-blue-500" />,
        bar: "bg-blue-500",
        title: "text-blue-900",
    },
};

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
    const [visible, setVisible] = useState(false);
    const t = useTranslations("toast");
    const style = styles[item.type];

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div
            className={`
                relative flex flex-col w-[340px] border shadow-2xl rounded-[28px] overflow-hidden backdrop-blur-md
                transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
                ${visible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-12 scale-95"}
                ${style.bg}
            `}
        >
            <div className="flex items-start gap-4 p-5">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shadow-inner">
                    {style.icon}
                </div>

                <div className="flex-1 pt-1">
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-0.5 opacity-60 ${style.title}`}>
                        {t(item.type)}
                    </h4>
                    <p className="text-[15px] font-semibold text-gray-800 leading-tight">
                        {item.message}
                    </p>
                </div>

                <button
                    onClick={handleClose}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="h-1 w-full bg-gray-100/50">
                <div
                    className={`h-full ${style.bar} transition-all linear`}
                    style={{
                        width: visible ? "0%" : "100%",
                        transitionDuration: '4000ms'
                    }}
                />
            </div>
        </div>
    );
}

export function ToastContainer() {
    const [items, setItems] = useState<ToastItem[]>([]);

    useEffect(() => {
        toastListeners.push(setItems);
        return () => {
            toastListeners = toastListeners.filter(fn => fn !== setItems);
        };
    }, []);

    const remove = (id: string) => {
        toasts = toasts.filter(t => t.id !== id);
        notify(toastListeners, toasts);
    };

    if (!items.length) return null;

    return (
        <div className="fixed top-6 right-6 z-9999 flex flex-col gap-4 items-end pointer-events-none">
            {items.map(item => (
                <div key={item.id} className="pointer-events-auto">
                    <ToastCard item={item} onClose={() => remove(item.id)} />
                </div>
            ))}
        </div>
    );
}

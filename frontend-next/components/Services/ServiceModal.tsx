'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateService, useUpdateService } from '@/api/services';
import { toast } from '@/components/Shared/Toast';

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialService?: { id: number; name: string; price: number } | null;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, initialService }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const createService = useCreateService();
    const updateService = useUpdateService();

    React.useEffect(() => {
        if (isOpen) {
            if (initialService) {
                setName(initialService.name);
                setPrice(initialService.price.toString());
            } else {
                setName('');
                setPrice('');
            }
        }
    }, [isOpen, initialService]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) return;

        try {
            if (initialService) {
                await updateService.mutateAsync({
                    id: initialService.id,
                    data: { name, price: parseFloat(price) }
                });
            } else {
                await createService.mutateAsync({
                    name,
                    price: parseFloat(price)
                });
            }
            onClose();
            setName('');
            setPrice('');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to save service');
        }
    };

    if (!isOpen) return null;

    const isLoading = createService.isPending || updateService.isPending;
    const isEdit = !!initialService;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[24px] p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-gray-400" />
                </button>

                <h2 className="text-2xl font-black text-[#1a1f36] mb-6">
                    {isEdit ? 'Редактировать услугу' : 'Добавить услугу'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">Название услуги</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-12 bg-[#efefef] rounded-[14px] px-4 font-bold text-[#1a1f36] border-none outline-none focus:ring-2 focus:ring-[#4f6bff]/20"
                            placeholder="Например: Чистка зубов"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">Цена (UZS)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full h-12 bg-[#efefef] rounded-[14px] px-4 font-bold text-[#1a1f36] border-none outline-none focus:ring-2 focus:ring-[#4f6bff]/20"
                            placeholder="0"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !name || !price}
                        className="w-full h-14 bg-[#4f6bff] text-white font-bold rounded-[14px] shadow-lg shadow-[#4f6bff]/20 hover:bg-[#3d56d5] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoading && <Loader2 className="animate-spin w-5 h-5" />}
                        {isEdit ? 'Сохранить' : 'Создать'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ServiceModal;

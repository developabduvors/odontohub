'use client';

import { type FC, useState } from 'react';
import { Edit2, Trash2, Plus, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useMyServices, useDeleteService, type Service } from '@/api/services';
import ServiceModal from '@/components/Services/ServiceModal';

const ServicesSection: FC = () => {
    const t = useTranslations();
    const { data: services, isLoading } = useMyServices();
    const deleteService = useDeleteService();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<{ id: number; name: string; price: number } | null>(null);

    const handleAdd = () => {
        setEditingService(null);
        setIsModalOpen(true);
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('common.confirm_delete'))) {
            try {
                await deleteService.mutateAsync(id);
            } catch (error) {
                console.error('Failed to delete service', error);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-2xl font-bold text-[#1E2532]">{t('doctor_profile.my_services')}</h3>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-1.5 bg-[#5B7FFF] text-white px-4 py-1.5 rounded-full text-[11px] font-bold hover:bg-blue-600 transition-all"
                >
                    {t('doctor_profile.add')}
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <Plus className="w-2.5 h-2.5 text-blue-600" strokeWidth={3} />
                    </div>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[#5B7FFF]" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {services?.map((service: Service) => (
                        <div key={service.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-50 relative group">
                            <h4 className="font-bold text-[#5B7FFF] text-lg mb-6 leading-tight pr-8">{service.name}</h4>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-[#5B7FFF]">{service.price.toLocaleString()}</span>
                                <span className="text-[10px] text-[#5B7FFF] font-medium">{service.currency || 'UZS'}</span>
                            </div>

                            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(service)}
                                    className="w-8 h-8 flex items-center justify-center bg-[#5B7FFF] text-white rounded-full shadow-lg hover:bg-blue-600 transition-all"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(service.id)}
                                    className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-500 rounded-full shadow-lg hover:bg-red-200 transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {(!services || services.length === 0) && (
                        <div className="col-span-full py-8 text-center text-gray-400 font-bold bg-gray-50 rounded-[24px] border border-dashed border-gray-200">
                            {t('doctor_profile.no_services')}
                        </div>
                    )}
                </div>
            )}

            <ServiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialService={editingService}
            />
        </div>
    );
};

export default ServicesSection;

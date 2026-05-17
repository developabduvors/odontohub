'use client';

import React from 'react';

interface PriceCardProps {
    price: string;
    service?: string;
}

const PriceCard: React.FC<PriceCardProps> = ({ price, service }) => {
    return (
        <div className="bg-gradient-to-br from-[#4D71F8] to-[#3451d1] rounded-[2rem] p-6 md:p-8 text-white shadow-xl shadow-blue-500/30 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

            <div className="relative z-10">
                {service && (
                    <div className="inline-flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5 mb-4">
                        <div className="w-2 h-2 bg-white rounded-full" />
                        <p className="text-xs font-black uppercase tracking-widest text-white">
                            {service}
                        </p>
                    </div>
                )}
                <p className="text-sm font-semibold text-white/60 mb-1">Стоимость услуги</p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight">{price}</h2>
            </div>
        </div>
    );
};

export default PriceCard;

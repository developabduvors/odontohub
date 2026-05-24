'use client';

import { useEffect, useState } from 'react';
import DoctorsList from '@/components/Doctors/DoctorsList';

export default function PatientDoctorsPage() {
    const [isFirstTime, setIsFirstTime] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const firstTime = localStorage.getItem('is_first_time');
        if (firstTime === 'true') {
            setIsFirstTime(true);
            // Remove the flag after showing
            setTimeout(() => {
                localStorage.removeItem('is_first_time');
                setIsFirstTime(false);
            }, 5000);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-100/50 max-w-7xl mx-auto w-full flex flex-col">
            {isFirstTime && (
                <div className="mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-5 shadow-lg animate-in slide-in-from-top duration-500">
                    <h2 className="text-xl font-black text-white mb-1">Добро пожаловать! 👋</h2>
                    <p className="text-white/90 font-semibold text-sm">
                        Выберите стоматолога из списка ниже для записи на приём
                    </p>
                </div>
            )}
            <DoctorsList />
        </div>
    );
}

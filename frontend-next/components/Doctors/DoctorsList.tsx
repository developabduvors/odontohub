'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { X, Navigation } from 'lucide-react';
import { paths } from '@/lib/paths';
import DoctorCard from './DoctorCard';
import DoctorFilters from './DoctorFilters';
import { useAllDentists } from '@/api/profile';
import type { Doctor } from '@/types/patient';

const DoctorImg = '/assets/img/photos/Dentist.png';

const DoctorsList: React.FC = () => {
    const t = useTranslations();
    const router = useRouter();

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSpecialtyId, setActiveSpecialtyId] = useState("");

    const [region, setRegion] = useState("all");
    const [district, setDistrict] = useState("all");
    const [specialty, setSpecialty] = useState("");
    const [rating, setRating] = useState("");
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [sortByDistance, setSortByDistance] = useState(false);

    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [mapQuery, setMapQuery] = useState<string>('');
    const [mapTitle, setMapTitle] = useState<string>('Lokatsiya');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handoff = sessionStorage.getItem('gosmile:doctors_specialty');
        if (handoff) {
            setActiveSpecialtyId(handoff);
            setSearchTerm("");
            sessionStorage.removeItem('gosmile:doctors_specialty');
        }
    }, []);

    const { data: dentists, isLoading } = useAllDentists({
        search: searchTerm || undefined,
        region: region !== 'all' ? region : undefined,
        district: district !== 'all' ? district : undefined,
        specialty: specialty || activeSpecialtyId || undefined,
    });

    // Haversine formula
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    useEffect(() => {
        if (sortByDistance && !userLocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => {
                    console.error("Geolocation error:", err);
                    setSortByDistance(false);
                }
            );
        }
    }, [sortByDistance, userLocation]);


    const parseCoordinates = (value?: string | null): { lat: number; lng: number } | null => {
        if (!value) return null;
        const parts = value.split(',');
        if (parts.length !== 2) return null;
        const lat = Number(parts[0].trim());
        const lng = Number(parts[1].trim());
        return (!Number.isNaN(lat) && !Number.isNaN(lng)) ? { lat, lng } : null;
    };

    const getDoctorCoords = (doctor: any): { lat: number; lng: number } | null => {
        const lat = Number(doctor.latitude);
        const lng = Number(doctor.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
        return parseCoordinates(doctor.address);
    };

    const openMapModal = (query: string, title: string) => {
        setMapQuery(query);
        setMapTitle(title);
        setIsMapModalOpen(true);
    };

    // Processed doctors
    const doctorsList = (dentists || [])
        .map((d: any) => {
            const coords = getDoctorCoords(d);
            const dist = (userLocation && coords) ? getDistance(userLocation.lat, userLocation.lng, coords.lat, coords.lng) : null;

            return {
                ...d,
                name: d.full_name,
                direction: d.specialization || "Stomatolog",
                experience: d.experience_years ? `${d.experience_years} yil tajriba` : "",
                rating: d.rating || 0,
                review_count: d.review_count || 0,
                image: DoctorImg,
                distance: dist,
                latitude: d.latitude ?? undefined,
                longitude: d.longitude ?? undefined
            };
        })
        .sort((a, b) => {
            if (sortByDistance && a.distance !== null && b.distance !== null) return a.distance - b.distance;
            if (rating === 'high') return b.rating - a.rating;
            if (rating === 'low') return a.rating - b.rating;
            return 0;
        });

    return (
        <div className="flex flex-col">
            <DoctorFilters
                searchTerm={searchTerm}
                onSearchChange={(val) => { setSearchTerm(val); if (val) setActiveSpecialtyId(""); }}
                region={region}
                onRegionChange={setRegion}
                district={district}
                onDistrictChange={setDistrict}
                specialty={specialty}
                onSpecialtyChange={setSpecialty}
                rating={rating}
                onRatingChange={setRating}
            />

            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    {activeSpecialtyId && (
                        <div className="bg-blue-50 text-[#4D71F8] px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border border-blue-100">
                            <span>{t.has(`patient.specialties.items.${activeSpecialtyId}.name`) ? t(`patient.specialties.items.${activeSpecialtyId}.name`) : activeSpecialtyId}</span>
                            <button onClick={() => setActiveSpecialtyId("")} className="hover:bg-blue-100 rounded-full p-0.5"><X size={14} /></button>
                        </div>
                    )}
                    <span className="text-gray-400 text-xs font-semibold">
                        {doctorsList.length} ta shifokor topildi
                    </span>
                </div>

                <button
                    onClick={() => setSortByDistance(!sortByDistance)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        sortByDistance ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <Navigation size={14} />
                    {sortByDistance ? "Yaqinroq" : "Masofa bo'yicha"}
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
            ) : (
                <div className="space-y-3">
                    {doctorsList.map((doctor, index) => (
                        <DoctorCard
                            key={index}
                            doctor={{
                                ...doctor,
                                address: doctor.distance !== null ? `${doctor.distance.toFixed(1)} km masofada` : (doctor.address || doctor.clinic || "Manzil ko'rsatilmagan")
                            } as Doctor}
                            onBook={(doc) => {
                                if (typeof window !== 'undefined') sessionStorage.setItem('gosmile:booking_doctor', JSON.stringify(doc));
                                router.push(paths.booking);
                            }}
                            onOpenMap={(doc) => {
                                const coords = getDoctorCoords(doc);
                                coords ? openMapModal(`${coords.lat},${coords.lng}`, doc.name) : openMapModal(doc.address || 'Toshkent', doc.name);
                            }}
                        />
                    ))}
                    {doctorsList.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-4xl mb-3">🔍</p>
                            <p className="text-gray-500 text-base font-bold">Shifokor topilmadi</p>
                        </div>
                    )}
                </div>
            )}

            <div className="fixed bottom-24 sm:bottom-6 left-0 right-0 flex justify-center z-10 px-4 pointer-events-none">
                <button
                    onClick={() => {
                        const first = doctorsList.find(d => getDoctorCoords(d));
                        if (!first) return openMapModal("стоматология тошкент", "Xaritada stomatologlar");
                        const coords = getDoctorCoords(first);
                        openMapModal(`${coords?.lat},${coords?.lng}`, "Xaritada stomatologlar");
                    }}
                    className="pointer-events-auto bg-[#11D76A] text-white font-bold text-sm py-3 px-10 rounded-full shadow-lg hover:bg-[#0fc460] active:scale-95 transition-all"
                >
                    🗺️ Xaritada ko'rish
                </button>
            </div>

            {isMapModalOpen && (
                <div className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="font-bold text-[#1D1D2B] font-serif">{mapTitle}</h3>
                            <button onClick={() => setIsMapModalOpen(false)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={18} /></button>
                        </div>
                        <div className="h-[60vh] min-h-[300px]">
                            <iframe
                                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
                                className="w-full h-full" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="map"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorsList;

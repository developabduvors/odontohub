'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAllDentists } from '@/api/profile';
import { useMyAppointments } from '@/api/appointments';
import { Link, useRouter } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import { MapPin } from 'lucide-react';
import DoctorName from '@/components/Shared/DoctorName';

const DOCTOR_IMG = '/assets/img/photos/Dentist.png';

export default function SuggestedDoctors() {
  const router = useRouter();
  const { data: dentists, isLoading: isLoadingDentists } = useAllDentists();
  const { data: appointments, isLoading: isLoadingAppointments } = useMyAppointments();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedLocation = localStorage.getItem('user_location');
    if (storedLocation) {
      setUserLocation(JSON.parse(storedLocation));
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          localStorage.setItem('user_location', JSON.stringify(loc));
        },
        (err) => console.log('Geolocation error:', err)
      );
    }
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const suggestedDoctors = useMemo(() => {
    if (!dentists) return [];
    // Har bir doktor uchun masofani hisoblaymiz (koordinata bo'lsa).
    const withDist = dentists.map((d: any) => {
      const lat = Number(d.latitude);
      const lng = Number(d.longitude);
      const distance =
        userLocation && Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
          ? getDistance(userLocation.lat, userLocation.lng, lat, lng)
          : null;
      return { ...d, distance };
    });
    // Yaqin doktorlar (masofasi bor) oldinda; koordinatasi yo'qlar backend tartibini
    // (eng yangi -> eski) saqlaydi, shunda yangi doktorlar ham top-5 ga tushadi.
    const sorted = withDist.sort((a: any, b: any) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return 0; // ikkalasi ham null -> backend tartibi saqlanadi
    });
    return sorted.slice(0, 5);
  }, [dentists, userLocation]);

  const isLoading = isLoadingDentists || isLoadingAppointments;
  const hasUpcomingAppointments = appointments && appointments.length > 0;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[200px] h-[280px] bg-gray-100 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!dentists || dentists.length === 0 || hasUpcomingAppointments) return null;

  const goToBooking = (doctor: any) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'gosmile:booking_doctor',
        JSON.stringify({
          ...doctor,
          name: doctor.full_name,
          direction: doctor.specialization || 'Stomatolog',
          image: DOCTOR_IMG,
          specialty: doctor.specialization || 'Umumiy stomatologiya',
          experience: doctor.experience_years ? `${doctor.experience_years} yil tajriba` : '',
          rating: doctor.rating || '5.0',
        })
      );
    }
    router.push(paths.booking);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-gray-900 leading-tight font-serif tracking-tight">
            Sizga yaqin shifokorlar
          </h2>
          {userLocation && <MapPin size={18} className="text-blue-500 animate-bounce" />}
        </div>
        <Link href={paths.doctors} className="text-blue-600 font-bold hover:underline">
          Barchasi
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
        {suggestedDoctors.map((doctor: any) => (
          <div
            key={doctor.id}
            onClick={() => goToBooking(doctor)}
            className="min-w-[260px] bg-white border border-gray-100 rounded-[32px] p-6 text-gray-900 shadow-xl shadow-blue-500/5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-blue-500/10 active:scale-95 group"
          >
            <div className="relative mb-4">
              <div className="bg-blue-50 rounded-[24px] w-24 h-24 overflow-hidden flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={DOCTOR_IMG} alt={doctor.full_name} className="w-full h-full object-cover" />
              </div>
              {doctor.distance !== null && doctor.distance !== undefined && (
                <div className="absolute -right-2 -bottom-2 bg-[#4D71F8] text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
                  {Number(doctor.distance).toFixed(1)} km
                </div>
              )}
            </div>
            <DoctorName
              name={doctor.full_name}
              className="block text-xl font-black mb-1 truncate text-blue-900"
              placeholderClassName="block text-sm font-bold mb-1 text-gray-400"
            />
            <p className="text-gray-500 text-sm mb-4 font-semibold">{doctor.specialization || 'Stomatolog'}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-yellow-50 rounded-full px-2 py-1 text-xs font-black text-yellow-600">
                <span>⭐</span>
                <span>{doctor.rating || '5.0'}</span>
              </div>
              <span className="text-sm font-black text-blue-600 group-hover:translate-x-1 transition-transform">Band qilish →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

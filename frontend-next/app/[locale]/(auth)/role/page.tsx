'use client';

import { useEffect } from 'react';
import { Stethoscope, User } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import { useAppSelector } from '@/store/hooks';

export default function RolePage() {
  const router = useRouter();
  const role = useAppSelector((s) => s.user.role);

  useEffect(() => {
    if (role === 'dentist') {
      router.replace(paths.menu);
    } else if (role === 'patient') {
      router.replace(paths.patientHome);
    }
  }, [role, router]);

  function chooseDoctor() {
    const userRaw = localStorage.getItem('user_data');
    const user = userRaw ? JSON.parse(userRaw) : {};
    user.role = 'dentist';
    localStorage.setItem('user_data', JSON.stringify(user));
    router.replace(paths.menu);
  }

  function choosePatient() {
    const userRaw = localStorage.getItem('user_data');
    const user = userRaw ? JSON.parse(userRaw) : {};
    user.role = 'patient';
    localStorage.setItem('user_data', JSON.stringify(user));
    router.replace(paths.patientHome);
  }

  return (
    <div className="gradient-primary flex min-h-screen flex-col items-center justify-center p-6 text-center text-white">
      <div className="mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/img/icons/logo1.png" alt="GoSmile" className="h-20" />
      </div>

      <h1 className="font-heading mb-2 text-3xl font-bold">Добро пожаловать!</h1>
      <p className="font-railway mb-12 opacity-80">
        Выберите вашу роль в системе GoSmile
      </p>

      <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={chooseDoctor}
          className="group flex flex-col items-center gap-4 rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-lg transition-transform group-hover:scale-110">
            <Stethoscope size={32} />
          </div>
          <span className="text-xl font-bold">Я врач</span>
        </button>

        <button
          type="button"
          onClick={choosePatient}
          className="group flex flex-col items-center gap-4 rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-lg transition-transform group-hover:scale-110">
            <User size={32} />
          </div>
          <span className="text-xl font-bold">Я пациент</span>
        </button>
      </div>

      <p className="mt-12 text-sm opacity-60">
        OdontoHub — ваша современная стоматология
      </p>
    </div>
  );
}

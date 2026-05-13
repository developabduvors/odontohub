'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import api from '@/api/api';
import { paths } from '@/lib/paths';
import { setUser } from '@/store/slices/userSlice';
import { useAppDispatch } from '@/store/hooks';

interface RegisterFormData {
  full_name: string;
  phone: string;
  email?: string;
  password: string;
}

export default function RegisterPatientPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const result = await api.post('/auth/register', {
        full_name: data.full_name,
        phone: data.phone.replace(/\s+/g, ''),
        email: data.email || '',
        password: data.password,
        role: 'patient',
      });

      const accessToken = result.data.access_token;
      localStorage.setItem('access_token', accessToken);

      try {
        const meResponse = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userData = meResponse.data;
        localStorage.setItem('user_data', JSON.stringify(userData));
        dispatch(setUser(userData));
      } catch {
        const fallbackUser = {
          full_name: data.full_name,
          phone: data.phone.replace(/\s+/g, ''),
          role: 'patient' as const,
        };
        localStorage.setItem('user_data', JSON.stringify(fallbackUser));
        dispatch(setUser(fallbackUser));
      }

      localStorage.setItem('is_first_time', 'true');
      router.replace(paths.patientHome);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      alert(detail || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#5d6dff] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(109,131,255,0.88),rgba(80,98,238,0.84)_38%,rgba(106,90,225,0.80)_70%,rgba(139,84,214,0.74))]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px] rounded-[32px] border border-white/20 bg-white/95 p-8 text-[#18213d] shadow-[0_30px_90px_rgba(39,45,116,0.35)]">
          <p
            className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7080ff]"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Регистрация пациента
          </p>
          <h2
            className="mt-2 text-3xl font-bold text-[#141b33]"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Создать аккаунт
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Field
              icon={<UserRound size={18} className="text-[#7080ff]" />}
              error={errors.full_name?.message}
            >
              <input
                type="text"
                placeholder="Ф.И.О."
                className="w-full bg-transparent py-3 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                {...register('full_name', { required: 'Введите имя' })}
              />
            </Field>

            <Field
              icon={<Phone size={18} className="text-[#7080ff]" />}
              error={errors.phone?.message}
            >
              <input
                type="tel"
                placeholder="+998 90 123 45 67"
                className="w-full bg-transparent py-3 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                {...register('phone', {
                  required: 'Введите номер',
                  validate: (v) =>
                    /^\+998\d{9}$/.test(v.replace(/\s+/g, '')) || 'Неверный формат',
                })}
              />
            </Field>

            <Field
              icon={<Mail size={18} className="text-[#7080ff]" />}
              error={errors.email?.message}
            >
              <input
                type="email"
                placeholder="Email (опционально)"
                className="w-full bg-transparent py-3 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                {...register('email')}
              />
            </Field>

            <Field
              icon={<LockKeyhole size={18} className="text-[#7080ff]" />}
              error={errors.password?.message}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Пароль"
                className="w-full bg-transparent py-3 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                {...register('password', {
                  required: 'Введите пароль',
                  minLength: { value: 6, message: 'Минимум 6 символов' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="ml-3 text-[#7080ff]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Field>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-[linear-gradient(135deg,#5d6dff_0%,#3b5fcc_100%)] px-6 py-3.5 text-lg font-bold text-white shadow-[0_16px_40px_rgba(86,103,255,0.32)] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              {isLoading ? 'Загрузка…' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#5f6a92]">
            Уже есть аккаунт?{' '}
            <Link
              href={paths.login}
              className="font-semibold text-[#5667ff] transition hover:text-[#3f52ff]"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  error,
  children,
}: {
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={`flex items-center rounded-2xl border bg-white px-4 ${
          error ? 'border-red-400' : 'border-[#d9def7]'
        }`}
      >
        <span className="mr-3">{icon}</span>
        {children}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}

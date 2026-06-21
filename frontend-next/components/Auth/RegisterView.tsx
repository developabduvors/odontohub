'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Eye, EyeOff, LockKeyhole, Mail, Phone, Stethoscope, User, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/navigation';
import api from '@/api/api';
import { paths } from '@/lib/paths';
import { setUser } from '@/store/slices/userSlice';
import { useAppDispatch } from '@/store/hooks';
import { toast } from '@/components/Shared/Toast';
import PhoneInput from '@/components/Shared/PhoneInput';

interface RegisterViewProps {
  role: 'patient' | 'dentist';
}

interface RegisterFormData {
  full_name: string;
  phone: string;
  email?: string;
  password: string;
}

export default function RegisterView({ role }: RegisterViewProps) {
  const router = useRouter();
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
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
        role,
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
          role,
        };
        localStorage.setItem('user_data', JSON.stringify(fallbackUser));
        dispatch(setUser(fallbackUser));
      }

      if (role === 'patient') {
        localStorage.setItem('is_first_time', 'true');
        router.replace(paths.patientHome);
      } else {
        router.replace(paths.menu);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || t('auth.register.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#5d6dff] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(109,131,255,0.88),rgba(80,98,238,0.84)_38%,rgba(106,90,225,0.80)_70%,rgba(139,84,214,0.74))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_30%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px] rounded-[40px] border border-white/25 bg-white/10 px-6 py-8 shadow-[0_30px_90px_rgba(39,45,116,0.35)] backdrop-blur-[18px] sm:px-10 sm:py-10 xl:max-w-[1140px] 2xl:max-w-[1240px]">
          <div className="grid items-center gap-8 xl:grid-cols-[0.8fr_1.05fr] xl:gap-12">
            <section className="text-center xl:text-left">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md sm:h-28 sm:w-28 xl:mx-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/img/icons/logo-icon1.png" alt="GoSmile icon" className="h-16 w-16 object-contain brightness-0 invert sm:h-20 sm:w-20" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl xl:text-6xl" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                GoSmile
              </h1>
              <div className="mx-auto mt-3 h-px w-44 bg-white/80 xl:mx-0" />
              <p className="mt-4 text-4xl leading-none text-white/95" style={{ fontFamily: '"Great Vibes", cursive' }}>
                {t('auth.register.welcome')}
              </p>
              <p className="mx-auto mt-6 max-w-md text-base leading-7 text-white/82 xl:mx-0" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                {t('auth.register.subtitle')}
              </p>
            </section>

            <section>
              <div className="rounded-[32px] border border-white/20 bg-white/92 p-6 text-[#18213d] shadow-[0_18px_50px_rgba(27,31,92,0.22)] sm:p-8">
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7080ff]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                    {t('auth.register.eyebrow')}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-[#141b33]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                    {t('auth.register.heading')}
                  </h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#3d4a73]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      {t('auth.register.choose_role')}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => router.push(paths.registrDoc)}
                        className={`rounded-[24px] border p-4 text-left transition-all ${
                          role === 'dentist'
                            ? 'border-[#7080ff] bg-[#eef1ff] text-[#5667ff]'
                            : 'border-[#d9def7] bg-white text-[#6f789a] hover:border-[#c5cdf4]'
                        }`}
                      >
                        <Stethoscope size={24} className="mb-3" />
                        <p className="text-base font-semibold" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                          {t('common.doctor')}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => router.push(paths.registerPat)}
                        className={`rounded-[24px] border p-4 text-left transition-all ${
                          role === 'patient'
                            ? 'border-[#7080ff] bg-[#eef1ff] text-[#5667ff]'
                            : 'border-[#d9def7] bg-white text-[#6f789a] hover:border-[#c5cdf4]'
                        }`}
                      >
                        <User size={24} className="mb-3" />
                        <p className="text-base font-semibold" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                          {t('common.patient')}
                        </p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#3d4a73]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      {t('auth.register.full_name')}
                    </label>
                    <div className={`flex items-center rounded-2xl border bg-white px-4 ${errors.full_name ? 'border-red-400' : 'border-[#d9def7]'}`}>
                      <UserRound size={18} className="mr-3 text-[#7080ff]" />
                      <input
                        type="text"
                        placeholder={t('auth.register.full_name_ph')}
                        className="w-full bg-transparent py-3.5 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                        {...register('full_name', {
                          required: t('auth.register.full_name_required'),
                          minLength: { value: 2, message: t('auth.register.name_min') },
                        })}
                      />
                    </div>
                    {errors.full_name && <p className="mt-1.5 text-sm text-red-500">{errors.full_name.message}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#3d4a73]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      {t('auth.login.phone')}
                    </label>
                    <div className={`flex items-center rounded-2xl border bg-white px-4 ${errors.phone ? 'border-red-400' : 'border-[#d9def7]'}`}>
                      <Phone size={18} className="mr-3 text-[#7080ff]" />
                      <Controller
                        name="phone"
                        control={control}
                        rules={{
                          required: t('auth.login.phone_required'),
                          validate: (value) => {
                            const cleaned = value.replace(/\s+/g, '');
                            return /^\+998\d{9}$/.test(cleaned) || t('auth.login.phone_invalid');
                          },
                        }}
                        render={({ field: { onChange, value } }) => (
                          <PhoneInput
                            placeholder="+998 90 123 45 67"
                            value={value || ''}
                            onChange={onChange}
                            className="w-full bg-transparent py-3.5 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                          />
                        )}
                      />
                    </div>
                    {errors.phone && <p className="mt-1.5 text-sm text-red-500">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#3d4a73]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      Email <span className="text-[#99a2c7]">{t('auth.register.optional')}</span>
                    </label>
                    <div className="flex items-center rounded-2xl border border-[#d9def7] bg-white px-4">
                      <Mail size={18} className="mr-3 text-[#7080ff]" />
                      <input
                        type="email"
                        placeholder="example@mail.com"
                        className="w-full bg-transparent py-3.5 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                        {...register('email')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#3d4a73]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      {t('auth.login.password')}
                    </label>
                    <div className={`flex items-center rounded-2xl border bg-white px-4 ${errors.password ? 'border-red-400' : 'border-[#d9def7]'}`}>
                      <LockKeyhole size={18} className="mr-3 text-[#7080ff]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth.login.password_ph')}
                        className="w-full bg-transparent py-3.5 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                        {...register('password', {
                          required: t('auth.login.password_required'),
                          minLength: { value: 6, message: t('auth.login.password_min') },
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="ml-3 text-[#7080ff] transition hover:text-[#4f60ff]"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-full bg-[linear-gradient(135deg,#ffffff_0%,#eef1ff_100%)] px-6 py-3.5 text-xl font-bold text-[#5667ff] shadow-[0_16px_40px_rgba(30,35,94,0.12)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    {isLoading ? t('auth.register.submitting') : t('auth.login.register')}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#5f6a92]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  {t('auth.register.have_account')}{' '}
                  <Link href={paths.login} className="font-semibold text-[#5667ff] transition hover:text-[#3f52ff]">
                    {t('auth.login.submit')}
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LockKeyhole, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/navigation';
import api from '@/api/api';
import { paths } from '@/lib/paths';
import { setUser } from '@/store/slices/userSlice';
import { useAppDispatch } from '@/store/hooks';
import { useTelegram } from '@/hooks/useTelegram';
import { toast } from '@/components/Shared/Toast';

interface LoginData {
  phone: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const { initData } = useTelegram();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    const cleanPhone = data.phone.replace(/\s+/g, '');
    try {
      const result = await api.post('/auth/login', {
        phone: cleanPhone,
        password: data.password,
      });
      const { access_token } = result.data;

      if (initData) {
        try {
          await api.post('/telegram/link',
            { init_data: initData },
            { headers: { Authorization: `Bearer ${access_token}` } }
          );
        } catch (e) {
          console.error("Failed to link TG account on login", e);
        }
      }

      localStorage.setItem('access_token', access_token);

      const meResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userData = meResponse.data;
      localStorage.setItem('user_data', JSON.stringify(userData));
      dispatch(setUser(userData));

      if (userData.role === 'patient') {
        router.replace(paths.patientHome);
      } else {
        router.replace(paths.menu);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || t('auth.login.server_error'));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#5d6dff] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(109,131,255,0.88),rgba(80,98,238,0.84)_38%,rgba(106,90,225,0.80)_70%,rgba(139,84,214,0.74))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_30%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[880px] rounded-[40px] border border-white/25 bg-white/10 px-6 py-8 shadow-[0_30px_90px_rgba(39,45,116,0.35)] backdrop-blur-[18px] sm:px-10 sm:py-10">
          <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="text-center lg:text-left">
              <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md lg:mx-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/img/icons/logo-icon1.png"
                  alt="GoSmile icon"
                  className="h-20 w-20 object-contain brightness-0 invert"
                />
              </div>
              <h1
                className="text-5xl font-bold tracking-tight text-white sm:text-6xl"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                GoSmile
              </h1>
              <div className="mx-auto mt-3 h-px w-44 bg-white/80 lg:mx-0" />
              <p
                className="mt-4 text-4xl leading-none text-white/95"
                style={{ fontFamily: '"Great Vibes", cursive' }}
              >
                {t('auth.login.welcome')}
              </p>
              <p
                className="mx-auto mt-6 max-w-md text-base leading-7 text-white/82 lg:mx-0"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                {t('auth.login.subtitle')}
              </p>
            </section>

            <section>
              <div className="rounded-[32px] border border-white/20 bg-white/92 p-6 text-[#18213d] shadow-[0_18px_50px_rgba(27,31,92,0.22)] sm:p-8">
                <div className="mb-6">
                  <p
                    className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7080ff]"
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    Login
                  </p>
                  <h2
                    className="mt-2 text-3xl font-bold text-[#141b33]"
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    {t('auth.login.heading')}
                  </h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-[#3d4a73]"
                      style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                    >
                      {t('auth.login.phone')}
                    </label>
                    <div
                      className={`flex items-center rounded-2xl border bg-white px-4 ${errors.phone ? 'border-red-400' : 'border-[#d9def7]'
                        }`}
                    >
                      <Phone size={18} className="mr-3 text-[#7080ff]" />
                      <input
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        className="w-full bg-transparent py-3.5 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                        {...register('phone', {
                          required: t('auth.login.phone_required'),
                          validate: (value) => {
                            const cleaned = value.replace(/\s+/g, '');
                            return /^\+998\d{9}$/.test(cleaned) || t('auth.login.phone_invalid');
                          },
                        })}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1.5 text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-[#3d4a73]"
                      style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                    >
                      {t('auth.login.password')}
                    </label>
                    <div
                      className={`flex items-center rounded-2xl border bg-white px-4 ${errors.password ? 'border-red-400' : 'border-[#d9def7]'
                        }`}
                    >
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
                    {errors.password && (
                      <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-[linear-gradient(135deg,#ffffff_0%,#eef1ff_100%)] px-6 py-3.5 text-xl font-bold text-[#5667ff] shadow-[0_16px_40px_rgba(30,35,94,0.12)] transition-transform duration-200 hover:-translate-y-0.5"
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    {t('auth.login.submit')}
                  </button>
                </form>

                <p
                  className="mt-6 text-center text-sm text-[#5f6a92]"
                  style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                >
                  {t('auth.login.no_account')}{' '}
                  <Link
                    href={paths.registerPat}
                    className="font-semibold text-[#5667ff] transition hover:text-[#3f52ff]"
                  >
                    {t('auth.login.register')}
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

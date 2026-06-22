'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Eye, EyeOff, LockKeyhole, Phone, ShieldCheck } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import { forgotPassword, verifyResetCode, resetPassword } from '@/api/auth';
import { toast } from '@/components/Shared/Toast';
import PhoneInput from '@/components/Shared/PhoneInput';

type Step = 'phone' | 'code' | 'password';

const errMsg = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || fallback;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');           // kanonik +998XXXXXXXXX
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(0);         // countdown
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Telefon bosqichi
  const { control, handleSubmit, formState: { errors } } = useForm<{ phone: string }>();
  // Parol bosqichi
  const { register, handleSubmit: handlePwd, watch, formState: { errors: pwdErr } } =
    useForm<{ password: string; confirm: string }>();

  // 90 soniyalik countdown
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const sendCode = async (cleanPhone: string) => {
    setLoading(true);
    try {
      const { expires_in } = await forgotPassword(cleanPhone);
      setPhone(cleanPhone);
      setCode('');
      setSeconds(expires_in || 90);
      setStep('code');
      toast.success('Kod Telegram’ga yuborildi');
    } catch (e) {
      toast.error(errMsg(e, 'Kod yuborishda xatolik'));
    } finally {
      setLoading(false);
    }
  };

  const onPhoneSubmit = (data: { phone: string }) => sendCode(data.phone.replace(/\s+/g, ''));

  const onVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await verifyResetCode(phone, code);
      setStep('password');
    } catch (e) {
      toast.error(errMsg(e, 'Kod noto‘g‘ri'));
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (data: { password: string; confirm: string }) => {
    setLoading(true);
    try {
      await resetPassword(phone, code, data.password);
      toast.success('Parol yangilandi. Endi kirishingiz mumkin.');
      router.replace(paths.login);
    } catch (e) {
      toast.error(errMsg(e, 'Parolni yangilashda xatolik'));
    } finally {
      setLoading(false);
    }
  };

  const inputBox = 'flex items-center rounded-2xl border border-[#d9def7] bg-white px-4';
  const inputCls = 'w-full bg-transparent py-3.5 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#5d6dff] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(109,131,255,0.92),rgba(106,90,225,0.85)_70%,rgba(139,84,214,0.78))]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px] rounded-[32px] border border-white/20 bg-white/95 p-6 text-[#18213d] shadow-[0_18px_50px_rgba(27,31,92,0.25)] sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef1ff] text-[#5667ff]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#141b33]">Parolni tiklash</h1>
              <p className="text-sm text-[#5f6a92]">
                {step === 'phone' && 'Telefon raqamingizni kiriting'}
                {step === 'code' && 'Telegram’dagi kodni kiriting'}
                {step === 'password' && 'Yangi parol o‘rnating'}
              </p>
            </div>
          </div>

          {/* 1-bosqich: telefon */}
          {step === 'phone' && (
            <form onSubmit={handleSubmit(onPhoneSubmit)} className="space-y-5">
              <div>
                <div className={inputBox}>
                  <Phone size={18} className="mr-3 text-[#7080ff]" />
                  <Controller
                    name="phone"
                    control={control}
                    rules={{
                      required: 'Telefon raqamini kiriting',
                      validate: (v) => /^\+998\d{9}$/.test(v.replace(/\s+/g, '')) || 'Raqam noto‘g‘ri',
                    }}
                    render={({ field: { onChange, value } }) => (
                      <PhoneInput value={value || ''} onChange={onChange} className={inputCls} />
                    )}
                  />
                </div>
                {errors.phone && <p className="mt-1.5 text-sm text-red-500">{errors.phone.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-full bg-[#5667ff] px-6 py-3.5 text-lg font-bold text-white transition hover:bg-[#4f60ff] disabled:opacity-60">
                {loading ? 'Yuborilmoqda…' : 'Kod yuborish'}
              </button>
            </form>
          )}

          {/* 2-bosqich: kod */}
          {step === 'code' && (
            <div className="space-y-5">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="● ● ● ● ● ●"
                className="w-full rounded-2xl border border-[#d9def7] bg-white py-4 text-center text-2xl font-bold tracking-[0.5em] text-[#18213d] outline-none"
              />
              <div className="flex items-center justify-between text-sm">
                <span className={seconds > 0 ? 'text-[#5f6a92]' : 'text-red-500'}>
                  {seconds > 0 ? `Kod amal qiladi: ${mmss}` : 'Kod muddati tugadi'}
                </span>
                <button
                  type="button"
                  disabled={seconds > 0 || loading}
                  onClick={() => sendCode(phone)}
                  className="font-semibold text-[#5667ff] disabled:text-[#aab1d6]"
                >
                  Qayta yuborish
                </button>
              </div>
              <button
                type="button"
                onClick={onVerify}
                disabled={code.length !== 6 || seconds <= 0 || loading}
                className="w-full rounded-full bg-[#5667ff] px-6 py-3.5 text-lg font-bold text-white transition hover:bg-[#4f60ff] disabled:opacity-60"
              >
                {loading ? 'Tekshirilmoqda…' : 'Tasdiqlash'}
              </button>
            </div>
          )}

          {/* 3-bosqich: yangi parol */}
          {step === 'password' && (
            <form onSubmit={handlePwd(onReset)} className="space-y-5">
              <div>
                <div className={inputBox}>
                  <LockKeyhole size={18} className="mr-3 text-[#7080ff]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Yangi parol"
                    className={inputCls}
                    {...register('password', { required: 'Parol kiriting', minLength: { value: 6, message: 'Kamida 6 ta belgi' } })}
                  />
                  <button type="button" onClick={() => setShowPassword((p) => !p)} className="ml-3 text-[#7080ff]">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {pwdErr.password && <p className="mt-1.5 text-sm text-red-500">{pwdErr.password.message}</p>}
              </div>
              <div>
                <div className={inputBox}>
                  <LockKeyhole size={18} className="mr-3 text-[#7080ff]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Parolni takrorlang"
                    className={inputCls}
                    {...register('confirm', {
                      required: 'Parolni takrorlang',
                      validate: (v) => v === watch('password') || 'Parollar mos emas',
                    })}
                  />
                </div>
                {pwdErr.confirm && <p className="mt-1.5 text-sm text-red-500">{pwdErr.confirm.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-full bg-[#5667ff] px-6 py-3.5 text-lg font-bold text-white transition hover:bg-[#4f60ff] disabled:opacity-60">
                {loading ? 'Saqlanmoqda…' : 'Parolni saqlash'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[#5f6a92]">
            <Link href={paths.login} className="font-semibold text-[#5667ff] hover:text-[#3f52ff]">
              ← Kirishga qaytish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

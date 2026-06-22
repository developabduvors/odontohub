'use client';

import { type InputHTMLAttributes, type FC } from 'react';

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

// Raqamlarni ajratib oladi. Brauzer autofill '+' siz to'liq raqam berishi
// mumkin (998901234567) — '998' mamlakat kodini ham olib tashlaymiz, so'ng
// 9 ta abonent raqamigacha cheklaymiz.
const stripDigits = (v: string) => {
  let s = v.replace(/[^\d]/g, '');
  if (s.length > 9 && s.startsWith('998')) s = s.slice(3);
  return s.slice(0, 9);
};

// "901234567" -> "90 123 45 67" (prefiksiz, faqat ko'rinish uchun)
const formatNational = (digits: string) => {
  const d = digits.slice(0, 9);
  let out = '';
  if (d.length > 0) out += d.slice(0, 2);
  if (d.length > 2) out += ' ' + d.slice(2, 5);
  if (d.length > 5) out += ' ' + d.slice(5, 7);
  if (d.length > 7) out += ' ' + d.slice(7, 9);
  return out;
};

const PhoneInput: FC<PhoneInputProps> = ({ value, onChange, className, style, ...props }) => {
  const digits = stripDigits(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = stripDigits(e.target.value);
    // Formaga +998 bilan boradi (validatsiya /^\+998\d{9}$/ ga mos);
    // raqam bo'lmasa bo'sh — "required" xatosi ishlashi uchun.
    onChange(d ? '+998 ' + formatNational(d) : '');
  };

  return (
    <>
      {/* +998 — doimiy, tahrirlanmaydigan prefiks */}
      <span className="select-none pr-1 text-base text-[#18213d]" style={style}>
        +998
      </span>
      <input
        type="tel"
        inputMode="numeric"
        value={formatNational(digits)}
        onChange={handleChange}
        className={className}
        style={style}
        {...props}
        placeholder="90 123 45 67"
      />
    </>
  );
};

export default PhoneInput;

'use client';

import { type InputHTMLAttributes, type FC } from 'react';

const PREFIX = '+998 ';

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

const stripPrefix = (v: string) => {
  let s = v;
  if (s.startsWith('+998')) s = s.slice(4);
  s = s.replace(/[^\d]/g, '');
  return s;
};

const formatDigits = (digits: string) => {
  const d = digits.slice(0, 9);
  let out = PREFIX;
  if (d.length > 0) out += d.slice(0, 2);
  if (d.length > 2) out += ' ' + d.slice(2, 5);
  if (d.length > 5) out += ' ' + d.slice(5, 7);
  if (d.length > 7) out += ' ' + d.slice(7, 9);
  return out.trimEnd();
};

const PhoneInput: FC<PhoneInputProps> = ({ value, onChange, className, ...props }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    const digits = stripPrefix(raw);
    onChange(formatDigits(digits));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const digits = stripPrefix(value);
      if (digits.length === 0) {
        e.preventDefault();
        return;
      }
      const pos = e.currentTarget.selectionStart ?? 0;
      const prefixLen = PREFIX.length;
      if (pos <= prefixLen && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        const stripped = digits.slice(0, -1);
        onChange(formatDigits(stripped));
        setTimeout(() => e.currentTarget.setSelectionRange(prefixLen, prefixLen), 0);
      }
    }
  };

  return (
    <input
      type="tel"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={className}
      {...props}
    />
  );
};

export default PhoneInput;

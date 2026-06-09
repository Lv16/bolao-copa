'use client';

import { useId, useState } from 'react';

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px] stroke-current"
      fill="none"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3.2" />
      {!open && <path d="m4 20 16-16" />}
    </svg>
  );
}

type PasswordFieldProps = {
  name: string;
  label: string;
};

export function PasswordField({ name, label }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = useId();

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-semibold text-[#262626]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          className="h-12 w-full rounded-full border border-[#d6d6d6] bg-white px-4 pr-12 text-base text-black outline-none"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a8a8a]"
        >
          <EyeIcon open={showPassword} />
        </button>
      </div>
    </div>
  );
}

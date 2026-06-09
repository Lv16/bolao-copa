'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useState } from 'react';

import copaImage from '@/app/img/copa.jpg';
import logoImage from '@/app/img/logo.png';

type LoginScreenProps = {
  error?: string;
  recovery?: string;
};

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

export function LoginScreen({ error, recovery }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="auth-noise relative min-h-screen overflow-hidden bg-black text-white">
      <div className="auth-grid pointer-events-none absolute inset-0 opacity-10" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.72)_32%,rgba(0,0,0,0.76)_72%,rgba(0,0,0,0.96)_100%)]" />

        <div className="absolute inset-x-0 top-[34%] -translate-y-1/2">
          <img
            src={copaImage.src}
            alt="Bandeiras das selecoes ao fundo"
            className="auth-background-flags mx-auto w-[130vw] max-w-none sm:w-[110vw] lg:w-[72rem]"
          />
        </div>
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-end px-4 pb-8 pt-8 sm:max-w-lg sm:px-6 lg:max-w-5xl lg:justify-center lg:px-10">
        <div className="auth-modal-enter lg:mx-auto lg:w-[25rem]">
          <div className="mb-5 flex justify-center">
            <img
              src={logoImage.src}
              alt="Logo Bolao Copa 2026"
              className="w-44 max-w-[72vw] sm:w-52"
            />
          </div>

          <div className="rounded-[2rem] bg-[#5c5c5f] px-5 pb-6 pt-7 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
            <h2 className="text-center text-[2.1rem] font-black leading-none text-[#d8a11f]">
              Acesse sua Conta
            </h2>

            {error === 'invalid_credentials' && (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                E-mail ou senha invalidos.
              </div>
            )}

            {error === 'missing_fields' && (
              <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                Preencha e-mail e senha para entrar.
              </div>
            )}

            {recovery === 'reset_success' && (
              <div className="mt-5 rounded-2xl border border-[#d8a11f]/40 bg-[#d8a11f]/10 px-4 py-3 text-sm text-yellow-50">
                Senha alterada com sucesso. Agora faca login com a nova senha.
              </div>
            )}

            {recovery === 'not_found' && (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Nenhuma conta foi encontrada com este e-mail.
              </div>
            )}

            <form action="/api/login" method="post" className="mt-8 grid gap-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#262626]">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  className="h-12 w-full rounded-full border border-[#d6d6d6] bg-white px-4 text-base text-black outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#262626]">
                  Senha
                </label>
                <div className="relative">
                  <input
                    name="password"
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
                <div className="mt-2 text-right text-[11px] text-[#2c2c2c]">
                  <Link href="/recuperar-senha" className="transition hover:text-black">
                    Esqueci minha senha
                  </Link>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="mx-auto flex h-12 w-[10.5rem] items-center justify-center rounded-2xl border-2 border-white bg-[#e1a81d] px-8 text-lg font-black uppercase text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
                >
                  Entrar
                </button>
              </div>
            </form>

            <div className="my-4 h-px bg-[#b28b34]/60" />

            <div className="pt-2">
              <Link
                href="/cadastro"
                className="mx-auto flex h-12 w-[10.5rem] items-center justify-center rounded-2xl border-2 border-white bg-[#e1a81d] px-8 text-lg font-black uppercase text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
              >
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

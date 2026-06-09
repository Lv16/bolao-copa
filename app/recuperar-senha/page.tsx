/* eslint-disable @next/next/no-img-element */
import bcrypt from 'bcryptjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import logoImage from '@/app/img/logo.png';
import { prisma } from '@/lib/prisma';

async function validateEmail(formData: FormData) {
  'use server';

  const email = String(formData.get('email')).toLowerCase().trim();

  if (!email) {
    redirect('/recuperar-senha?error=missing_email');
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    redirect('/recuperar-senha?error=email_not_found');
  }

  redirect(`/recuperar-senha?email=${encodeURIComponent(email)}`);
}

async function updatePassword(formData: FormData) {
  'use server';

  const email = String(formData.get('email')).toLowerCase().trim();
  const password = String(formData.get('password'));
  const confirmPassword = String(formData.get('confirmPassword'));

  if (!email || !password || !confirmPassword) {
    redirect(`/recuperar-senha?email=${encodeURIComponent(email)}&error=missing_password`);
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    redirect('/recuperar-senha?error=email_not_found');
  }

  if (password !== confirmPassword) {
    redirect(`/recuperar-senha?email=${encodeURIComponent(email)}&error=password_mismatch`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      password: hashedPassword,
    },
  });

  redirect('/login?recovery=reset_success');
}

export default async function RecuperarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const { error, email } = await searchParams;
  const normalizedEmail = email?.toLowerCase().trim() || '';

  const existingUser = normalizedEmail
    ? await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      })
    : null;

  const showPasswordForm = Boolean(normalizedEmail && existingUser);

  return (
    <main className="min-h-screen bg-black px-4 pb-8 pt-10 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center">
        <img
          src={logoImage.src}
          alt="Logo Bolao Copa 2026"
          className="mb-6 w-44 max-w-[72vw]"
        />

        <div className="w-full rounded-[2rem] bg-[#5c5c5f] px-5 pb-6 pt-7 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
          <h1 className="text-center text-[2rem] font-black leading-none text-[#d8a11f]">
            Recuperar Senha
          </h1>

          <p className="mt-4 text-center text-sm text-white/80">
            {showPasswordForm
              ? 'Agora defina a nova senha para esta conta.'
              : 'Informe seu e-mail para verificarmos se a conta existe.'}
          </p>

          {error === 'missing_email' && (
            <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
              Informe seu e-mail para continuar.
            </div>
          )}

          {error === 'email_not_found' && (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Este e-mail nao existe no sistema.
            </div>
          )}

          {error === 'missing_password' && (
            <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
              Preencha os dois campos de senha.
            </div>
          )}

          {error === 'password_mismatch' && (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              As senhas nao conferem.
            </div>
          )}

          {showPasswordForm ? (
            <form action={updatePassword} className="mt-8 grid gap-6">
              <input type="hidden" name="email" value={normalizedEmail} />

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#262626]">
                  Email
                </label>
                <input
                  value={normalizedEmail}
                  disabled
                  className="h-12 w-full rounded-full border border-[#d6d6d6] bg-white/85 px-4 text-base text-black outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#262626]">
                  Nova senha
                </label>
                <input
                  name="password"
                  type="password"
                  className="h-12 w-full rounded-full border border-[#d6d6d6] bg-white px-4 text-base text-black outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#262626]">
                  Confirmar senha
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  className="h-12 w-full rounded-full border border-[#d6d6d6] bg-white px-4 text-base text-black outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="mx-auto flex h-12 w-[12rem] items-center justify-center rounded-2xl border-2 border-white bg-[#e1a81d] px-8 text-lg font-black uppercase text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
              >
                Alterar Senha
              </button>
            </form>
          ) : (
            <form action={validateEmail} className="mt-8 grid gap-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#262626]">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={normalizedEmail}
                  className="h-12 w-full rounded-full border border-[#d6d6d6] bg-white px-4 text-base text-black outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="mx-auto flex h-12 w-[10.5rem] items-center justify-center rounded-2xl border-2 border-white bg-[#e1a81d] px-8 text-lg font-black uppercase text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
              >
                Verificar
              </button>
            </form>
          )}

          <div className="pt-5 text-center text-sm">
            <Link href="/login" className="text-white/70 transition hover:text-white">
              Voltar para login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

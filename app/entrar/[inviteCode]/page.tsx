/* eslint-disable @next/next/no-img-element */
import bcrypt from 'bcryptjs';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { PasswordField } from '@/app/auth/password-field';
import copaImage from '@/app/img/copa.jpg';
import logoImage from '@/app/img/logo.png';
import { authCookieOptions, sessionCookieName } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { getSingleParam } from '@/lib/route-params';
import { createSessionToken } from '@/lib/session-token';

type PageProps = {
  params: Promise<{
    inviteCode: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

async function joinLeague(formData: FormData) {
  'use server';

  const inviteCode = String(formData.get('inviteCode')).trim().toUpperCase();
  const email = String(formData.get('email')).toLowerCase().trim();
  const password = String(formData.get('password'));
  const confirmPassword = String(formData.get('confirmPassword'));

  if (!inviteCode || !email || !password || !confirmPassword) {
    redirect(`/entrar/${inviteCode || 'COPA26'}?error=missing_fields`);
  }

  if (password !== confirmPassword) {
    redirect(`/entrar/${inviteCode}?error=password_mismatch`);
  }

  const league = await prisma.league.findUnique({
    where: {
      inviteCode,
    },
  });

  if (!league) {
    redirect(`/entrar/${inviteCode}?error=league_not_found`);
  }

  let user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);

    user = await prisma.user.create({
      data: {
        name: email.split('@')[0],
        email,
        password: hashedPassword,
      },
    });
  } else {
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      redirect(`/entrar/${league.inviteCode}?error=invalid_credentials`);
    }
  }

  await prisma.leagueMember.upsert({
    where: {
      leagueId_userId: {
        leagueId: league.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      leagueId: league.id,
      userId: user.id,
      role: 'MEMBER',
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(
    sessionCookieName,
    createSessionToken({
      userId: user.id,
      leagueId: league.id,
    }),
    authCookieOptions
  );

  redirect('/liga');
}

export default async function EntrarLigaPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const inviteCode = getSingleParam(resolvedParams.inviteCode, 'COPA26');
  const error = getSingleParam(resolvedSearchParams.error, '');

  const league = await prisma.league.findUnique({
    where: {
      inviteCode,
    },
  });

  if (!league) {
    return (
      <main className="min-h-screen bg-black px-6 text-white">
        <section className="mx-auto flex min-h-screen max-w-md items-center justify-center">
          <div className="w-full rounded-[2rem] bg-[#5c5c5f] px-5 pb-6 pt-7 text-center shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
            <h1 className="text-[2rem] font-black leading-none text-[#d8a11f]">
              Liga nao encontrada
            </h1>
            <p className="mt-4 text-sm text-white/80">
              Verifique se o link recebido esta correto.
            </p>
            <div className="pt-6">
              <Link
                href="/login"
                className="mx-auto flex h-12 w-[10.5rem] items-center justify-center rounded-2xl border-2 border-white bg-[#e1a81d] px-8 text-lg font-black uppercase text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
              >
                Voltar
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

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
              Entrar na Liga
            </h2>

            <div className="mt-5 rounded-[1.4rem] border border-[#b28b34]/40 bg-black/10 px-4 py-4 text-center text-sm text-white/85">
              Ao continuar, voce entrara automaticamente na liga{' '}
              <span className="font-black text-white">{league.name}</span> por meio deste link.
              <div className="mt-2 text-xs text-white/65">Codigo: {league.inviteCode}</div>
            </div>

            {error === 'invalid_credentials' && (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Este e-mail ja existe. Use a senha correta para entrar nessa conta.
              </div>
            )}

            {error === 'missing_fields' && (
              <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                Preencha todos os campos para continuar.
              </div>
            )}

            {error === 'password_mismatch' && (
              <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                As senhas nao conferem.
              </div>
            )}

            <form action={joinLeague} className="mt-8 grid gap-6">
              <input type="hidden" name="inviteCode" value={league.inviteCode} />

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

              <PasswordField name="password" label="Senha" />
              <PasswordField name="confirmPassword" label="Confirme senha" />

              <div className="my-1 h-px bg-[#b28b34]/60" />

              <div className="pt-1">
                <button
                  type="submit"
                  className="mx-auto flex h-12 w-[10.5rem] items-center justify-center rounded-2xl border-2 border-white bg-[#e1a81d] px-8 text-lg font-black uppercase text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
                >
                  Entrar
                </button>
              </div>
            </form>

            <div className="pt-5 text-center text-sm">
              <Link href="/login" className="text-white/70 transition hover:text-white">
                Voltar para login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

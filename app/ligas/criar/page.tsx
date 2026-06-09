/* eslint-disable @next/next/no-img-element */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import logoImage from '@/app/img/logo.png';
import { ProtectedLink } from '@/app/protected-link';
import { getCurrentUser } from '@/lib/auth';
import { authCookieOptions } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

async function createLeague(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const name = String(formData.get('name')).trim();

  if (!name) {
    return;
  }

  let inviteCode = generateInviteCode();

  let existingLeague = await prisma.league.findUnique({
    where: {
      inviteCode,
    },
  });

  while (existingLeague) {
    inviteCode = generateInviteCode();

    existingLeague = await prisma.league.findUnique({
      where: {
        inviteCode,
      },
    });
  }

  const league = await prisma.league.create({
    data: {
      name,
      inviteCode,
      ownerId: user.id,
    },
  });

  await prisma.leagueMember.create({
    data: {
      leagueId: league.id,
      userId: user.id,
      role: 'ADMIN',
    },
  });

  const cookieStore = await cookies();

  cookieStore.set('bolao_league_id', league.id, authCookieOptions);

  redirect('/liga');
}

export default async function CriarLigaPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 pb-8 pt-8 sm:max-w-lg sm:px-6">
        <div className="mb-5 flex justify-center">
          <img
            src={logoImage.src}
            alt="Logo Bolao Copa 2026"
            className="w-44 max-w-[72vw] sm:w-52"
          />
        </div>

        <div className="rounded-[2rem] border border-[#b28b34] bg-[#8f8f8f] px-7 pb-8 pt-7 text-center shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <h1 className="text-[1.9rem] font-black uppercase leading-none text-white [text-shadow:-1px_0_0_#d8a11f,1px_0_0_#d8a11f,0_-1px_0_#d8a11f,0_1px_0_#d8a11f]">
            Criar Nova Liga
          </h1>

          <p className="mt-4 text-sm text-white/90">
            Voce sera o administrador da Liga e podera convidar participantes.
          </p>

          <form action={createLeague} className="mt-7 grid gap-5">
            <div className="text-left">
              <label className="mb-2 block text-sm font-semibold text-[#545454]">
                Nome da Liga
              </label>

              <input
                name="name"
                type="text"
                className="h-12 w-full rounded-full border border-[#d6d6d6] bg-white px-4 text-base text-black outline-none"
                required
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="mx-auto flex h-12 w-[10.5rem] items-center justify-center rounded-2xl border-2 border-white bg-[#e1a81d] px-8 text-lg font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
              >
                Confirmar
              </button>
            </div>
          </form>

          <div className="pt-5 text-center text-sm">
            <ProtectedLink href="/inicio" className="text-white/75 transition hover:text-white">
              Voltar
            </ProtectedLink>
          </div>
        </div>
      </section>
    </main>
  );
}

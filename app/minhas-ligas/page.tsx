/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import logoImage from '@/app/img/logo.png';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function selectLeague(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const leagueId = String(formData.get('leagueId'));

  if (!leagueId) {
    return;
  }

  const membership = await prisma.leagueMember.findUnique({
    where: {
      leagueId_userId: {
        leagueId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set('bolao_league_id', leagueId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect('/liga');
}

export default async function MinhasLigasPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const memberships = await prisma.leagueMember.findMany({
    where: {
      userId: user.id,
    },
    include: {
      league: {
        include: {
          members: {
            include: {
              user: {
                include: {
                  predictions: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-6 sm:max-w-lg sm:px-6">
        <div className="mb-6 flex justify-center">
          <img
            src={logoImage.src}
            alt="Logo Bolao Copa 2026"
            className="w-44 max-w-[72vw] sm:w-52"
          />
        </div>

        <div className="mx-auto w-full max-w-[15.8rem] rounded-[2rem] border border-[#12338d] bg-[#050812] px-5 py-6 text-center shadow-[0_12px_30px_rgba(0,0,0,0.32)]">
          <h1 className="text-[1.15rem] font-black uppercase tracking-[0.04em] text-white">
            Minhas Ligas
          </h1>
        </div>

        <div className="mt-10 px-3">
          <Link
            href="/inicio"
            className="inline-flex h-11 min-w-[6.1rem] items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            Pagina Inicial
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3">
          {memberships.map((membership) => {
            const ranking = membership.league.members
              .map((member) => {
                const totalPoints = member.user.predictions
                  .filter((prediction) => prediction.leagueId === membership.leagueId)
                  .reduce((sum, prediction) => sum + prediction.points, 0);

                const exactScores = member.user.predictions.filter(
                  (prediction) =>
                    prediction.leagueId === membership.leagueId && prediction.points === 3
                ).length;

                return {
                  userId: member.userId,
                  name: member.user.name,
                  totalPoints,
                  exactScores,
                };
              })
              .sort((a, b) => {
                if (b.totalPoints !== a.totalPoints) {
                  return b.totalPoints - a.totalPoints;
                }

                if (b.exactScores !== a.exactScores) {
                  return b.exactScores - a.exactScores;
                }

                return a.name.localeCompare(b.name);
              });

            const position =
              ranking.findIndex((entry) => entry.userId === user.id) + 1 || 0;

            return (
              <div
                key={membership.id}
                className="rounded-[1.8rem] border border-[#12338d] bg-[#102057] px-4 py-5 text-center shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
              >
                <h2 className="truncate text-center text-[1rem] font-black leading-tight text-white">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#36ff49]" />
                  {membership.league.name}
                </h2>

                <div className="mt-3 flex items-center justify-center text-[0.7rem] text-white/90">
                  <span className="rounded-full bg-white/35 px-4 py-1 leading-none">
                    Minha Posicao: {position}
                  </span>
                </div>

                <form action={selectLeague} className="mt-6 flex justify-center">
                  <input type="hidden" name="leagueId" value={membership.leagueId} />
                  <button
                    type="submit"
                    className="flex h-10 min-w-[7.4rem] items-center justify-center rounded-full border-2 border-white/65 px-5 text-[0.95rem] font-black text-white"
                  >
                    Acessar
                  </button>
                </form>
              </div>
            );
          })}
        </div>

        {memberships.length === 0 && (
          <div className="mt-10 rounded-[1.8rem] border border-[#12338d] bg-[#050812] px-6 py-8 text-center">
            <h2 className="text-lg font-black text-white">Voce ainda nao participa de nenhuma liga</h2>
            <p className="mt-3 text-sm text-white/65">
              Entre em uma liga pela pagina inicial ou crie uma nova.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link
                href="/inicio"
                className="flex h-11 items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-sm font-black text-white"
              >
                Ir para Inicio
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

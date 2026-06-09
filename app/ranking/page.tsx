/* eslint-disable @next/next/no-img-element */
import { redirect } from 'next/navigation';

import logoImage from '@/app/img/logo.png';
import { ProtectedLink } from '@/app/protected-link';
import { requireCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sortRanking } from '@/lib/ranking';

export default async function RankingPage() {
  const session = await requireCurrentSession();

  const league = await prisma.league.findUnique({
    where: {
      id: session.league.id,
    },
    include: {
      members: {
        include: {
          user: {
            include: {
              predictions: {
                where: {
                  leagueId: session.league.id,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!league) {
    redirect('/minhas-ligas');
  }

  const ranking = sortRanking(
    league.members.map((member) => {
      const predictions = member.user.predictions;

      const totalPoints = predictions.reduce(
        (sum, prediction) => sum + prediction.points,
        0
      );

      const exactScores = predictions.filter(
        (prediction) => prediction.points === 3
      ).length;

      const correctResults = predictions.filter(
        (prediction) => prediction.points === 2
      ).length;

      return {
        userId: member.user.id,
        name: member.user.name,
        role: member.role,
        totalPoints,
        predictionsCount: predictions.length,
        exactScores,
        correctResults,
      };
    })
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-6 sm:max-w-lg sm:px-6">
        <div className="mb-5 flex justify-center">
          <img
            src={logoImage.src}
            alt="Logo Bolao Copa 2026"
            className="w-44 max-w-[72vw] sm:w-52"
          />
        </div>

        <div className="mx-auto w-full max-w-[15.3rem] rounded-[2rem] border border-[#12338d] bg-[#050812] px-4 py-4 text-center shadow-[0_12px_34px_rgba(0,0,0,0.38)]">
          <h1 className="text-[1rem] font-black leading-tight text-white">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#36ff49]" />
            {league.name}
          </h1>
          <div className="mt-2 text-[10px] text-white/55">
            {session.membership.role === 'ADMIN' ? 'Administrador' : 'Participante'}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-[9px] text-white/60">
            <span className="rounded-full bg-white/8 px-2 py-1">Membros {league.members.length}</span>
            <span className="rounded-full bg-white/8 px-2 py-1">{league.inviteCode}</span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 px-1">
          <ProtectedLink
            href="/inicio"
            className="flex h-11 min-w-[6.4rem] items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            Pagina Inicial
          </ProtectedLink>

          <ProtectedLink
            href="/liga"
            className="flex h-11 min-w-[6.4rem] items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            Informacoes da liga
          </ProtectedLink>
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#12338d] bg-[#020611] shadow-[0_18px_46px_rgba(0,0,0,0.36)]">
          <div className="grid grid-cols-[64px_repeat(5,minmax(0,1fr))] bg-[#162658] text-center text-[9px] leading-tight text-white">
            <div className="flex items-center justify-center border-r border-[#1b46c3] px-1 py-4">
              <span>Classificacao</span>
            </div>
            <div className="flex items-center justify-center border-r border-[#1b46c3] px-1 py-4">
              <span>Participantes</span>
            </div>
            <div className="flex items-center justify-center border-r border-[#1b46c3] px-1 py-4">
              <span>
                Pontuacao
                <br />
                Total
              </span>
            </div>
            <div className="flex items-center justify-center border-r border-[#1b46c3] px-1 py-4">
              <span>
                Palpites
                <br />
                Feitos
              </span>
            </div>
            <div className="flex items-center justify-center border-r border-[#1b46c3] px-1 py-4">
              <span>
                Palpites
                <br />
                Corretos
              </span>
            </div>
            <div className="flex items-center justify-center px-1 py-4">
              <span>
                Time Escolhido
                <br />
                Vencedor
              </span>
            </div>
          </div>

          <div className="divide-y divide-[#12338d]">
            {ranking.map((item, index) => (
              <div
                key={item.userId}
                className="grid min-h-[4.05rem] grid-cols-[64px_repeat(5,minmax(0,1fr))] text-center text-[10px] text-white"
              >
                <div className="flex items-center justify-center border-r border-[#12338d] bg-[#162658] px-2 font-black">
                  {index + 1}
                </div>
                <div className="flex items-center justify-center border-r border-[#12338d] px-1">
                  <div className="max-w-full">
                    <div className="truncate font-semibold">{item.name}</div>
                    <div className="text-[9px] uppercase text-white/45">{item.role}</div>
                  </div>
                </div>
                <div className="flex items-center justify-center border-r border-[#12338d] px-1">
                  {item.totalPoints}
                </div>
                <div className="flex items-center justify-center border-r border-[#12338d] px-1">
                  {item.predictionsCount}
                </div>
                <div className="flex items-center justify-center border-r border-[#12338d] px-1">
                  {item.exactScores}
                </div>
                <div className="flex items-center justify-center px-1">
                  {item.correctResults}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

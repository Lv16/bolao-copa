/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { MatchPhase } from '@prisma/client';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import logoImage from '@/app/img/logo.png';
import { getFlagUrl } from '@/lib/flags';
import { formatPhase, isMatchPredictionLocked } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { MatchCard } from './match-card';

async function savePrediction(formData: FormData) {
  'use server';

  const cookieStore = await cookies();

  const userId = cookieStore.get('bolao_user_id')?.value;
  const leagueId = cookieStore.get('bolao_league_id')?.value;

  if (!userId || !leagueId) {
    redirect('/entrar/COPA26');
  }

  const matchId = String(formData.get('matchId'));

  if (!matchId) {
    return;
  }

  const setting = await prisma.appSetting.findUnique({
    where: {
      key: 'predictions_locked',
    },
  });

  if (setting?.value === 'true') {
    return;
  }

  const match = await prisma.match.findUnique({
    where: {
      id: matchId,
    },
    select: {
      id: true,
      startsAt: true,
      status: true,
    },
  });

  if (!match) {
    return;
  }

  const matchLocked = isMatchPredictionLocked({
    startsAt: match.startsAt,
    status: match.status,
    globalLocked: false,
  });

  if (matchLocked) {
    return;
  }

  const homeScore = Number(formData.get('homeScore'));
  const awayScore = Number(formData.get('awayScore'));

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return;
  }

  const winnerTeamIdValue = formData.get('winnerTeamId');
  const winnerTeamId =
    typeof winnerTeamIdValue === 'string' && winnerTeamIdValue
      ? winnerTeamIdValue
      : null;

  await prisma.prediction.upsert({
    where: {
      leagueId_userId_matchId: {
        leagueId,
        userId,
        matchId,
      },
    },
    update: {
      homeScore,
      awayScore,
      winnerTeamId,
    },
    create: {
      leagueId,
      userId,
      matchId,
      homeScore,
      awayScore,
      winnerTeamId,
    },
  });

  revalidatePath('/palpites');
  redirect('/palpites');
}

export default async function PalpitesPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get('bolao_user_id')?.value;
  const leagueId = cookieStore.get('bolao_league_id')?.value;

  if (!userId || !leagueId) {
    redirect('/entrar/COPA26');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  const league = await prisma.league.findUnique({
    where: {
      id: leagueId,
    },
  });

  const setting = await prisma.appSetting.findUnique({
    where: {
      key: 'predictions_locked',
    },
  });

  const globalLocked = setting?.value === 'true';

  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: {
          userId,
          leagueId,
        },
      },
    },
    orderBy: {
      number: 'asc',
    },
  });

  const matchesByPhaseAndGroup = matches.reduce((acc, match) => {
    const phase = match.phase;
    const group = match.groupName ?? 'Mata-mata';

    if (!acc[phase]) {
      acc[phase] = {};
    }

    if (!acc[phase][group]) {
      acc[phase][group] = [];
    }

    acc[phase][group].push(match);

    return acc;
  }, {} as Record<string, Record<string, typeof matches>>);

  const phaseOrder: MatchPhase[] = [
    'GROUP',
    'ROUND_OF_32',
    'ROUND_OF_16',
    'QUARTER_FINAL',
    'SEMI_FINAL',
    'THIRD_PLACE',
    'FINAL',
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-12 pt-6 sm:max-w-lg sm:px-6">
        <div className="mb-6 flex justify-center">
          <img
            src={logoImage.src}
            alt="Logo Bolao Copa 2026"
            className="w-44 max-w-[72vw] sm:w-52"
          />
        </div>

        <div className="mx-auto w-full max-w-[15.6rem] rounded-[2rem] border border-[#12338d] bg-[#050812] px-5 py-4 text-center shadow-[0_12px_30px_rgba(0,0,0,0.32)]">
          <h1 className="text-[1.1rem] font-black uppercase leading-tight text-white">
            Palpite
          </h1>
          <div className="mt-3 space-y-1 text-left text-[11px] leading-relaxed text-white/70">
            <p>1- Escolha quantos gols cada time fara;</p>
            <p>2- Confirme sua escolha;</p>
            <p>3- Acompanhe a classificacao da Liga.</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 px-1">
          <Link
            href="/inicio"
            className="flex h-11 min-w-[6.6rem] items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-sm font-black leading-tight text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            Pagina inicial
          </Link>

          <Link
            href="/liga"
            className="flex h-11 min-w-[6.6rem] items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-center text-sm font-black leading-tight text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            Informacoes
            <br />
            da Liga
          </Link>
        </div>

        {globalLocked && (
          <div className="mt-6 rounded-[1.4rem] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Os palpites estao bloqueados no momento.
          </div>
        )}

        <div className="mt-8 space-y-8">
          {phaseOrder.map((phase) => {
            const phaseGroups = matchesByPhaseAndGroup[phase];

            if (!phaseGroups) {
              return null;
            }

            return (
              <div key={phase}>
                <div className="mb-4">
                  <h2 className="text-lg font-black text-white">{formatPhase(phase)}</h2>
                </div>

                <div className="space-y-5">
                  {Object.entries(phaseGroups).map(([groupName, groupMatches]) => (
                    <div key={`${phase}-${groupName}`} className="space-y-4">
                      <div className="inline-flex rounded-full border border-[#e1a81d] px-3 py-1 text-sm font-bold text-[#e1a81d]">
                        {phase === 'GROUP' ? `Grupo ${groupName}` : groupName}
                      </div>

                      {groupMatches.map((match) => {
                        const prediction = match.predictions[0];
                        const homeName = match.homeTeam?.name ?? match.homeSlot ?? 'A definir';
                        const awayName = match.awayTeam?.name ?? match.awaySlot ?? 'A definir';
                        const homeFlag = getFlagUrl(match.homeTeam?.name);
                        const awayFlag = getFlagUrl(match.awayTeam?.name);

                        const matchLocked = isMatchPredictionLocked({
                          startsAt: match.startsAt,
                          status: match.status,
                          globalLocked,
                        });

                        return (
                          <MatchCard
                            key={match.id}
                            action={savePrediction}
                            matchId={match.id}
                            matchNumber={match.number}
                            startsAtLabel={
                              match.startsAt
                                ? match.startsAt.toLocaleString('pt-BR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })
                                : null
                            }
                            phase={match.phase}
                            homeName={homeName}
                            awayName={awayName}
                            homeFlag={homeFlag}
                            awayFlag={awayFlag}
                            homeTeamId={match.homeTeam?.id}
                            awayTeamId={match.awayTeam?.id}
                            finalHomeScore={match.homeScore ?? '-'}
                            finalAwayScore={match.awayScore ?? '-'}
                            predictionHomeScore={prediction?.homeScore}
                            predictionAwayScore={prediction?.awayScore}
                            predictionWinnerTeamId={prediction?.winnerTeamId}
                            predictionPoints={prediction?.points}
                            matchLocked={matchLocked}
                            globalLocked={globalLocked}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-xs text-white/45">
          Liga: {league?.name ?? 'Nao encontrada'} • Usuario: {user?.name ?? 'Nao encontrado'}
        </div>
      </section>
    </main>
  );
}

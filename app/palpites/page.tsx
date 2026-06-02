import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MatchPhase } from '@prisma/client';
import { formatPhase, formatStatus, isMatchPredictionLocked } from '@/lib/format';

async function savePredictions(formData: FormData) {
  'use server';

  const cookieStore = await cookies();

  const userId = cookieStore.get('bolao_user_id')?.value;
  const leagueId = cookieStore.get('bolao_league_id')?.value;

  if (!userId || !leagueId) {
    redirect('/entrar/COPA26');
  }

  const setting = await prisma.appSetting.findUnique({
    where: {
      key: 'predictions_locked',
    },
  });

  if (setting?.value === 'true') {
    return;
  }

  const matches = await prisma.match.findMany({
    select: {
      id: true,
      startsAt: true,
      status: true,
    },
  });

  for (const match of matches) {
    const matchLocked = isMatchPredictionLocked({
      startsAt: match.startsAt,
      status: match.status,
      globalLocked: false,
    });

    if (matchLocked) {
      continue;
    }
    const homeValue = formData.get(`homeScore_${match.id}`);
    const awayValue = formData.get(`awayScore_${match.id}`);

    if (homeValue === null || awayValue === null) {
      continue;
    }

    const homeScore = Number(homeValue);
    const awayScore = Number(awayValue);

    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
      continue;
    }

    await prisma.prediction.upsert({
      where: {
        leagueId_userId_matchId: {
          leagueId,
          userId,
          matchId: match.id,
        },
      },
      update: {
        homeScore,
        awayScore,
      },
      create: {
        leagueId,
        userId,
        matchId: match.id,
        homeScore,
        awayScore,
      },
    });
  }

  revalidatePath('/palpites');
  redirect('/palpites');
}

export default async function PalpitesPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("bolao_user_id")?.value;
  const leagueId = cookieStore.get("bolao_league_id")?.value;

  if (!userId || !leagueId) {
    redirect("/entrar/COPA26");
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
      key: "predictions_locked",
    },
  });

  const globalLocked = setting?.value === "true";

  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions:
        user && league
          ? {
              where: {
                userId: user.id,
                leagueId: league.id,
              },
            }
          : true,
    },
    orderBy: {
      number: "asc",
    },
  });

  const totalMatches = matches.length;

  const filledPredictions = matches.filter((match) => {
    const prediction = match.predictions[0];

    return (
      prediction &&
      prediction.homeScore !== null &&
      prediction.awayScore !== null
    );
  }).length;

  const pendingPredictions = totalMatches - filledPredictions;

  const progressPercentage =
    totalMatches > 0 ? Math.round((filledPredictions / totalMatches) * 100) : 0;

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
  }, {} as Record<string, Record<string, typeof matches[number][]>>);

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
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              Palpites
            </p>

            <h1 className="text-4xl font-bold">Meus palpites</h1>

            <p className="mt-2 text-zinc-400">
              Preencha seus placares antes do bloqueio geral da Copa.
            </p>

            <div className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
              Liga: {league?.name ?? "Não encontrada"} — Usuário:{" "}
              {user?.name ?? "Não encontrado"}
            </div>

            {globalLocked && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                Os palpites estão bloqueados.
              </div>
            )}
            
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
              <h3 className="font-bold mb-2">Progresso dos palpites</h3>
              <p className="mb-3">{filledPredictions} de {totalMatches} jogos preenchidos.</p>

              <div className="mb-2 flex items-center gap-4">
                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div style={{ width: `${progressPercentage}%` }} className="h-3 bg-green-500" />
                </div>
                <div className="text-sm font-bold">{progressPercentage}%</div>
              </div>

              <p className="text-sm text-zinc-400">
                {pendingPredictions === 0
                  ? 'Todos os palpites foram preenchidos.'
                  : `Faltam ${pendingPredictions} palpite(s) para completar todos os jogos.`}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="/"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
            >
              Home
            </a>

            <a
              href="/admin/resultados"
              className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
            >
              Admin
            </a>
          </div>
        </div>

        <form action={savePredictions} className="grid gap-4">
          {phaseOrder.map((phase) => {
            const phaseGroups = matchesByPhaseAndGroup[phase as string];

            if (!phaseGroups) {
              return null;
            }

            return (
              <div key={phase}>
                <div className="mb-3">
                  <h3 className="text-xl font-bold">{formatPhase(phase as MatchPhase)}</h3>
                  <p className="text-sm text-zinc-400">Preencha os placares dos jogos desta fase.</p>
                </div>

                {Object.entries(phaseGroups).map(([groupName, groupMatches]) => (
                  <div key={groupName} className="mb-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold">
                          {phase === 'GROUP' ? `Grupo ${groupName}` : groupName}
                        </h4>

                        <p className="text-sm text-zinc-400">{groupMatches.length} jogos</p>
                      </div>
                    </div>

                    {groupMatches.map((match) => {
                      const prediction = match.predictions[0];

                      const matchLocked = isMatchPredictionLocked({
                        startsAt: match.startsAt,
                        status: match.status,
                        globalLocked,
                      });

                      return (
                        <div
                          key={match.id}
                          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 mb-3"
                        >
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
                                Jogo {match.number}
                              </span>

                              {match.groupName && (
                                <span className="ml-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                                  {phase === 'GROUP' ? `Grupo ${match.groupName}` : match.groupName}
                                </span>
                              )}
                            </div>

                            <div className="text-right text-xs text-zinc-500">
                              <div>Status: {formatStatus(match.status)}</div>
                              {match.startsAt && (
                                <div className="text-xs text-zinc-400">
                                  {match.startsAt.toLocaleString('pt-BR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </div>
                              )}

                              {matchLocked ? (
                                <div className="mt-1 text-red-300">Palpite bloqueado</div>
                              ) : prediction ? (
                                <div className="mt-1 text-green-300">
                                  Palpite salvo — {prediction.points} pts
                                </div>
                              ) : (
                                <div className="mt-1 text-zinc-400">Pendente</div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-[1fr_90px_40px_90px_1fr_auto] items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold">
                                {match.homeTeam?.name ?? match.homeSlot}
                              </p>
                              <p className="text-xs text-zinc-500">{match.homeSlot}</p>
                            </div>

                            <input
                              name={`homeScore_${match.id}`}
                              type="number"
                              min="0"
                              defaultValue={prediction?.homeScore ?? ""}
                              disabled={matchLocked}
                              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-center font-bold outline-none focus:border-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <span className="text-center font-bold text-zinc-500">x</span>

                            <input
                              name={`awayScore_${match.id}`}
                              type="number"
                              min="0"
                              defaultValue={prediction?.awayScore ?? ""}
                              disabled={matchLocked}
                              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-center font-bold outline-none focus:border-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <div>
                              <p className="font-bold">
                                {match.awayTeam?.name ?? match.awaySlot}
                              </p>
                              <p className="text-xs text-zinc-500">{match.awaySlot}</p>
                            </div>

                            <div />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
          <div className="mt-6">
            <button
              type="submit"
              disabled={globalLocked}
              className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salvar todos os palpites — {filledPredictions}/{totalMatches}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

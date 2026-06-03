import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { MatchPhase, MatchStatus } from "@prisma/client";
import { formatPhase, formatStatus } from '@/lib/format';
import { advanceKnockoutWinner, resolveSimpleKnockoutSlots } from '@/lib/knockout';

async function updateResult(formData: FormData) {
  "use server";
  const session = await getCurrentSession();

  if (!session || !session.user.isSystemAdmin) {
    return;
  }

  const matchId = String(formData.get("matchId"));
  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));
  const winnerTeamId = String(formData.get('winnerTeamId') || '');

  if (!matchId || Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return;
  }

  await prisma.match.update({
    where: {
      id: matchId,
    },
    data: {
      homeScore,
      awayScore,
      status: MatchStatus.FINISHED,
      winnerTeamId: winnerTeamId || null,
    },
  });

  await recalculatePredictions(matchId);
  await resolveSimpleKnockoutSlots();
  await advanceKnockoutWinner(matchId);

  revalidatePath("/");
  revalidatePath("/admin/resultados");
  revalidatePath('/');
  revalidatePath('/palpites');
  revalidatePath('/admin/resultados');
  revalidatePath('/admin/terceiros');
  revalidatePath('/ranking');
  redirect("/admin/resultados");
}

async function recalculatePredictions(matchId: string) {
  const match = await prisma.match.findUnique({
    where: {
      id: matchId,
    },
    include: {
      predictions: true,
    },
  });

  if (!match || match.homeScore === null || match.awayScore === null) {
    return;
  }

  const realHome = match.homeScore;
  const realAway = match.awayScore;

  const getResult = (home: number, away: number) => {
    if (home > away) return "HOME";
    if (home < away) return "AWAY";
    return "DRAW";
  };

  const realResult = getResult(realHome, realAway);

  for (const prediction of match.predictions) {
    let points = 0;

    const exactScore =
      prediction.homeScore === realHome && prediction.awayScore === realAway;

    if (match.phase !== 'GROUP') {
      const realWinnerTeamId =
        match.winnerTeamId ??
        (realHome > realAway
          ? match.homeTeamId
          : realAway > realHome
          ? match.awayTeamId
          : null);

      const predictedWinnerCorrect =
        !!prediction.winnerTeamId &&
        !!realWinnerTeamId &&
        prediction.winnerTeamId === realWinnerTeamId;

      if (exactScore && predictedWinnerCorrect) {
        points = 3;
      } else if (predictedWinnerCorrect) {
        points = 2;
      }
    } else {
      const predictedResult = getResult(
        prediction.homeScore,
        prediction.awayScore
      );

      if (exactScore) {
        points = 3;
      } else if (predictedResult === realResult) {
        points = 2;
      }
    }

    await prisma.prediction.update({
      where: {
        id: prediction.id,
      },
      data: {
        points,
      },
    });
  }
}

export default async function AdminResultadosPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.user.isSystemAdmin) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Acesso negado</h1>
            <p className="mb-4 text-zinc-400">
              Apenas administradores da liga podem lançar resultados.
            </p>
            <a
              href="/"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
            >
              Voltar para Home
            </a>
          </div>
        </section>
      </main>
    );
  }

  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      number: "asc",
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
              Admin
            </p>

            <h1 className="text-4xl font-bold">Lançar resultados</h1>

            <p className="mt-2 text-zinc-400">
              Preencha o placar real. Ao salvar, o jogo será finalizado e os
              palpites serão recalculados.
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
          >
            Voltar
          </a>
        </div>

        <div className="grid gap-4">
          {phaseOrder.map((phase) => {
            const phaseGroups = matchesByPhaseAndGroup[phase as string];

            if (!phaseGroups) {
              return null;
            }

            return (
              <div key={phase}>
                <div className="mb-3">
                  <h3 className="text-xl font-bold">{formatPhase(phase as MatchPhase)}</h3>
                  <p className="text-sm text-zinc-400">Lance os resultados reais dos jogos desta fase.</p>
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

                    {groupMatches.map((match) => (
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
                                Grupo {match.groupName}
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-zinc-500">{formatStatus(match.status)}</span>
                        </div>

                        <form
                          action={updateResult}
                          className="grid grid-cols-[1fr_90px_40px_90px_1fr_auto] items-center gap-3"
                        >
                          <input type="hidden" name="matchId" value={match.id} />

                          <div className="text-right">
                            <p className="font-bold">
                              {match.homeTeam?.name ?? match.homeSlot}
                            </p>
                            <p className="text-xs text-zinc-500">{match.homeSlot}</p>
                          </div>

                          <input
                            name="homeScore"
                            type="number"
                            min="0"
                            defaultValue={match.homeScore ?? ""}
                            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-center font-bold outline-none focus:border-green-400"
                            required
                          />

                          <span className="text-center font-bold text-zinc-500">x</span>

                          <input
                            name="awayScore"
                            type="number"
                            min="0"
                            defaultValue={match.awayScore ?? ""}
                            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-center font-bold outline-none focus:border-green-400"
                            required
                          />

                          <div>
                            <p className="font-bold">
                              {match.awayTeam?.name ?? match.awaySlot}
                            </p>
                            <p className="text-xs text-zinc-500">{match.awaySlot}</p>
                          </div>

                          {match.phase !== 'GROUP' && (
                            <div className="flex flex-col">
                              <label className="text-xs text-zinc-400 mb-1">Vencedor</label>
                              <select
                                name="winnerTeamId"
                                defaultValue={match.winnerTeamId ?? ''}
                                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none"
                              >
                                <option value="">—</option>
                                {match.homeTeam && (
                                  <option value={match.homeTeam.id}>{match.homeTeam.name}</option>
                                )}
                                {match.awayTeam && (
                                  <option value={match.awayTeam.id}>{match.awayTeam.name}</option>
                                )}
                              </select>
                            </div>
                          )}

                          <button
                            type="submit"
                            className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
                          >
                            Salvar
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

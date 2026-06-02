import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { MatchPhase } from '@prisma/client';
import { formatPhase, formatStatus } from '@/lib/format';

export default async function Home() {
  const session = await getCurrentSession();

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

  const league = await prisma.league.findFirst();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
            Bolão
          </p>

          <h1 className="mb-3 text-4xl font-bold">Copa 2026</h1>

          <p className="max-w-2xl text-zinc-400">
            Crie uma liga, faça seus palpites e acompanhe o ranking conforme os
            resultados forem lançados.
          </p>

          {session ? (
            <div className="mt-6 grid gap-2">
              <div className="inline-flex rounded-full bg-green-500/10 px-4 py-2 text-sm text-green-300">
                Logado como: {session.user.name}
              </div>

              <div className="inline-flex rounded-full bg-green-500/10 px-4 py-2 text-sm text-green-300">
                Liga ativa: {session.league.name}
              </div>
            </div>
          ) : (
            <div className="mt-6 inline-flex rounded-full bg-green-500/10 px-4 py-2 text-sm text-green-300">
              Você ainda não está logado.
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Jogos cadastrados</h2>
            <p className="text-sm text-zinc-400">
              Por enquanto estamos usando os jogos do seed inicial.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <a
                  href="/liga"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Minha Liga
                </a>

                <a
                  href="/palpites"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Meus Palpites
                </a>

                <a
                  href="/ranking"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Ranking
                </a>

                <a
                  href="/minhas-ligas"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Minhas Ligas
                </a>

                {session.user.isSystemAdmin && (
                  <>
                    <a
                      href="/admin/resultados"
                      className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
                    >
                      Resultados
                    </a>

                    <a
                      href="/admin/configuracoes"
                      className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
                    >
                      Configurações
                    </a>

                    <a
                      href="/admin/classificacao"
                      className="rounded-xl border border-purple-500/40 px-5 py-3 text-sm font-bold text-purple-300 transition hover:bg-purple-500 hover:text-white"
                    >
                      Classificação
                    </a>
                  </>
                )}

                <a
                  href="/logout"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Sair
                </a>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
                >
                  Login
                </a>

                <a
                  href="/entrar/COPA26"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Entrar por convite
                </a>
              </>
            )}
          </div>
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
                  <p className="text-sm text-zinc-400">Jogos organizados por grupo/fase.</p>
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
                        <div className="mb-3 flex items-center justify-between gap-4">
                          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
                            Jogo {match.number}
                          </span>

                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                            {formatStatus(match.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {match.homeTeam?.name ?? match.homeSlot}
                            </p>
                            <p className="text-xs text-zinc-500">{match.homeSlot}</p>
                          </div>

                          <div className="rounded-xl bg-zinc-800 px-4 py-2 font-bold">
                            {match.homeScore !== null && match.awayScore !== null
                              ? `${match.homeScore} x ${match.awayScore}`
                              : 'x'}
                          </div>

                          <div>
                            <p className="text-lg font-bold">
                              {match.awayTeam?.name ?? match.awaySlot}
                            </p>
                            <p className="text-xs text-zinc-500">{match.awaySlot}</p>
                          </div>
                        </div>

                        <div className="mt-4 text-xs text-zinc-500">
                          Status: {formatStatus(match.status)}
                        </div>
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

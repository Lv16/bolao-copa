import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RankingPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

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

  const ranking = league.members
    .map((member) => {
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
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      if (b.exactScores !== a.exactScores) {
        return b.exactScores - a.exactScores;
      }

      return a.name.localeCompare(b.name);
    });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              Ranking
            </p>

            <h1 className="text-4xl font-bold">
              {league.name}
            </h1>

            <p className="mt-2 text-zinc-400">
              Pontuação geral da liga ativa. Critério de desempate: mais placares exatos.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/liga"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
            >
              Liga
            </a>

            <a
              href="/palpites"
              className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
            >
              Palpites
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <table className="w-full border-collapse">
            <thead className="bg-zinc-800/80 text-left text-sm text-zinc-300">
              <tr>
                <th className="px-5 py-4">#</th>
                <th className="px-5 py-4">Participante</th>
                <th className="px-5 py-4 text-center">Pontos</th>
                <th className="px-5 py-4 text-center">Palpites</th>
                <th className="px-5 py-4 text-center">Cravadas</th>
                <th className="px-5 py-4 text-center">Vencedor</th>
              </tr>
            </thead>

            <tbody>
              {ranking.map((item, index) => (
                <tr key={item.userId} className="border-t border-zinc-800">
                  <td className="px-5 py-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 font-bold">
                      {index + 1}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.role}</div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="rounded-full bg-green-500/10 px-4 py-2 font-bold text-green-300">
                      {item.totalPoints}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center text-zinc-300">
                    {item.predictionsCount}
                  </td>

                  <td className="px-5 py-4 text-center text-zinc-300">
                    {item.exactScores}
                  </td>

                  <td className="px-5 py-4 text-center text-zinc-300">
                    {item.correctResults}
                  </td>
                </tr>
              ))}

              {ranking.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-zinc-500">
                    Nenhum participante encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
import { prisma } from '@/lib/prisma';
import { calculateGroupStandings, getQualifiedSlots } from '@/lib/standings';
import { requireUser } from '@/lib/require-session';

export default async function AdminClassificacaoPage() {
  const user = await requireUser();

  if (!user.isSystemAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-red-500/10 p-8">
          <h1 className="text-2xl font-bold text-red-300">
            Acesso negado
          </h1>

          <p className="mt-2 text-red-100/80">
            Apenas o admin do sistema pode acessar a classificação geral.
          </p>

          <a
            href="/"
            className="mt-6 inline-flex rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950"
          >
            Voltar
          </a>
        </div>
      </main>
    );
  }

  const matches = await prisma.match.findMany({
    where: {
      phase: 'GROUP',
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: [
      {
        groupName: 'asc',
      },
      {
        number: 'asc',
      },
    ],
  });

  const standingsByGroup = calculateGroupStandings(matches);
  const qualifiedSlots = getQualifiedSlots(standingsByGroup);

  const groups = Object.keys(standingsByGroup).sort();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              Admin
            </p>

            <h1 className="text-4xl font-bold">
              Classificação dos grupos
            </h1>

            <p className="mt-2 text-zinc-400">
              Calculada automaticamente com base nos resultados finalizados.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/admin/resultados"
              className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
            >
              Resultados
            </a>

            <a
              href="/"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
            >
              Home
            </a>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">
            Slots classificados
          </h2>

          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Object.entries(qualifiedSlots).map(([slot, team]) => (
              <div
                key={slot}
                className="rounded-2xl bg-zinc-950 p-4"
              >
                <div className="text-sm font-bold text-green-300">
                  {slot}
                </div>

                <div className="mt-1 font-bold">
                  {team.teamName}
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  {team.points} pts • SG {team.goalDifference}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {groups.map((groupName) => {
            const rows = standingsByGroup[groupName];

            return (
              <div
                key={groupName}
                className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900"
              >
                <div className="flex items-center justify-between bg-zinc-800/80 px-5 py-4">
                  <h2 className="text-xl font-bold">
                    Grupo {groupName}
                  </h2>

                  <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-zinc-300">
                    {rows.length} seleções
                  </span>
                </div>

                <table className="w-full border-collapse text-sm">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Seleção</th>
                      <th className="px-4 py-3 text-center">P</th>
                      <th className="px-4 py-3 text-center">J</th>
                      <th className="px-4 py-3 text-center">V</th>
                      <th className="px-4 py-3 text-center">E</th>
                      <th className="px-4 py-3 text-center">D</th>
                      <th className="px-4 py-3 text-center">GP</th>
                      <th className="px-4 py-3 text-center">GC</th>
                      <th className="px-4 py-3 text-center">SG</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row, index) => (
                      <tr
                        key={row.teamId}
                        className="border-t border-zinc-800"
                      >
                        <td className="px-4 py-3 font-bold">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3 font-bold">
                          {row.teamName}
                        </td>

                        <td className="px-4 py-3 text-center font-bold text-green-300">
                          {row.points}
                        </td>

                        <td className="px-4 py-3 text-center">{row.played}</td>
                        <td className="px-4 py-3 text-center">{row.wins}</td>
                        <td className="px-4 py-3 text-center">{row.draws}</td>
                        <td className="px-4 py-3 text-center">{row.losses}</td>
                        <td className="px-4 py-3 text-center">{row.goalsFor}</td>
                        <td className="px-4 py-3 text-center">{row.goalsAgainst}</td>
                        <td className="px-4 py-3 text-center">{row.goalDifference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {groups.length === 0 && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
              Nenhum grupo com resultados finalizados ainda.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

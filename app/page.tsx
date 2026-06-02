import { prisma } from "@/lib/prisma";

export default async function Home() {
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      number: "asc",
    },
  });

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

          {league && (
            <div className="mt-6 inline-flex rounded-full bg-green-500/10 px-4 py-2 text-sm text-green-300">
              Liga padrão: {league.name} — Código: {league.inviteCode}
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
            <a
              href="/admin/resultados"
              className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
            >
              Painel Admin
            </a>

            <a
              href="/logout"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
            >
              Sair
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
                  Jogo {match.number}
                </span>

                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                  Grupo {match.groupName}
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
                    : "x"}
                </div>

                <div>
                  <p className="text-lg font-bold">
                    {match.awayTeam?.name ?? match.awaySlot}
                  </p>
                  <p className="text-xs text-zinc-500">{match.awaySlot}</p>
                </div>
              </div>

              <div className="mt-4 text-xs text-zinc-500">
                Status: {match.status}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

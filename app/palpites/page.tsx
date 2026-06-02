import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function savePrediction(formData: FormData) {
  "use server";

  const matchId = String(formData.get("matchId"));
  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));

  if (!matchId || Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return;
  }

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

  if (setting?.value === "true") {
    return;
  }

  await prisma.prediction.upsert({
    where: {
      leagueId_userId_matchId: {
        leagueId: league.id,
        userId: user.id,
        matchId,
      },
    },
    update: {
      homeScore,
      awayScore,
    },
    create: {
      leagueId: league.id,
      userId: user.id,
      matchId,
      homeScore,
      awayScore,
    },
  });

  revalidatePath("/palpites");
  redirect("/palpites");
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

  const locked = setting?.value === "true";

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

            {locked && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                Os palpites estão bloqueados.
              </div>
            )}
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

        <div className="grid gap-4">
          {matches.map((match) => {
            const prediction = match.predictions[0];

            return (
              <div
                key={match.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
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

                  <div className="text-right text-xs text-zinc-500">
                    Status: {match.status}
                    {prediction && (
                      <div className="mt-1 text-green-300">
                        Palpite salvo — {prediction.points} pts
                      </div>
                    )}
                  </div>
                </div>

                <form
                  action={savePrediction}
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
                    defaultValue={prediction?.homeScore ?? ""}
                    disabled={locked}
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-center font-bold outline-none focus:border-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />

                  <span className="text-center font-bold text-zinc-500">x</span>

                  <input
                    name="awayScore"
                    type="number"
                    min="0"
                    defaultValue={prediction?.awayScore ?? ""}
                    disabled={locked}
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-center font-bold outline-none focus:border-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />

                  <div>
                    <p className="font-bold">
                      {match.awayTeam?.name ?? match.awaySlot}
                    </p>
                    <p className="text-xs text-zinc-500">{match.awaySlot}</p>
                  </div>

                  <button
                    type="submit"
                    disabled={locked}
                    className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

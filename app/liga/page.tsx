import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function LigaPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const league = await prisma.league.findUnique({
    where: {
      id: session.league.id,
    },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!league) {
    redirect("/minhas-ligas");
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";

  const inviteUrl = `${protocol}://${host}/entrar/${league.inviteCode}`;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              Liga ativa
            </p>

            <h1 className="text-4xl font-bold">{league.name}</h1>

            <p className="mt-2 text-zinc-400">
              Código da liga: {league.inviteCode}
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/minhas-ligas"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
            >
              Trocar Liga
            </a>

            <a
              href="/palpites"
              className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
            >
              Palpites
            </a>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="text-2xl font-bold">Link de convite</h2>

          <p className="mt-2 text-zinc-400">
            Envie este link para quem você quer chamar para a liga.
          </p>

          <div className="mt-5 rounded-2xl bg-zinc-950 p-4 text-sm text-green-300">
            {inviteUrl}
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <a
            href="/palpites"
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-green-500/40"
          >
            <div className="text-3xl font-bold">⚽</div>
            <h3 className="mt-3 text-xl font-bold">Palpites</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Preencher ou revisar seus palpites.
            </p>
          </a>

          <a
            href="/ranking"
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-green-500/40"
          >
            <div className="text-3xl font-bold">🏆</div>
            <h3 className="mt-3 text-xl font-bold">Ranking</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Ver a classificação da liga.
            </p>
          </a>

          <a
            href="/minhas-ligas"
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-green-500/40"
          >
            <div className="text-3xl font-bold">🔁</div>
            <h3 className="mt-3 text-xl font-bold">Minhas ligas</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Trocar entre ligas que você participa.
            </p>
          </a>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="mb-5 text-2xl font-bold">Participantes</h2>

          <div className="grid gap-3">
            {league.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl bg-zinc-950 px-5 py-4"
              >
                <div>
                  <div className="font-bold">{member.user.name}</div>
                  <div className="text-sm text-zinc-500">
                    {member.user.email}
                  </div>
                </div>

                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

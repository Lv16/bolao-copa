import { prisma } from '@/lib/prisma';
import { getCurrentUser, getCurrentSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function selectLeague(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const leagueId = String(formData.get('leagueId'));

  if (!leagueId) {
    return;
  }

  const membership = await prisma.leagueMember.findUnique({
    where: {
      leagueId_userId: {
        leagueId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set('bolao_league_id', leagueId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect('/palpites');
}

export default async function MinhasLigasPage() {
  const user = await getCurrentUser();
  const session = await getCurrentSession();

  if (!user) {
    redirect('/login');
  }

  const memberships = await prisma.leagueMember.findMany({
    where: {
      userId: user.id,
    },
    include: {
      league: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              Ligas
            </p>

            <h1 className="text-4xl font-bold">
              Minhas ligas
            </h1>

            <p className="mt-2 text-zinc-400">
              Escolha em qual liga você quer fazer palpites e acompanhar o ranking.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
            >
              Home
            </a>

            <a
              href="/ligas/criar"
              className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
            >
              Criar Liga
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          {memberships.map((membership) => {
            const isActive = membership.leagueId === session?.league.id;

            return (
              <div
                key={membership.id}
                className={`rounded-2xl border p-5 ${
                  isActive
                    ? 'border-green-500/40 bg-green-500/10'
                    : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      {membership.league.name}
                    </h2>

                    <p className="mt-1 text-sm text-zinc-400">
                      Código: {membership.league.inviteCode}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Sua função: {membership.role}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isActive && (
                      <span className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-bold text-green-300">
                        Ativa
                      </span>
                    )}

                    <form action={selectLeague}>
                      <input
                        type="hidden"
                        name="leagueId"
                        value={membership.leagueId}
                      />

                      <button
                        type="submit"
                        disabled={isActive}
                        className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Usar esta liga
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}

          {memberships.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
              <h3 className="text-xl font-bold mb-2">Você ainda não participa de nenhuma liga</h3>

              <p className="mb-4 text-sm text-zinc-400">
                Você pode criar sua própria liga ou entrar em uma liga pelo link de convite que alguém te enviar.
              </p>

              <div className="flex items-center justify-center gap-3">
                <a
                  href="/ligas/criar"
                  className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
                >
                  Criar Liga
                </a>

                <a
                  href="/"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Voltar para Home
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
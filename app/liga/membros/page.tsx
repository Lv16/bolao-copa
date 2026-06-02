import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function removeMember(formData: FormData) {
  'use server';

  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  const targetUserId = String(formData.get('userId'));
  const leagueId = session.league.id;

  if (!targetUserId) {
    return;
  }

  if (session.membership.role !== 'ADMIN') {
    return;
  }

  if (targetUserId === session.user.id) {
    return;
  }

  const league = await prisma.league.findUnique({
    where: {
      id: leagueId,
    },
  });

  if (!league) {
    return;
  }

  if (league.ownerId === targetUserId) {
    return;
  }

  await prisma.$transaction([
    prisma.prediction.deleteMany({
      where: {
        leagueId,
        userId: targetUserId,
      },
    }),

    prisma.leagueMember.deleteMany({
      where: {
        leagueId,
        userId: targetUserId,
      },
    }),
  ]);

  revalidatePath('/liga/membros');
  revalidatePath('/ranking');
  revalidatePath('/liga');
}

async function leaveLeague() {
  'use server';

  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  const leagueId = session.league.id;
  const userId = session.user.id;

  const league = await prisma.league.findUnique({
    where: {
      id: leagueId,
    },
  });

  if (!league) {
    redirect('/minhas-ligas');
  }

  if (league.ownerId === userId) {
    return;
  }

  const adminCount = await prisma.leagueMember.count({
    where: {
      leagueId,
      role: 'ADMIN',
    },
  });

  if (session.membership.role === 'ADMIN' && adminCount <= 1) {
    return;
  }

  await prisma.$transaction([
    prisma.prediction.deleteMany({
      where: {
        leagueId,
        userId,
      },
    }),

    prisma.leagueMember.deleteMany({
      where: {
        leagueId,
        userId,
      },
    }),
  ]);

  redirect('/minhas-ligas');
}

async function promoteMember(formData: FormData) {
  'use server';

  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  if (session.membership.role !== 'ADMIN') {
    return;
  }

  const targetUserId = String(formData.get('userId'));
  const leagueId = session.league.id;

  if (!targetUserId) {
    return;
  }

  await prisma.leagueMember.update({
    where: {
      leagueId_userId: {
        leagueId,
        userId: targetUserId,
      },
    },
    data: {
      role: 'ADMIN',
    },
  });

  revalidatePath('/liga/membros');
  revalidatePath('/liga');
}

async function demoteMember(formData: FormData) {
  'use server';

  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  if (session.membership.role !== 'ADMIN') {
    return;
  }

  const targetUserId = String(formData.get('userId'));
  const leagueId = session.league.id;

  if (!targetUserId) {
    return;
  }

  const league = await prisma.league.findUnique({
    where: {
      id: leagueId,
    },
  });

  if (!league) {
    return;
  }

  if (league.ownerId === targetUserId) {
    return;
  }

  const adminCount = await prisma.leagueMember.count({
    where: {
      leagueId,
      role: 'ADMIN',
    },
  });

  if (targetUserId === session.user.id && adminCount <= 1) {
    return;
  }

  await prisma.leagueMember.update({
    where: {
      leagueId_userId: {
        leagueId,
        userId: targetUserId,
      },
    },
    data: {
      role: 'MEMBER',
    },
  });

  revalidatePath('/liga/membros');
  revalidatePath('/liga');
}

export default async function LigaMembrosPage() {
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
          user: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!league) {
    redirect('/minhas-ligas');
  }

  const isLeagueAdmin = session.membership.role === 'ADMIN';
  const isOwner = league.ownerId === session.user.id;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              Liga
            </p>

            <h1 className="text-4xl font-bold">
              Gerenciar membros
            </h1>

            <p className="mt-2 text-zinc-400">
              Liga ativa: {league.name}
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/liga"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
            >
              Voltar
            </a>

            <a
              href="/ranking"
              className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
            >
              Ranking
            </a>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                Participantes
              </h2>

              <p className="mt-2 text-zinc-400">
                {league.members.length} participante(s) nesta liga.
              </p>
            </div>

            <span className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300">
              Sua função: {session.membership.role}
            </span>
          </div>

          <div className="grid gap-3">
            {league.members.map((member) => {
              const memberIsCurrentUser = member.userId === session.user.id;
              const memberIsOwner = member.userId === league.ownerId;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-950 px-5 py-4"
                >
                  <div>
                    <div className="font-bold">
                      {member.user.name}

                      {memberIsCurrentUser && (
                        <span className="ml-2 text-xs text-green-300">
                          Você
                        </span>
                      )}

                      {memberIsOwner && (
                        <span className="ml-2 text-xs text-yellow-300">
                          Dono
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-zinc-500">
                      {member.user.email}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
                      {member.role}
                    </span>

                    {isLeagueAdmin && (
                      <>
                        {member.role === 'MEMBER' && (
                          <form action={promoteMember}>
                            <input
                              type="hidden"
                              name="userId"
                              value={member.userId}
                            />

                            <button
                              type="submit"
                              className="rounded-xl border border-green-500/40 px-4 py-2 text-sm font-bold text-green-300 transition hover:bg-green-500 hover:text-white"
                            >
                              Promover
                            </button>
                          </form>
                        )}

                        {member.role === 'ADMIN' && !memberIsOwner && (
                          <form action={demoteMember}>
                            <input
                              type="hidden"
                              name="userId"
                              value={member.userId}
                            />

                            <button
                              type="submit"
                              className="rounded-xl border border-yellow-500/40 px-4 py-2 text-sm font-bold text-yellow-300 transition hover:bg-yellow-400 hover:text-white"
                            >
                              Rebaixar
                            </button>
                          </form>
                        )}

                        {!memberIsCurrentUser && !memberIsOwner && (
                          <form action={removeMember}>
                            <input
                              type="hidden"
                              name="userId"
                              value={member.userId}
                            />

                            <button
                              type="submit"
                              className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500 hover:text-white"
                            >
                              Remover
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8">
          <h2 className="text-2xl font-bold text-red-300">
            Sair da liga
          </h2>

          <p className="mt-2 text-red-100/80">
            Ao sair, seus palpites desta liga serão removidos e você não aparecerá mais no ranking.
          </p>

          {isOwner ? (
            <div className="mt-5 rounded-2xl bg-zinc-950 p-4 text-sm text-red-200">
              Você é o dono desta liga. Por enquanto, o dono não pode sair da própria liga.
            </div>
          ) : (
            <form action={leaveLeague} className="mt-5">
              <button
                type="submit"
                className="rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400"
              >
                Sair desta liga
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
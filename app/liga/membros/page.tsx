/* eslint-disable @next/next/no-img-element */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import logoImage from '@/app/img/logo.png';
import { ProtectedLink } from '@/app/protected-link';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/require-session';

async function removeMember(formData: FormData) {
  'use server';

  const session = await requireSession();

  if (session.membership.role !== 'ADMIN') {
    return;
  }

  const targetUserId = String(formData.get('userId'));
  const leagueId = session.league.id;

  if (!targetUserId || targetUserId === session.user.id) {
    return;
  }

  const league = await prisma.league.findUnique({
    where: {
      id: leagueId,
    },
  });

  if (!league || league.ownerId === targetUserId) {
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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12a2 2 0 0 0 2-2V8H4v10a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

export default async function LigaMembrosPage() {
  const session = await requireSession();

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

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-3 pb-12 pt-6 sm:max-w-lg sm:px-6">
        <div className="mb-6 flex justify-center">
          <img
            src={logoImage.src}
            alt="Logo Bolao Copa 2026"
            className="w-44 max-w-[72vw] sm:w-52"
          />
        </div>

        <div className="mx-auto w-full max-w-[15.8rem] rounded-[2rem] border border-[#12338d] bg-[#050812] px-5 py-4 text-center shadow-[0_12px_30px_rgba(0,0,0,0.32)]">
          <h1 className="text-[1.15rem] font-black uppercase tracking-[0.04em] text-white">
            Membros
          </h1>
          <div className="mt-3 text-left text-[11px] leading-relaxed text-white/70">
            1- Somente administradores podem retirar membros da Liga.
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 px-1">
          <ProtectedLink
            href="/inicio"
            className="flex h-11 min-w-[6.4rem] items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            Pagina inicial
          </ProtectedLink>

          <ProtectedLink
            href="/liga"
            className="flex h-11 min-w-[6.8rem] items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-center text-sm font-black leading-tight text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            Informacoes
            <br />
            da Liga
          </ProtectedLink>
        </div>

        <div className="mt-10 overflow-hidden rounded-[1.45rem] border border-white/70 bg-[#8d8d8d] shadow-[0_12px_26px_rgba(0,0,0,0.25)]">
          <div>
            {league.members.map((member, index) => {
              const canRemove =
                isLeagueAdmin &&
                member.userId !== session.user.id &&
                member.userId !== league.ownerId;

              const showDivider = index < league.members.length - 1;

              return (
                <div
                  key={member.id}
                  className={`grid ${isLeagueAdmin ? 'grid-cols-[1fr_96px]' : 'grid-cols-1'} ${showDivider ? 'border-b border-white/80' : ''}`}
                >
                  <div className="flex min-h-[3.3rem] items-center justify-center border-r border-white/80 px-3 text-center text-sm font-semibold text-white">
                    {member.user.name}
                  </div>
                  {isLeagueAdmin && (
                    <div className="flex min-h-[3.3rem] items-center justify-center px-2">
                      {canRemove ? (
                        <form action={removeMember}>
                          <input type="hidden" name="userId" value={member.userId} />
                          <button
                            type="submit"
                            className="flex h-8 w-8 items-center justify-center text-red-500"
                            aria-label={`Excluir ${member.user.name}`}
                            title={`Excluir ${member.user.name}`}
                          >
                            <TrashIcon />
                          </button>
                        </form>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import logoImage from '@/app/img/logo.png';
import { getCurrentUser, getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { InicioScreen } from './inicio-screen';

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

  redirect('/liga');
}

async function joinLeague(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const leagueId = String(formData.get('leagueId'));

  if (!leagueId) {
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

  await prisma.leagueMember.upsert({
    where: {
      leagueId_userId: {
        leagueId: league.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      leagueId: league.id,
      userId: user.id,
      role: 'MEMBER',
    },
  });

  const cookieStore = await cookies();

  cookieStore.set('bolao_league_id', league.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect('/liga');
}

export default async function InicioPage() {
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
      league: {
        include: {
          members: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const joinedLeagueIds = new Set(memberships.map((membership) => membership.leagueId));

  const leagues = await prisma.league.findMany({
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 24,
  });

  const membershipCards = memberships.map((membership) => ({
    id: membership.id,
    leagueId: membership.leagueId,
    leagueName: membership.league.name,
    membersCount: membership.league.members.length,
    isActive: membership.leagueId === session?.league.id,
  }));

  const discoverLeagues = leagues.map((league) => ({
    id: league.id,
    name: league.name,
    inviteCode: league.inviteCode,
    membersCount: league._count.members,
    joined: joinedLeagueIds.has(league.id),
  }));

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-6 sm:max-w-lg sm:px-6">
        <div className="mb-6 flex justify-center">
          <img
            src={logoImage.src}
            alt="Logo Bolao Copa 2026"
            className="w-44 max-w-[72vw] sm:w-52"
          />
        </div>

        <div className="mx-auto w-full max-w-[15.6rem] rounded-[2rem] border border-[#12338d] bg-[#050812] px-5 py-4 text-center shadow-[0_12px_30px_rgba(0,0,0,0.32)]">
          <h1 className="text-[1.1rem] font-black leading-tight text-white">
            Instrucoes:
          </h1>
          <div className="mt-3 space-y-1 text-left text-[11px] leading-relaxed text-white/70">
            <p>1- Entre numa liga ou crie a sua</p>
            <p>2- Faca seu palpite</p>
            <p>3- Se divirta!</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 px-1">
          <Link
            href="/ligas/criar"
            className="flex h-11 min-w-[7.2rem] items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            + Nova Liga
          </Link>

          <Link
            href="/minhas-ligas"
            className="flex h-11 min-w-[7.2rem] items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            Minhas Ligas
          </Link>
        </div>

        <InicioScreen
          memberships={membershipCards}
          discoverLeagues={discoverLeagues}
          openLeagueAction={selectLeague}
          joinLeagueAction={joinLeague}
        />
      </section>
    </main>
  );
}

import { cookies } from 'next/headers';
import { prisma } from './prisma';

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const userId = cookieStore.get('bolao_user_id')?.value;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  return user;
}

export async function getCurrentSession() {
  const cookieStore = await cookies();

  const userId = cookieStore.get('bolao_user_id')?.value;
  const leagueId = cookieStore.get('bolao_league_id')?.value;

  if (!userId || !leagueId) {
    return null;
  }

  const membership = await prisma.leagueMember.findUnique({
    where: {
      leagueId_userId: {
        leagueId,
        userId,
      },
    },
    include: {
      user: true,
      league: true,
    },
  });

  if (!membership) {
    return null;
  }

  return {
    user: membership.user,
    league: membership.league,
    membership,
  };
}
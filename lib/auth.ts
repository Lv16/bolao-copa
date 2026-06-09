import { cookies } from 'next/headers';

import { prisma } from './prisma';
import { resolveSessionMembership } from './session-selection';

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

  if (!userId) {
    return null;
  }

  const membership = await resolveSessionMembership({
    leagueId,
    userId,
    findMembership: (resolvedLeagueId, resolvedUserId) =>
      prisma.leagueMember.findUnique({
        where: {
          leagueId_userId: {
            leagueId: resolvedLeagueId,
            userId: resolvedUserId,
          },
        },
        include: {
          user: true,
          league: true,
        },
      }),
    findFallbackMembership: (resolvedUserId) =>
      prisma.leagueMember.findFirst({
        where: {
          userId: resolvedUserId,
        },
        include: {
          user: true,
          league: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
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

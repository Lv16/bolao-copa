import { cookies } from 'next/headers';

import { sessionCookieName } from './cookies';
import { prisma } from './prisma';
import { readSessionToken } from './session-token';

export async function getCurrentSessionPayload() {
  const cookieStore = await cookies();

  const token = cookieStore.get(sessionCookieName)?.value;

  return readSessionToken(token);
}

export async function getCurrentUser() {
  const payload = await getCurrentSessionPayload();

  if (!payload?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  return user;
}

export async function getCurrentSession() {
  const payload = await getCurrentSessionPayload();

  if (!payload?.userId) {
    return null;
  }

  if (payload.leagueId) {
    const membership = await prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId: payload.leagueId,
          userId: payload.userId,
        },
      },
      include: {
        user: true,
        league: true,
      },
    });

    if (membership) {
      return {
        user: membership.user,
        league: membership.league,
        membership,
      };
    }
  }

  const fallbackMembership = await prisma.leagueMember.findFirst({
    where: {
      userId: payload.userId,
    },
    include: {
      user: true,
      league: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (!fallbackMembership) {
    return null;
  }

  return {
    user: fallbackMembership.user,
    league: fallbackMembership.league,
    membership: fallbackMembership,
  };
}

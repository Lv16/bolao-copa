import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { authCookieOptions, sessionCookieName } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { createSessionToken } from '@/lib/session-token';

export const dynamic = 'force-dynamic';

function redirectRelative(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: path,
    },
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const email = String(formData.get('email')).toLowerCase().trim();
  const password = String(formData.get('password'));

  if (!email || !password) {
    return redirectRelative('/login?error=missing_fields');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          league: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!user) {
    return redirectRelative('/login?error=invalid_credentials');
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return redirectRelative('/login?error=invalid_credentials');
  }

  const membership = user.memberships[0];

  const token = createSessionToken({
    userId: user.id,
    leagueId: membership?.league.id ?? null,
  });

  const response = redirectRelative(membership ? '/liga' : '/inicio');

  response.cookies.set(sessionCookieName, token, authCookieOptions);

  return response;
}
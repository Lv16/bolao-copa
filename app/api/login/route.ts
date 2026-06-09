import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { getAppUrl } from '@/lib/app-url';
import { authCookieOptions, sessionCookieName } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { createSessionToken } from '@/lib/session-token';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const email = String(formData.get('email')).toLowerCase().trim();
  const password = String(formData.get('password'));

  if (!email || !password) {
    return NextResponse.redirect(new URL('/login?error=missing_fields', request.url), {
      status: 303,
    });
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
    return NextResponse.redirect(new URL('/login?error=invalid_credentials', request.url), {
      status: 303,
    });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return NextResponse.redirect(new URL('/login?error=invalid_credentials', request.url), {
      status: 303,
    });
  }

  const membership = user.memberships[0];
  const token = createSessionToken({
    userId: user.id,
    leagueId: membership?.league.id ?? null,
  });

  const appUrl = getAppUrl(request);

  const redirectUrl = membership
    ? new URL('/liga', appUrl)
    : new URL('/inicio', appUrl);

  const response = NextResponse.redirect(redirectUrl, {
    status: 303,
  });

  response.cookies.set(sessionCookieName, token, authCookieOptions);

  return response;
}

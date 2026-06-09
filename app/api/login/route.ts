import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { authCookieOptions } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

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

  const redirectUrl = membership
    ? new URL('/liga', request.url)
    : new URL('/minhas-ligas', request.url);

  const response = NextResponse.redirect(redirectUrl, {
    status: 303,
  });

  response.cookies.set('bolao_user_id', user.id, authCookieOptions);

  if (membership) {
    response.cookies.set('bolao_league_id', membership.league.id, authCookieOptions);
  }

  return response;
}

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getCurrentSession, getCurrentUser } from '@/lib/auth';
import { sessionCookieName } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  const user = await getCurrentUser();
  const session = await getCurrentSession();

  return NextResponse.json({
    hasToken: Boolean(token),
    user: user
      ? {
          id: user.id,
          email: user.email,
          isSystemAdmin: user.isSystemAdmin,
        }
      : null,
    session: session
      ? {
          leagueId: session.league.id,
          leagueName: session.league.name,
          role: session.membership.role,
        }
      : null,
  });
}

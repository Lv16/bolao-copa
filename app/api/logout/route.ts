import { NextResponse } from 'next/server';
import { sessionCookieName } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = new NextResponse(null, {
    status: 303,
    headers: {
      Location: '/login',
    },
  });

  response.cookies.set(sessionCookieName, '', {
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('bolao_user_id', '', {
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('bolao_league_id', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function GET() {
  return new NextResponse('Method Not Allowed', {
    status: 405,
  });
}

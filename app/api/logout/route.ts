import { NextResponse } from 'next/server';
import { sessionCookieName } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 303,
  });

  response.cookies.delete(sessionCookieName);

  return response;
}

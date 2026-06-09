import { NextResponse } from 'next/server';

import { getAppUrl } from '@/lib/app-url';
import { sessionCookieName } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const appUrl = getAppUrl(request);

  const response = NextResponse.redirect(new URL('/login', appUrl), {
    status: 303,
  });

  response.cookies.delete(sessionCookieName);

  return response;
}

import { NextResponse } from 'next/server';

import { sessionCookieName } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

export async function GET() {
  const response = new NextResponse(null, {
    status: 303,
    headers: {
      Location: '/login',
    },
  });

  response.cookies.delete(sessionCookieName);

  return response;
}
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { sessionCookieName } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  return NextResponse.json({
    hasSessionCookie: Boolean(token),
    tokenPreview: token ? `${token.slice(0, 20)}...` : null,
  });
}
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const response = new NextResponse(null, {
    status: 303,
    headers: {
      Location: '/api/check-cookie',
    },
  });

  response.cookies.set('bolao_session', 'teste123', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60,
  });

  return response;
}
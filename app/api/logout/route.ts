import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 303,
  });

  response.cookies.delete('bolao_user_id');
  response.cookies.delete('bolao_league_id');

  return response;
}

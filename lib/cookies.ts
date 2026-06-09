import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export const sessionCookieName = 'bolao_session';

export const authCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

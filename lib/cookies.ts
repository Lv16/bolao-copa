import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export const authCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

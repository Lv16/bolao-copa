import { NextRequest } from 'next/server';

export function getAppUrl(request?: NextRequest | Request) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }

  if (request) {
    const headers = request.headers;

    const forwardedHost = headers.get('x-forwarded-host');
    const forwardedProto = headers.get('x-forwarded-proto');
    const host = forwardedHost ?? headers.get('host');

    if (host) {
      const proto = forwardedProto ?? 'https';
      return `${proto}://${host}`;
    }
  }

  return 'http://localhost:3000';
}

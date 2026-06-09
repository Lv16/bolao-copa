import assert from 'node:assert/strict';
import test from 'node:test';

process.env.SESSION_SECRET = 'bolao-copa-2026-chave-super-secreta-983742983742';

test('session cookie config uses a single signed cookie name', async () => {
  const { authCookieOptions, sessionCookieName } = await import('../lib/cookies');

  assert.equal(sessionCookieName, 'bolao_session');
  assert.equal(authCookieOptions.httpOnly, true);
});

test('session token round-trips user and league ids', async () => {
  const { createSessionToken, readSessionToken } = await import('../lib/session-token');

  const token = createSessionToken({
    userId: 'user-1',
    leagueId: 'league-1',
  });

  assert.deepEqual(readSessionToken(token), {
    userId: 'user-1',
    leagueId: 'league-1',
  });
});

test('session token rejects tampered payloads', async () => {
  const { createSessionToken, readSessionToken } = await import('../lib/session-token');

  const token = createSessionToken({
    userId: 'user-1',
    leagueId: 'league-1',
  });

  const [payload, signature] = token.split('.');
  const tamperedToken = `${payload}x.${signature}`;

  assert.equal(readSessionToken(tamperedToken), null);
});

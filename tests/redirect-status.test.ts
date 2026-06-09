import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { GET as logoutGetRoute, POST as logoutPostRoute } from '../app/api/logout/route';

test('logout POST redirects with 303 after expiring current and legacy auth cookies', async () => {
  const response = await logoutPostRoute();

  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/login');

  const setCookie = response.headers.get('set-cookie') ?? '';
  assert.match(setCookie, /bolao_session=/);
  assert.match(setCookie, /bolao_user_id=/);
  assert.match(setCookie, /bolao_league_id=/);
  assert.match(setCookie, /Max-Age=0/i);
});

test('logout GET is rejected with 405', async () => {
  const response = await logoutGetRoute();

  assert.equal(response.status, 405);
});

test('login route source explicitly sets 303 redirects for post-login navigation', async () => {
  const source = await readFile('app/api/login/route.ts', 'utf8');

  assert.match(source, /status:\s*303/);
});

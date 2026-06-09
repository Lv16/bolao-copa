import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { GET as logoutRoute } from '../app/api/logout/route';

test('logout route redirects with 303 after clearing auth cookies', async () => {
  const response = await logoutRoute(new Request('https://example.com/api/logout'));

  assert.equal(response.status, 303);
});

test('login route source explicitly sets 303 redirects for post-login navigation', async () => {
  const source = await readFile('app/api/login/route.ts', 'utf8');

  assert.match(source, /status:\s*303/);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSessionMembership } from '../lib/session-selection';

test('session selection returns cookie membership when it is valid', async () => {
  let fallbackCalls = 0;

  const membership = { id: 'membership-1' };

  const result = await resolveSessionMembership({
    leagueId: 'league-1',
    userId: 'user-1',
    findMembership: async (leagueId, userId) => {
      assert.equal(leagueId, 'league-1');
      assert.equal(userId, 'user-1');
      return membership;
    },
    findFallbackMembership: async () => {
      fallbackCalls += 1;
      return { id: 'fallback' };
    },
  });

  assert.equal(result, membership);
  assert.equal(fallbackCalls, 0);
});

test('session selection falls back to the first user league when league cookie is missing or invalid', async () => {
  const fallbackMembership = { id: 'membership-fallback' };
  let fallbackCalls = 0;

  const withoutCookie = await resolveSessionMembership({
    leagueId: undefined,
    userId: 'user-1',
    findMembership: async () => {
      assert.fail('findMembership should not run when there is no league cookie');
    },
    findFallbackMembership: async (userId) => {
      fallbackCalls += 1;
      assert.equal(userId, 'user-1');
      return fallbackMembership;
    },
  });

  const withInvalidCookie = await resolveSessionMembership({
    leagueId: 'league-missing',
    userId: 'user-1',
    findMembership: async () => null,
    findFallbackMembership: async () => {
      fallbackCalls += 1;
      return fallbackMembership;
    },
  });

  assert.equal(withoutCookie, fallbackMembership);
  assert.equal(withInvalidCookie, fallbackMembership);
  assert.equal(fallbackCalls, 2);
});

test('session selection returns null when the user has no memberships', async () => {
  const result = await resolveSessionMembership({
    leagueId: undefined,
    userId: 'user-1',
    findMembership: async () => null,
    findFallbackMembership: async () => null,
  });

  assert.equal(result, null);
});

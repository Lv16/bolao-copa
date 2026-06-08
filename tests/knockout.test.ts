import assert from 'node:assert/strict';
import test from 'node:test';

import { getWinnerAndLoser } from '../lib/knockout';

test('knockout winner/loser uses explicit winnerTeamId on tie', () => {
  assert.deepEqual(
    getWinnerAndLoser({
      homeTeamId: 'home',
      awayTeamId: 'away',
      homeScore: 1,
      awayScore: 1,
      winnerTeamId: 'away',
    }),
    {
      winnerTeamId: 'away',
      loserTeamId: 'home',
    }
  );
});

test('knockout winner/loser infers winner from normal scoreline', () => {
  assert.deepEqual(
    getWinnerAndLoser({
      homeTeamId: 'home',
      awayTeamId: 'away',
      homeScore: 2,
      awayScore: 0,
      winnerTeamId: null,
    }),
    {
      winnerTeamId: 'home',
      loserTeamId: 'away',
    }
  );
});

test('knockout winner/loser returns null for unresolved ties or incomplete matches', () => {
  assert.equal(
    getWinnerAndLoser({
      homeTeamId: 'home',
      awayTeamId: 'away',
      homeScore: 1,
      awayScore: 1,
      winnerTeamId: null,
    }),
    null
  );

  assert.equal(
    getWinnerAndLoser({
      homeTeamId: 'home',
      awayTeamId: 'away',
      homeScore: null,
      awayScore: 1,
      winnerTeamId: null,
    }),
    null
  );
});

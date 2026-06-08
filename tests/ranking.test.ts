import assert from 'node:assert/strict';
import test from 'node:test';

import { sortRanking } from '../lib/ranking';

test('ranking is sorted by total points, then exact scores, then name', () => {
  const sorted = sortRanking([
    {
      userId: '3',
      name: 'Carlos',
      role: 'MEMBER',
      totalPoints: 5,
      predictionsCount: 3,
      exactScores: 1,
      correctResults: 1,
    },
    {
      userId: '2',
      name: 'Bruno',
      role: 'MEMBER',
      totalPoints: 8,
      predictionsCount: 4,
      exactScores: 1,
      correctResults: 2,
    },
    {
      userId: '1',
      name: 'Ana',
      role: 'MEMBER',
      totalPoints: 8,
      predictionsCount: 4,
      exactScores: 2,
      correctResults: 1,
    },
    {
      userId: '4',
      name: 'Bia',
      role: 'MEMBER',
      totalPoints: 8,
      predictionsCount: 4,
      exactScores: 2,
      correctResults: 0,
    },
  ]);

  assert.deepEqual(
    sorted.map((entry) => entry.name),
    ['Ana', 'Bia', 'Bruno', 'Carlos']
  );
});

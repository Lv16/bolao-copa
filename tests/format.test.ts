import assert from 'node:assert/strict';
import test from 'node:test';

import { isMatchPredictionLocked } from '../lib/format';

test('prediction is locked when global lock is enabled', () => {
  assert.equal(
    isMatchPredictionLocked({
      startsAt: null,
      status: 'SCHEDULED',
      globalLocked: true,
    }),
    true
  );
});

test('prediction is locked when match is finished', () => {
  assert.equal(
    isMatchPredictionLocked({
      startsAt: null,
      status: 'FINISHED',
      globalLocked: false,
    }),
    true
  );
});

test('prediction is locked from two hours before kickoff', () => {
  const startsAt = new Date(Date.now() + 60 * 60 * 1000);

  assert.equal(
    isMatchPredictionLocked({
      startsAt,
      status: 'SCHEDULED',
      globalLocked: false,
    }),
    true
  );
});

test('prediction stays open before lock window and when match is not finished', () => {
  const startsAt = new Date(Date.now() + 5 * 60 * 60 * 1000);

  assert.equal(
    isMatchPredictionLocked({
      startsAt,
      status: 'SCHEDULED',
      globalLocked: false,
    }),
    false
  );
});

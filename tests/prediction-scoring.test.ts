import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateGroupPredictionPoints,
  calculateKnockoutPredictionPoints,
  getMatchResult,
} from '../lib/prediction-scoring';

test('getMatchResult identifies home win, away win and draw', () => {
  assert.equal(getMatchResult(2, 1), 'HOME');
  assert.equal(getMatchResult(1, 2), 'AWAY');
  assert.equal(getMatchResult(1, 1), 'DRAW');
});

test('group stage awards 3 points for exact score', () => {
  assert.equal(
    calculateGroupPredictionPoints({
      realHomeScore: 2,
      realAwayScore: 1,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    }),
    3
  );
});

test('group stage awards 2 points for correct result only', () => {
  assert.equal(
    calculateGroupPredictionPoints({
      realHomeScore: 3,
      realAwayScore: 1,
      predictedHomeScore: 1,
      predictedAwayScore: 0,
    }),
    2
  );
});

test('group stage awards 0 points for wrong result', () => {
  assert.equal(
    calculateGroupPredictionPoints({
      realHomeScore: 1,
      realAwayScore: 1,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    }),
    0
  );
});

test('knockout awards 3 points for exact score plus qualified team', () => {
  assert.equal(
    calculateKnockoutPredictionPoints({
      realHomeScore: 1,
      realAwayScore: 1,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      realWinnerTeamId: 'team-a',
      predictedWinnerTeamId: 'team-a',
    }),
    3
  );
});

test('knockout awards 2 points for qualified team only', () => {
  assert.equal(
    calculateKnockoutPredictionPoints({
      realHomeScore: 1,
      realAwayScore: 1,
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      realWinnerTeamId: 'team-b',
      predictedWinnerTeamId: 'team-b',
    }),
    2
  );
});

test('knockout awards 0 points when qualified team is wrong or missing', () => {
  assert.equal(
    calculateKnockoutPredictionPoints({
      realHomeScore: 1,
      realAwayScore: 1,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      realWinnerTeamId: 'team-a',
      predictedWinnerTeamId: 'team-b',
    }),
    0
  );

  assert.equal(
    calculateKnockoutPredictionPoints({
      realHomeScore: 1,
      realAwayScore: 1,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      realWinnerTeamId: 'team-a',
      predictedWinnerTeamId: null,
    }),
    0
  );
});

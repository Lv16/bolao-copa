import assert from 'node:assert/strict';
import test from 'node:test';

import type { StandingRow } from '../lib/standings';
import {
  getSuggestedThirdPlaceGroupNames,
  getThirdPlaceRows,
  validateConfirmedThirdPlaceGroups,
} from '../lib/third-places';

function row(groupName: string, teamName: string, points: number, goalDifference: number, goalsFor: number): StandingRow {
  return {
    teamId: `${groupName}-${teamName}`,
    teamName,
    groupName,
    played: 3,
    wins: 1,
    draws: points === 4 ? 1 : 0,
    losses: 2,
    goalsFor,
    goalsAgainst: goalsFor - goalDifference,
    goalDifference,
    points,
  };
}

const standingsByGroup: Record<string, StandingRow[]> = {
  A: [row('A', 'A1', 7, 3, 5), row('A', 'A2', 6, 2, 4), row('A', 'A3', 4, 1, 3), row('A', 'A4', 0, -6, 1)],
  B: [row('B', 'B1', 7, 4, 6), row('B', 'B2', 5, 1, 3), row('B', 'B3', 4, 0, 2), row('B', 'B4', 0, -5, 0)],
  C: [row('C', 'C1', 6, 4, 5), row('C', 'C2', 6, 2, 4), row('C', 'C3', 4, 0, 4), row('C', 'C4', 1, -6, 1)],
  D: [row('D', 'D1', 9, 6, 8), row('D', 'D2', 4, 0, 3), row('D', 'D3', 3, 1, 3), row('D', 'D4', 1, -7, 0)],
  E: [row('E', 'E1', 7, 3, 4), row('E', 'E2', 5, 2, 3), row('E', 'E3', 3, 0, 5), row('E', 'E4', 1, -5, 1)],
  F: [row('F', 'F1', 7, 5, 7), row('F', 'F2', 4, 1, 3), row('F', 'F3', 3, 0, 4), row('F', 'F4', 1, -6, 0)],
  G: [row('G', 'G1', 7, 2, 3), row('G', 'G2', 5, 1, 4), row('G', 'G3', 3, -1, 3), row('G', 'G4', 1, -2, 2)],
  H: [row('H', 'H1', 9, 5, 7), row('H', 'H2', 4, 0, 3), row('H', 'H3', 2, -1, 2), row('H', 'H4', 1, -4, 1)],
  I: [row('I', 'I1', 6, 3, 4), row('I', 'I2', 4, 1, 3), row('I', 'I3', 2, -2, 1), row('I', 'I4', 1, -2, 2)],
  J: [row('J', 'J1', 7, 2, 5), row('J', 'J2', 4, 0, 2), row('J', 'J3', 1, -2, 1), row('J', 'J4', 1, 0, 2)],
  K: [row('K', 'K1', 7, 2, 4), row('K', 'K2', 4, 0, 3), row('K', 'K3', 1, -1, 2), row('K', 'K4', 1, -1, 1)],
  L: [row('L', 'L1', 7, 4, 6), row('L', 'L2', 5, 2, 4), row('L', 'L3', 0, -4, 1), row('L', 'L4', 0, -2, 0)],
};

test('third-place rows build a consolidated ranking across the 12 groups', () => {
  const thirdRows = getThirdPlaceRows(standingsByGroup);

  assert.equal(thirdRows.length, 12);
  assert.deepEqual(
    thirdRows.slice(0, 5).map((entry) => entry.groupName),
    ['A', 'C', 'B', 'D', 'E']
  );
  assert.deepEqual(
    thirdRows.slice(-3).map((entry) => entry.groupName),
    ['K', 'J', 'L']
  );
});

test('automatic suggestion returns exactly the top 8 third-place groups', () => {
  const suggested = getSuggestedThirdPlaceGroupNames(getThirdPlaceRows(standingsByGroup));

  assert.deepEqual(suggested, ['A', 'C', 'B', 'D', 'E', 'F', 'G', 'H']);
});

test('confirmed third-place groups must be exactly eight valid third-place groups', () => {
  const validation = validateConfirmedThirdPlaceGroups(getThirdPlaceRows(standingsByGroup), [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
  ]);

  assert.equal(validation.isValid, false);
  assert.equal(validation.confirmedRows.length, 7);
  assert.match(validation.errors[0] ?? '', /exatamente 8/i);
});

test('confirmed third-place validation rejects groups outside the current third-place ranking', () => {
  const validation = validateConfirmedThirdPlaceGroups(getThirdPlaceRows(standingsByGroup), [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'Z',
  ]);

  assert.equal(validation.isValid, false);
  assert.match(validation.errors.join(' '), /Z/);
});

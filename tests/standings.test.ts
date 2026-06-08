import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateGroupStandings, getQualifiedSlots } from '../lib/standings';

test('group standings are ordered by points, goal difference and goals for', () => {
  const standings = calculateGroupStandings([
    {
      id: 'm1',
      number: 1,
      phase: 'GROUP',
      groupName: 'A',
      homeTeamId: 't1',
      awayTeamId: 't2',
      homeSlot: 'A1',
      awaySlot: 'A2',
      startsAt: null,
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 0,
      nextMatchId: null,
      nextMatchNumber: null,
      nextSlot: null,
      loserNextMatchNumber: null,
      loserNextSlot: null,
      winnerTeamId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      homeTeam: { id: 't1', name: 'Brasil', groupName: 'A', slotCode: 'A1' },
      awayTeam: { id: 't2', name: 'Mexico', groupName: 'A', slotCode: 'A2' },
    },
    {
      id: 'm2',
      number: 2,
      phase: 'GROUP',
      groupName: 'A',
      homeTeamId: 't3',
      awayTeamId: 't4',
      homeSlot: 'A3',
      awaySlot: 'A4',
      startsAt: null,
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 1,
      nextMatchId: null,
      nextMatchNumber: null,
      nextSlot: null,
      loserNextMatchNumber: null,
      loserNextSlot: null,
      winnerTeamId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      homeTeam: { id: 't3', name: 'Canada', groupName: 'A', slotCode: 'A3' },
      awayTeam: { id: 't4', name: 'Dinamarca', groupName: 'A', slotCode: 'A4' },
    },
  ]);

  assert.deepEqual(
    standings.A.map((row) => row.teamName),
    ['Brasil', 'Canada', 'Dinamarca', 'Mexico']
  );
});

test('qualified slots expose first, second and third place per group', () => {
  const slots = getQualifiedSlots({
    A: [
      {
        teamId: 't1',
        teamName: 'Brasil',
        groupName: 'A',
        played: 3,
        wins: 2,
        draws: 1,
        losses: 0,
        goalsFor: 6,
        goalsAgainst: 2,
        goalDifference: 4,
        points: 7,
      },
      {
        teamId: 't2',
        teamName: 'Mexico',
        groupName: 'A',
        played: 3,
        wins: 2,
        draws: 0,
        losses: 1,
        goalsFor: 5,
        goalsAgainst: 3,
        goalDifference: 2,
        points: 6,
      },
      {
        teamId: 't3',
        teamName: 'Canada',
        groupName: 'A',
        played: 3,
        wins: 1,
        draws: 0,
        losses: 2,
        goalsFor: 2,
        goalsAgainst: 4,
        goalDifference: -2,
        points: 3,
      },
    ],
  });

  assert.equal(slots['1A']?.teamName, 'Brasil');
  assert.equal(slots['2A']?.teamName, 'Mexico');
  assert.equal(slots['3A']?.teamName, 'Canada');
});

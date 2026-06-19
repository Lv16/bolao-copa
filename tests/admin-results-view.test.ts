import assert from 'node:assert/strict';
import test from 'node:test';

import { getMatchTone, getVisibleGroups, type MatchTone } from '../lib/admin-results-view';

const groupPhaseSections = [
  {
    phase: 'GROUP',
    label: 'Fase de Grupos',
    groups: [
      {
        key: 'A',
        label: 'Grupo A',
        matches: [{ id: '1' }, { id: '2' }],
      },
      {
        key: 'B',
        label: 'Grupo B',
        matches: [{ id: '3' }],
      },
    ],
  },
  {
    phase: 'ROUND_OF_32',
    label: '16 avos',
    groups: [
      {
        key: 'FASE',
        label: '16 avos',
        matches: [{ id: '4' }],
      },
    ],
  },
] as const;

test('getVisibleGroups returns all groups for group stage when ALL is selected', () => {
  const visibleGroups = getVisibleGroups(groupPhaseSections, 'GROUP', 'ALL');

  assert.equal(visibleGroups.length, 2);
  assert.deepEqual(
    visibleGroups.map((group) => group.key),
    ['A', 'B']
  );
});

test('getVisibleGroups filters by selected group only in group stage', () => {
  const visibleGroups = getVisibleGroups(groupPhaseSections, 'GROUP', 'B');

  assert.equal(visibleGroups.length, 1);
  assert.equal(visibleGroups[0]?.key, 'B');
});

test('getVisibleGroups ignores selectedGroup for knockout phases', () => {
  const visibleGroups = getVisibleGroups(groupPhaseSections, 'ROUND_OF_32', 'B');

  assert.equal(visibleGroups.length, 1);
  assert.equal(visibleGroups[0]?.key, 'FASE');
});

test('getMatchTone prioritizes explicit feedback messages', () => {
  const tone = getMatchTone({
    isFinished: false,
    draft: {
      homeScore: '',
      awayScore: '',
    },
    messageTone: 'error',
  });

  assert.equal(tone, 'error');
});

test('getMatchTone returns success for finished matches', () => {
  const tone = getMatchTone({
    isFinished: true,
    draft: {
      homeScore: '',
      awayScore: '',
    },
    messageTone: null,
  });

  assert.equal(tone, 'success');
});

test('getMatchTone distinguishes complete, partial and empty drafts', () => {
  const cases: Array<{
    input: Parameters<typeof getMatchTone>[0];
    expected: MatchTone;
  }> = [
    {
      input: {
        isFinished: false,
        draft: {
          homeScore: '2',
          awayScore: '1',
        },
        messageTone: null,
      },
      expected: 'warning',
    },
    {
      input: {
        isFinished: false,
        draft: {
          homeScore: '2',
          awayScore: '',
        },
        messageTone: null,
      },
      expected: 'partial',
    },
    {
      input: {
        isFinished: false,
        draft: {
          homeScore: '',
          awayScore: '',
        },
        messageTone: null,
      },
      expected: 'idle',
    },
  ];

  for (const item of cases) {
    assert.equal(getMatchTone(item.input), item.expected);
  }
});

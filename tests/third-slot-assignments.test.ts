import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSuggestedThirdSlotAssignments,
  parseThirdSlotGroups,
  validateThirdSlotAssignments,
  type ThirdSlotDefinition,
} from '../lib/third-slot-assignments';

const slots: ThirdSlotDefinition[] = [
  { key: '74:AWAY', matchId: '74', matchNumber: 74, side: 'AWAY', slotLabel: '3A/B/C/D/F', allowedGroupNames: ['A', 'B', 'C', 'D', 'F'] },
  { key: '77:AWAY', matchId: '77', matchNumber: 77, side: 'AWAY', slotLabel: '3C/D/F/G/H', allowedGroupNames: ['C', 'D', 'F', 'G', 'H'] },
  { key: '79:AWAY', matchId: '79', matchNumber: 79, side: 'AWAY', slotLabel: '3C/E/F/H/I', allowedGroupNames: ['C', 'E', 'F', 'H', 'I'] },
  { key: '80:AWAY', matchId: '80', matchNumber: 80, side: 'AWAY', slotLabel: '3E/H/I/J/K', allowedGroupNames: ['E', 'H', 'I', 'J', 'K'] },
  { key: '81:AWAY', matchId: '81', matchNumber: 81, side: 'AWAY', slotLabel: '3B/E/F/I/J', allowedGroupNames: ['B', 'E', 'F', 'I', 'J'] },
  { key: '82:AWAY', matchId: '82', matchNumber: 82, side: 'AWAY', slotLabel: '3A/E/H/I/J', allowedGroupNames: ['A', 'E', 'H', 'I', 'J'] },
  { key: '85:AWAY', matchId: '85', matchNumber: 85, side: 'AWAY', slotLabel: '3E/F/G/I/J', allowedGroupNames: ['E', 'F', 'G', 'I', 'J'] },
  { key: '87:AWAY', matchId: '87', matchNumber: 87, side: 'AWAY', slotLabel: '3D/E/I/J/L', allowedGroupNames: ['D', 'E', 'I', 'J', 'L'] },
];

test('third-slot parser extracts allowed group names from a complex slot', () => {
  assert.deepEqual(parseThirdSlotGroups('3A/B/C/D/F'), ['A', 'B', 'C', 'D', 'F']);
  assert.deepEqual(parseThirdSlotGroups('1A'), []);
  assert.deepEqual(parseThirdSlotGroups(null), []);
});

test('automatic third-slot suggestion uses only confirmed groups and avoids duplicates', () => {
  const suggested = buildSuggestedThirdSlotAssignments(slots, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);

  assert.equal(suggested.size, 8);

  const usedGroups = Array.from(suggested.values());
  assert.equal(new Set(usedGroups).size, 8);

  for (const slot of slots) {
    const selectedGroup = suggested.get(slot.key);
    assert.ok(selectedGroup);
    assert.equal(slot.allowedGroupNames.includes(selectedGroup!), true);
  }
});

test('third-slot validation rejects unconfirmed, duplicated and out-of-slot assignments', () => {
  const validation = validateThirdSlotAssignments({
    slots,
    confirmedGroupNames: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    assignments: {
      '74:AWAY': 'A',
      '77:AWAY': 'A',
      '79:AWAY': 'I',
    },
  });

  assert.equal(validation.isValid, false);
  assert.match(validation.errors.join(' '), /repetido/i);
  assert.match(validation.errors.join(' '), /nao confirmado/i);
  assert.match(validation.errors.join(' '), /slot/i);
});

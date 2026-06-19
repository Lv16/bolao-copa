import { Match, Team } from '@prisma/client';

import { prisma } from './prisma';
import { calculateGroupStandings, getQualifiedSlots, type StandingRow } from './standings';
import {
  buildSuggestedThirdSlotAssignments,
  type KnockoutSlotSide,
  parseThirdSlotGroups,
  validateThirdSlotAssignments,
  type ThirdSlotDefinition,
} from './third-slot-assignments';
import {
  getSuggestedThirdPlaceGroupNames,
  getThirdPlaceRows,
  validateConfirmedThirdPlaceGroups,
} from './third-places';

type MatchWithTeams = Match & {
  homeTeam: Team | null;
  awayTeam: Team | null;
};

const db = prisma as typeof prisma & {
  confirmedThirdPlace: any;
  knockoutThirdSlotAssignment: any;
};

export function buildThirdSlotAssignmentKey(matchId: string, side: KnockoutSlotSide) {
  return `${matchId}:${side}`;
}

export function isComplexThirdSlot(slot: string | null) {
  return parseThirdSlotGroups(slot).length > 0;
}

export function getComplexThirdSlotDefinitions(
  matches: Array<Pick<Match, 'id' | 'number' | 'homeSlot' | 'awaySlot'>>
) {
  const definitions: ThirdSlotDefinition[] = [];

  for (const match of matches) {
    const homeGroups = parseThirdSlotGroups(match.homeSlot);
    if (homeGroups.length > 0) {
      definitions.push({
        key: buildThirdSlotAssignmentKey(match.id, 'HOME'),
        matchId: match.id,
        matchNumber: match.number,
        side: 'HOME',
        slotLabel: match.homeSlot!,
        allowedGroupNames: homeGroups,
      });
    }

    const awayGroups = parseThirdSlotGroups(match.awaySlot);
    if (awayGroups.length > 0) {
      definitions.push({
        key: buildThirdSlotAssignmentKey(match.id, 'AWAY'),
        matchId: match.id,
        matchNumber: match.number,
        side: 'AWAY',
        slotLabel: match.awaySlot!,
        allowedGroupNames: awayGroups,
      });
    }
  }

  return definitions.sort((a, b) => a.matchNumber - b.matchNumber);
}

export async function getConfirmedThirdPlaceGroupNames() {
  const rows = await db.confirmedThirdPlace.findMany({
    orderBy: {
      groupName: 'asc',
    },
  });

  return rows.map((row: { groupName: string }) => row.groupName.toUpperCase());
}

export async function replaceConfirmedThirdPlaceGroupNames(groupNames: string[]) {
  const normalized = Array.from(
    new Set(groupNames.map((groupName) => groupName.trim().toUpperCase()).filter(Boolean))
  );

  await prisma.$transaction([
    db.confirmedThirdPlace.deleteMany(),
    ...(normalized.length > 0
      ? [
          db.confirmedThirdPlace.createMany({
            data: normalized.map((groupName) => ({
              groupName,
            })),
          }),
        ]
      : []),
  ]);
}

export async function getKnockoutThirdSlotAssignmentsMap() {
  const rows = await db.knockoutThirdSlotAssignment.findMany();

  return Object.fromEntries(
    rows.map((row: { matchId: string; side: KnockoutSlotSide; selectedGroupName: string }) => [
      buildThirdSlotAssignmentKey(row.matchId, row.side),
      row.selectedGroupName.toUpperCase(),
    ])
  ) as Record<string, string>;
}

export async function saveKnockoutThirdSlotAssignment(input: {
  matchId: string;
  side: KnockoutSlotSide;
  selectedGroupName: string;
}) {
  await db.knockoutThirdSlotAssignment.upsert({
    where: {
      matchId_side: {
        matchId: input.matchId,
        side: input.side,
      },
    },
    update: {
      selectedGroupName: input.selectedGroupName.trim().toUpperCase(),
    },
    create: {
      matchId: input.matchId,
      side: input.side,
      selectedGroupName: input.selectedGroupName.trim().toUpperCase(),
    },
  });
}

export async function replaceKnockoutThirdSlotAssignments(assignments: Array<{
  matchId: string;
  side: KnockoutSlotSide;
  selectedGroupName: string;
}>) {
  await prisma.$transaction([
    db.knockoutThirdSlotAssignment.deleteMany(),
    ...(assignments.length > 0
      ? [
          db.knockoutThirdSlotAssignment.createMany({
            data: assignments.map((assignment) => ({
              matchId: assignment.matchId,
              side: assignment.side,
              selectedGroupName: assignment.selectedGroupName.trim().toUpperCase(),
            })),
          }),
        ]
      : []),
  ]);
}

export async function deleteKnockoutThirdSlotAssignment(matchId: string, side: KnockoutSlotSide) {
  await db.knockoutThirdSlotAssignment.deleteMany({
    where: {
      matchId,
      side,
    },
  });
}

export async function getGroupStageSnapshot() {
  const groupMatches = await prisma.match.findMany({
    where: {
      phase: 'GROUP',
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: [
      {
        groupName: 'asc',
      },
      {
        number: 'asc',
      },
    ],
  });

  const standingsByGroup = calculateGroupStandings(groupMatches);
  const qualifiedSlots = getQualifiedSlots(standingsByGroup);
  const thirdRows = getThirdPlaceRows(standingsByGroup);
  const suggestedGroupNames = getSuggestedThirdPlaceGroupNames(thirdRows);
  const confirmedGroupNames = await getConfirmedThirdPlaceGroupNames();
  const confirmedValidation = validateConfirmedThirdPlaceGroups(thirdRows, confirmedGroupNames);

  return {
    groupMatches,
    standingsByGroup,
    qualifiedSlots,
    thirdRows,
    suggestedGroupNames,
    confirmedGroupNames,
    confirmedValidation,
  };
}

function buildThirdRowsByGroup(rows: StandingRow[]) {
  return new Map(rows.map((row) => [row.groupName.toUpperCase(), row] as const));
}

export async function getRoundOf32ThirdSlotsState() {
  const groupStage = await getGroupStageSnapshot();
  const roundOf32Matches = await prisma.match.findMany({
    where: {
      phase: 'ROUND_OF_32',
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      number: 'asc',
    },
  });

  const definitions = getComplexThirdSlotDefinitions(roundOf32Matches);
  const assignments = await getKnockoutThirdSlotAssignmentsMap();
  const suggestedAssignments = buildSuggestedThirdSlotAssignments(
    definitions,
    groupStage.confirmedValidation.confirmedGroupNames
  );
  const assignmentValidation = validateThirdSlotAssignments({
    slots: definitions,
    confirmedGroupNames: groupStage.confirmedValidation.confirmedGroupNames,
    assignments,
  });
  const thirdRowsByGroup = buildThirdRowsByGroup(groupStage.thirdRows);

  return {
    ...groupStage,
    roundOf32Matches,
    definitions,
    assignments,
    suggestedAssignments,
    assignmentValidation,
    slots: definitions.map((definition) => {
      const currentGroupName = assignments[definition.key] ?? null;
      const suggestedGroupName = suggestedAssignments.get(definition.key) ?? null;
      const selectedRow = currentGroupName ? thirdRowsByGroup.get(currentGroupName) ?? null : null;
      const suggestedRow = suggestedGroupName ? thirdRowsByGroup.get(suggestedGroupName) ?? null : null;

      return {
        ...definition,
        currentGroupName,
        suggestedGroupName,
        selectedRow,
        suggestedRow,
        isResolved: Boolean(selectedRow),
      };
    }),
  };
}

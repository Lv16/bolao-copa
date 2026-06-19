import { prisma } from '@/lib/prisma';
import { calculateGroupStandings, getQualifiedSlots } from '@/lib/standings';
import {
  getComplexThirdSlotDefinitions,
  getConfirmedThirdPlaceGroupNames,
  getKnockoutThirdSlotAssignmentsMap,
} from '@/lib/third-place-admin';
import { getThirdPlaceRows, validateConfirmedThirdPlaceGroups } from '@/lib/third-places';
import { validateThirdSlotAssignments } from '@/lib/third-slot-assignments';

function isSimpleQualifiedSlot(slot: string | null): slot is string {
  if (!slot) return false;

  return /^[123][A-L]$/.test(slot);
}

export async function resolveSimpleKnockoutSlots() {
  const groupMatches = await prisma.match.findMany({
    where: {
      phase: 'GROUP',
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  const standingsByGroup = calculateGroupStandings(groupMatches);
  const qualifiedSlots = getQualifiedSlots(standingsByGroup);
  const thirdRows = getThirdPlaceRows(standingsByGroup);
  const thirdRowsByGroup = new Map(
    thirdRows.map((row) => [row.groupName.toUpperCase(), row] as const)
  );
  const confirmedGroupNames = await getConfirmedThirdPlaceGroupNames();

  const knockoutMatches = await prisma.match.findMany({
    where: {
      phase: {
        not: 'GROUP',
      },
    },
    orderBy: {
      number: 'asc',
    },
  });

  const complexSlotDefinitions = getComplexThirdSlotDefinitions(
    knockoutMatches.filter((match) => match.phase === 'ROUND_OF_32')
  );
  const complexAssignments = await getKnockoutThirdSlotAssignmentsMap();
  const confirmedValidation = validateConfirmedThirdPlaceGroups(thirdRows, confirmedGroupNames);
  const assignmentValidation = validateThirdSlotAssignments({
    slots: complexSlotDefinitions,
    confirmedGroupNames: confirmedValidation.confirmedGroupNames,
    assignments: complexAssignments,
  });

  for (const match of knockoutMatches) {
    const data: {
      homeTeamId?: string | null;
      awayTeamId?: string | null;
    } = {};

    const homeSlot = match.homeSlot;
    if (isSimpleQualifiedSlot(homeSlot)) {
      const slot = qualifiedSlots[homeSlot];

      if (slot) {
        data.homeTeamId = slot.teamId;
      }
    }

    const awaySlot = match.awaySlot;
    if (isSimpleQualifiedSlot(awaySlot)) {
      const slot = qualifiedSlots[awaySlot];

      if (slot) {
        data.awayTeamId = slot.teamId;
      } else {
        data.awayTeamId = null;
      }
    }

    if (match.phase === 'ROUND_OF_32') {
      const homeKey = `${match.id}:HOME`;
      const awayKey = `${match.id}:AWAY`;

      const selectedHomeGroup =
        assignmentValidation.isValid ? complexAssignments[homeKey]?.toUpperCase() : null;
      const selectedAwayGroup =
        assignmentValidation.isValid ? complexAssignments[awayKey]?.toUpperCase() : null;

      if (homeKey in complexAssignments || match.homeSlot?.includes('/')) {
        data.homeTeamId = selectedHomeGroup
          ? thirdRowsByGroup.get(selectedHomeGroup)?.teamId ?? null
          : null;
      }

      if (awayKey in complexAssignments || match.awaySlot?.includes('/')) {
        data.awayTeamId = selectedAwayGroup
          ? thirdRowsByGroup.get(selectedAwayGroup)?.teamId ?? null
          : null;
      }
    }

    if ('homeTeamId' in data || 'awayTeamId' in data) {
      await prisma.match.update({
        where: {
          id: match.id,
        },
        data,
      });
    }
  }
}

export function getWinnerAndLoser(match: {
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
}) {
  if (
    !match.homeTeamId ||
    !match.awayTeamId ||
    match.homeScore === null ||
    match.awayScore === null
  ) {
    return null;
  }

  if (match.winnerTeamId) {
    const loserTeamId =
      match.winnerTeamId === match.homeTeamId
        ? match.awayTeamId
        : match.homeTeamId;

    return {
      winnerTeamId: match.winnerTeamId,
      loserTeamId,
    };
  }

  if (match.homeScore > match.awayScore) {
    return {
      winnerTeamId: match.homeTeamId,
      loserTeamId: match.awayTeamId,
    };
  }

  if (match.awayScore > match.homeScore) {
    return {
      winnerTeamId: match.awayTeamId,
      loserTeamId: match.homeTeamId,
    };
  }

  return null;
}

async function sendTeamToMatch(params: {
  matchNumber: number | null;
  slot: string | null;
  teamId: string;
}) {
  if (!params.matchNumber || !params.slot) {
    return;
  }

  const data =
    params.slot === 'HOME'
      ? {
          homeTeamId: params.teamId,
        }
      : {
          awayTeamId: params.teamId,
        };

  await prisma.match.update({
    where: {
      number: params.matchNumber,
    },
    data,
  });
}

export async function advanceKnockoutWinner(matchId: string) {
  const match = await prisma.match.findUnique({
    where: {
      id: matchId,
    },
  });

  if (!match || match.phase === 'GROUP') {
    return;
  }

  const result = getWinnerAndLoser(match);

  if (!result) {
    return;
  }

  await sendTeamToMatch({
    matchNumber: match.nextMatchNumber,
    slot: match.nextSlot,
    teamId: result.winnerTeamId,
  });

  await sendTeamToMatch({
    matchNumber: match.loserNextMatchNumber,
    slot: match.loserNextSlot,
    teamId: result.loserTeamId,
  });
}

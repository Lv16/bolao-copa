import { prisma } from '@/lib/prisma';
import { calculateGroupStandings, getQualifiedSlots } from '@/lib/standings';

function isSimpleQualifiedSlot(slot: string | null) {
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

  for (const match of knockoutMatches) {
    const data: {
      homeTeamId?: string | null;
      awayTeamId?: string | null;
    } = {};

    if (isSimpleQualifiedSlot(match.homeSlot)) {
      const slot = qualifiedSlots[match.homeSlot];

      if (slot) {
        data.homeTeamId = slot.teamId;
      }
    }

    if (isSimpleQualifiedSlot(match.awaySlot)) {
      const slot = qualifiedSlots[match.awaySlot];

      if (slot) {
        data.awayTeamId = slot.teamId;
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
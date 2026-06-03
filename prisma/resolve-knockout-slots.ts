import { PrismaClient } from '@prisma/client';
import { calculateGroupStandings, getQualifiedSlots } from '../lib/standings';

const prisma = new PrismaClient();

function isSimpleQualifiedSlot(slot: string | null) {
  if (!slot) return false;

  return /^[123][A-L]$/.test(slot);
}

async function main() {
  console.log('Resolvendo slots automáticos do mata-mata...');

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

  let updated = 0;

  for (const match of knockoutMatches) {
    const data: {
      homeTeamId?: string | null;
      awayTeamId?: string | null;
    } = {};

    if (isSimpleQualifiedSlot(match.homeSlot)) {
      const slot = qualifiedSlots[match.homeSlot!];

      if (slot) {
        data.homeTeamId = slot.teamId;
      }
    }

    if (isSimpleQualifiedSlot(match.awaySlot)) {
      const slot = qualifiedSlots[match.awaySlot!];

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

      updated++;
      console.log(`Jogo ${match.number} atualizado.`);
    }
  }

  console.log(`${updated} jogo(s) atualizados.`);
  console.log('Slots automáticos resolvidos!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
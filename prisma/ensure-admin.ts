import 'dotenv/config';
import bcrypt from 'bcryptjs';

import { prisma } from '../lib/prisma';

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@bolao.com',
    },
    update: {
      isSystemAdmin: true,
    },
    create: {
      name: 'Admin',
      email: 'admin@bolao.com',
      password: hashedPassword,
      isSystemAdmin: true,
    },
  });

  const league = await prisma.league.upsert({
    where: {
      inviteCode: 'COPA26',
    },
    update: {
      name: 'COPA26',
      ownerId: admin.id,
    },
    create: {
      name: 'COPA26',
      inviteCode: 'COPA26',
      ownerId: admin.id,
    },
  });

  await prisma.leagueMember.upsert({
    where: {
      leagueId_userId: {
        leagueId: league.id,
        userId: admin.id,
      },
    },
    update: {
      role: 'ADMIN',
    },
    create: {
      leagueId: league.id,
      userId: admin.id,
      role: 'ADMIN',
    },
  });

  console.log(`Admin garantido: ${admin.email}`);
  console.log(`Liga garantida: ${league.name} (${league.inviteCode})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

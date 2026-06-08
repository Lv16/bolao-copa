import { MatchPhase } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

import { prisma } from '../lib/prisma';

type MatchCsvRow = {
  number: string;
  phase: string;
  groupName: string;
  homeSlot: string;
  awaySlot: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
};

function normalizeText(value: string | undefined) {
  return value?.trim() || null;
}

function parseDate(value: string | undefined) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

async function createOrFindTeam(params: {
  name: string;
  groupName: string | null;
  slotCode: string | null;
}) {
  const existingBySlot = params.slotCode
    ? await prisma.team.findUnique({
        where: {
          slotCode: params.slotCode,
        },
      })
    : null;

  if (existingBySlot) {
    return existingBySlot;
  }

  return prisma.team.create({
    data: {
      name: params.name,
      groupName: params.groupName,
      slotCode: params.slotCode,
    },
  });
}

async function main() {
  console.log('Limpando banco...');

  await prisma.prediction.deleteMany();
  await prisma.leagueMember.deleteMany();
  await prisma.league.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.user.deleteMany();

  console.log('Criando admin do sistema...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@bolao.com',
      password: hashedPassword,
      isSystemAdmin: true,
    },
  });

  await prisma.appSetting.createMany({
    data: [
      {
        key: 'predictions_locked',
        value: 'false',
      },
      {
        key: 'world_cup_started',
        value: 'false',
      },
    ],
  });

  console.log('Lendo CSV de jogos...');

  const csvPath = path.join(process.cwd(), 'data', 'worldcup-2026-matches.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as MatchCsvRow[];

  console.log(`Encontrados ${rows.length} jogos no CSV.`);

  for (const row of rows) {
    const number = Number(row.number);

    if (Number.isNaN(number)) {
      console.warn(`Jogo ignorado por number invalido: ${row.number}`);
      continue;
    }

    const phase = row.phase as MatchPhase;
    const groupName = normalizeText(row.groupName);
    const homeSlot = normalizeText(row.homeSlot);
    const awaySlot = normalizeText(row.awaySlot);
    const homeTeamName = normalizeText(row.homeTeam);
    const awayTeamName = normalizeText(row.awayTeam);

    if (!homeTeamName || !awayTeamName) {
      console.warn(`Jogo ${number} ignorado por time vazio.`);
      continue;
    }

    const homeTeam = await createOrFindTeam({
      name: homeTeamName,
      groupName,
      slotCode: homeSlot,
    });

    const awayTeam = await createOrFindTeam({
      name: awayTeamName,
      groupName,
      slotCode: awaySlot,
    });

    await prisma.match.create({
      data: {
        number,
        phase,
        groupName,
        homeSlot,
        awaySlot,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        startsAt: parseDate(row.startsAt),
      },
    });
  }

  console.log('Seed finalizado!');
  console.log('Login admin: admin@bolao.com');
  console.log('Senha admin: admin123');
  console.log('Nenhuma liga inicial foi criada.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

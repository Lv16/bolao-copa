import { MatchPhase } from '@prisma/client';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';


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

async function upsertTeam(params: {
  name: string;
  groupName: string | null;
  slotCode: string | null;
}) {
  if (params.slotCode) {
    return prisma.team.upsert({
      where: {
        slotCode: params.slotCode,
      },
      update: {
        name: params.name,
        groupName: params.groupName,
      },
      create: {
        name: params.name,
        groupName: params.groupName,
        slotCode: params.slotCode,
      },
    });
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
  console.log('Atualizando jogos pelo CSV...');

  const csvPath = path.join(
    process.cwd(),
    'data',
    'worldcup-2026-matches.csv'
  );

  if (!fs.existsSync(csvPath)) {
    throw new Error(`Arquivo CSV não encontrado em: ${csvPath}`);
  }

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
      console.warn(`Jogo ignorado por number inválido: ${row.number}`);
      continue;
    }

    const phase = row.phase as MatchPhase;
    const groupName = normalizeText(row.groupName);
    const homeSlot = normalizeText(row.homeSlot);
    const awaySlot = normalizeText(row.awaySlot);
    const homeTeamName = normalizeText(row.homeTeam);
    const awayTeamName = normalizeText(row.awayTeam);
    const startsAt = parseDate(row.startsAt);

    if (!homeTeamName || !awayTeamName) {
      console.warn(`Jogo ${number} ignorado por time vazio.`);
      continue;
    }

    const homeTeam = await upsertTeam({
      name: homeTeamName,
      groupName,
      slotCode: homeSlot,
    });

    const awayTeam = await upsertTeam({
      name: awayTeamName,
      groupName,
      slotCode: awaySlot,
    });

    await prisma.match.upsert({
      where: {
        number,
      },
      update: {
        phase,
        groupName,
        homeSlot,
        awaySlot,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        startsAt,
      },
      create: {
        number,
        phase,
        groupName,
        homeSlot,
        awaySlot,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        startsAt,
      },
    });

    console.log(`Jogo ${number} atualizado.`);
  }

  console.log('Atualização de jogos finalizada!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
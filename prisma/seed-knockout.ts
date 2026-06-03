import { MatchPhase } from "@prisma/client";
import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

type KnockoutCsvRow = {
  number: string;
  phase: string;
  homeSlot: string;
  awaySlot: string;
  startsAt: string;
  nextMatchNumber: string;
  nextSlot: string;
  loserNextMatchNumber: string;
  loserNextSlot: string;
};

function normalizeText(value: string | undefined) {
  return value?.trim() || null;
}

function parseNumber(value: string | undefined) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const number = Number(normalized);

  return Number.isNaN(number) ? null : number;
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

async function main() {
  console.log("Importando estrutura do mata-mata...");

  const csvPath = path.join(
    process.cwd(),
    "data",
    "worldcup-2026-knockout.csv",
  );

  if (!fs.existsSync(csvPath)) {
    throw new Error(`Arquivo não encontrado: ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");

  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    // Permitir linhas com menos campos que o header (colunas faltantes)
    relax_column_count: true,
  }) as KnockoutCsvRow[];

  console.log(`Encontrados ${rows.length} jogos de mata-mata no CSV.`);

  for (const row of rows) {
    const number = Number(row.number);

    if (Number.isNaN(number)) {
      console.warn(`Jogo ignorado por número inválido: ${row.number}`);
      continue;
    }

    const phase = row.phase as MatchPhase;

    await prisma.match.upsert({
      where: {
        number,
      },
      update: {
        phase,
        groupName: null,
        homeSlot: normalizeText(row.homeSlot),
        awaySlot: normalizeText(row.awaySlot),
        homeTeamId: null,
        awayTeamId: null,
        startsAt: parseDate(row.startsAt),
        nextMatchNumber: parseNumber(row.nextMatchNumber),
        nextSlot: normalizeText(row.nextSlot),
        loserNextMatchNumber: parseNumber(row.loserNextMatchNumber),
        loserNextSlot: normalizeText(row.loserNextSlot),
      },
      create: {
        number,
        phase,
        groupName: null,
        homeSlot: normalizeText(row.homeSlot),
        awaySlot: normalizeText(row.awaySlot),
        startsAt: parseDate(row.startsAt),
        nextMatchNumber: parseNumber(row.nextMatchNumber),
        nextSlot: normalizeText(row.nextSlot),
        loserNextMatchNumber: parseNumber(row.loserNextMatchNumber),
        loserNextSlot: normalizeText(row.loserNextSlot),
      },
    });

    console.log(`Jogo ${number} importado/atualizado.`);
  }

  console.log("Estrutura do mata-mata importada com sucesso!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

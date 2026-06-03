import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

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

const csvPath = path.join(
  process.cwd(),
  'data',
  'worldcup-2026-knockout.csv'
);

const csvContent = fs.readFileSync(csvPath, 'utf-8');

const rows = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
}) as KnockoutCsvRow[];

const numbers = rows
  .map((row) => Number(row.number))
  .filter((number) => !Number.isNaN(number));

const expectedNumbers = Array.from({ length: 32 }, (_, index) => index + 73);

const missing = expectedNumbers.filter((number) => !numbers.includes(number));
const duplicated = numbers.filter(
  (number, index) => numbers.indexOf(number) !== index
);

console.log('Total de jogos encontrados:', numbers.length);

if (missing.length > 0) {
  console.log('Jogos faltando:', missing.join(', '));
} else {
  console.log('Nenhum jogo faltando.');
}

if (duplicated.length > 0) {
  console.log('Jogos duplicados:', [...new Set(duplicated)].join(', '));
} else {
  console.log('Nenhum jogo duplicado.');
}

if (missing.length === 0 && duplicated.length === 0 && numbers.length === 32) {
  console.log('CSV do mata-mata está completo.');
} else {
  console.log('CSV do mata-mata ainda precisa de ajuste.');
}
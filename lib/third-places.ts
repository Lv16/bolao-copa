import type { StandingRow } from './standings';

export type ThirdPlaceRow = StandingRow & {
  rank: number;
};

function compareRows(a: StandingRow, b: StandingRow) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

  return a.teamName.localeCompare(b.teamName);
}

export function getThirdPlaceRows(standingsByGroup: Record<string, StandingRow[]>) {
  return Object.values(standingsByGroup)
    .map((rows) => rows[2])
    .filter((row): row is StandingRow => Boolean(row))
    .sort(compareRows)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

export function getSuggestedThirdPlaceGroupNames(thirdRows: ThirdPlaceRow[], limit = 8) {
  return thirdRows.slice(0, limit).map((row) => row.groupName);
}

export function validateConfirmedThirdPlaceGroups(
  thirdRows: ThirdPlaceRow[],
  confirmedGroupNames: string[]
) {
  const normalizedGroupNames = Array.from(
    new Set(
      confirmedGroupNames
        .map((groupName) => groupName.trim().toUpperCase())
        .filter(Boolean)
    )
  );

  const thirdRowsByGroup = new Map(
    thirdRows.map((row) => [row.groupName.toUpperCase(), row] as const)
  );

  const confirmedRows = normalizedGroupNames
    .map((groupName) => thirdRowsByGroup.get(groupName))
    .filter((row): row is ThirdPlaceRow => Boolean(row));

  const invalidGroups = normalizedGroupNames.filter((groupName) => !thirdRowsByGroup.has(groupName));
  const errors: string[] = [];

  if (normalizedGroupNames.length !== 8) {
    errors.push('A lista oficial precisa ter exatamente 8 terceiros confirmados.');
  }

  if (invalidGroups.length > 0) {
    errors.push(`Grupo(s) invalido(s) na confirmacao: ${invalidGroups.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    confirmedGroupNames: normalizedGroupNames,
    confirmedRows,
  };
}

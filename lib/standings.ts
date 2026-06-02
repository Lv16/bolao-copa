import { Match, Team } from '@prisma/client';

type MatchWithTeams = Match & {
  homeTeam: Team | null;
  awayTeam: Team | null;
};

export type StandingRow = {
  teamId: string;
  teamName: string;
  groupName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

function createRow(team: Team): StandingRow {
  return {
    teamId: team.id,
    teamName: team.name,
    groupName: team.groupName ?? '',
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

export function calculateGroupStandings(matches: MatchWithTeams[]) {
  const standingsByGroup: Record<string, Record<string, StandingRow>> = {};

  for (const match of matches) {
    if (
      match.phase !== 'GROUP' ||
      match.status !== 'FINISHED' ||
      match.homeScore === null ||
      match.awayScore === null ||
      !match.homeTeam ||
      !match.awayTeam ||
      !match.groupName
    ) {
      continue;
    }

    const groupName = match.groupName;

    if (!standingsByGroup[groupName]) {
      standingsByGroup[groupName] = {};
    }

    if (!standingsByGroup[groupName][match.homeTeam.id]) {
      standingsByGroup[groupName][match.homeTeam.id] = createRow(match.homeTeam);
    }

    if (!standingsByGroup[groupName][match.awayTeam.id]) {
      standingsByGroup[groupName][match.awayTeam.id] = createRow(match.awayTeam);
    }

    const home = standingsByGroup[groupName][match.homeTeam.id];
    const away = standingsByGroup[groupName][match.awayTeam.id];

    home.played += 1;
    away.played += 1;

    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;

    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (match.homeScore > match.awayScore) {
      home.wins += 1;
      home.points += 3;

      away.losses += 1;
    } else if (match.homeScore < match.awayScore) {
      away.wins += 1;
      away.points += 3;

      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;

      home.points += 1;
      away.points += 1;
    }
  }

  const result: Record<string, StandingRow[]> = {};

  for (const [groupName, rows] of Object.entries(standingsByGroup)) {
    result[groupName] = Object.values(rows).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

      return a.teamName.localeCompare(b.teamName);
    });
  }

  return result;
}

export function getQualifiedSlots(standingsByGroup: Record<string, StandingRow[]>) {
  const slots: Record<string, StandingRow> = {};

  for (const [groupName, rows] of Object.entries(standingsByGroup)) {
    const first = rows[0];
    const second = rows[1];
    const third = rows[2];

    if (first) slots[`1${groupName}`] = first;
    if (second) slots[`2${groupName}`] = second;
    if (third) slots[`3${groupName}`] = third;
  }

  return slots;
}
import type { MatchPhase } from '@prisma/client';

import type { KnockoutSlotSide } from '@/lib/third-slot-assignments';

export type MatchView = {
  id: string;
  number: number;
  phase: MatchPhase;
  phaseLabel: string;
  groupName: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeSlot: string | null;
  awaySlot: string | null;
  startsAtLabel: string;
  status: string;
  statusLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
  isFinished: boolean;
};

export type PhaseSection = {
  phase: MatchPhase;
  label: string;
  groups: Array<{
    key: string;
    label: string;
    matches: MatchView[];
  }>;
};

export type StandingsGroup = {
  groupName: string;
  rows: Array<{
    position: number;
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
  }>;
};

export type ThirdRankingRow = {
  rank: number;
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
  isSuggested: boolean;
  isConfirmed: boolean;
};

export type ComplexSlotView = {
  key: string;
  matchId: string;
  matchNumber: number;
  side: KnockoutSlotSide;
  slotLabel: string;
  allowedGroupNames: string[];
  currentGroupName: string | null;
  suggestedGroupName: string | null;
  selectedTeamName: string | null;
  suggestedTeamName: string | null;
  opponentTeamName: string;
};

export type Props = {
  phaseSections: PhaseSection[];
  standingsGroups: StandingsGroup[];
  thirdRanking: ThirdRankingRow[];
  confirmedGroupNames: string[];
  suggestedGroupNames: string[];
  confirmedValidationErrors: string[];
  complexSlots: ComplexSlotView[];
  slotAssignmentErrors: string[];
};

export type Draft = {
  homeScore: string;
  awayScore: string;
  winnerTeamId: string;
};

export type FeedbackTone = 'success' | 'error';

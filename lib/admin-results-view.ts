import type { MatchPhase } from '@prisma/client';

type PhaseSectionLike<TGroup> = {
  phase: MatchPhase;
  groups: TGroup[];
};

export type MatchTone = 'success' | 'warning' | 'partial' | 'error' | 'idle';

export function getVisibleGroups<TGroup extends { key: string }>(
  phaseSections: readonly PhaseSectionLike<TGroup>[],
  selectedPhase: MatchPhase,
  selectedGroup: string
) {
  const currentPhase = phaseSections.find((section) => section.phase === selectedPhase);

  if (!currentPhase) {
    return [] as TGroup[];
  }

  return currentPhase.groups.filter(
    (group) => selectedPhase !== 'GROUP' || selectedGroup === 'ALL' || group.key === selectedGroup
  );
}

export function getMatchTone(input: {
  isFinished: boolean;
  draft: {
    homeScore: string;
    awayScore: string;
  };
  messageTone: 'success' | 'error' | null;
}): MatchTone {
  const hasOneScore = input.draft.homeScore !== '' || input.draft.awayScore !== '';
  const hasBothScores = input.draft.homeScore !== '' && input.draft.awayScore !== '';

  if (input.messageTone) {
    return input.messageTone;
  }

  if (input.isFinished) {
    return 'success';
  }

  if (hasBothScores) {
    return 'warning';
  }

  if (hasOneScore) {
    return 'partial';
  }

  return 'idle';
}

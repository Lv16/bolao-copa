type ResultSide = 'HOME' | 'AWAY' | 'DRAW';

type GroupScoreParams = {
  realHomeScore: number;
  realAwayScore: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
};

type KnockoutScoreParams = {
  realHomeScore: number;
  realAwayScore: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  realWinnerTeamId: string | null;
  predictedWinnerTeamId: string | null;
};

export function getMatchResult(homeScore: number, awayScore: number): ResultSide {
  if (homeScore > awayScore) {
    return 'HOME';
  }

  if (homeScore < awayScore) {
    return 'AWAY';
  }

  return 'DRAW';
}

export function calculateGroupPredictionPoints({
  realHomeScore,
  realAwayScore,
  predictedHomeScore,
  predictedAwayScore,
}: GroupScoreParams) {
  const exactScore =
    predictedHomeScore === realHomeScore && predictedAwayScore === realAwayScore;

  if (exactScore) {
    return 3;
  }

  const realResult = getMatchResult(realHomeScore, realAwayScore);
  const predictedResult = getMatchResult(predictedHomeScore, predictedAwayScore);

  return realResult === predictedResult ? 2 : 0;
}

export function calculateKnockoutPredictionPoints({
  realHomeScore,
  realAwayScore,
  predictedHomeScore,
  predictedAwayScore,
  realWinnerTeamId,
  predictedWinnerTeamId,
}: KnockoutScoreParams) {
  const exactScore =
    predictedHomeScore === realHomeScore && predictedAwayScore === realAwayScore;

  const predictedWinnerCorrect =
    !!predictedWinnerTeamId &&
    !!realWinnerTeamId &&
    predictedWinnerTeamId === realWinnerTeamId;

  if (exactScore && predictedWinnerCorrect) {
    return 3;
  }

  if (predictedWinnerCorrect) {
    return 2;
  }

  return 0;
}

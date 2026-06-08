export type RankingEntry = {
  userId: string;
  name: string;
  role: string;
  totalPoints: number;
  predictionsCount: number;
  exactScores: number;
  correctResults: number;
};

export function sortRanking(entries: RankingEntry[]) {
  return [...entries].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    if (b.exactScores !== a.exactScores) {
      return b.exactScores - a.exactScores;
    }

    return a.name.localeCompare(b.name);
  });
}

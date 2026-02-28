import { getPredictionPoints, getMatchOutcome, POINTS_EXACT_SCORE, POINTS_RESULT } from "@/lib/points";

export type RankingEntry = {
  playerId: string;
  name: string;
  imageUrl?: string | null;
  points: number;
  exactHits: number;
  resultHits: number;
};

export type RankingInput = {
  playerId: string;
  name: string;
  imageUrl?: string | null;
  predictions: {
    homeScore: number;
    awayScore: number;
    game: {
      finalHomeScore: number | null;
      finalAwayScore: number | null;
      isFinalized: boolean;
    };
  }[];
};

export const buildRanking = (players: RankingInput[]) => {
  const entries: RankingEntry[] = players.map((player) => {
    let points = 0;
    let exactHits = 0;
    let resultHits = 0;

    player.predictions.forEach((prediction) => {
      const finalScore =
        prediction.game.isFinalized &&
        prediction.game.finalHomeScore !== null &&
        prediction.game.finalAwayScore !== null
          ? {
              home: prediction.game.finalHomeScore,
              away: prediction.game.finalAwayScore,
            }
          : null;

      const earned = getPredictionPoints(
        { home: prediction.homeScore, away: prediction.awayScore },
        finalScore
      );

      if (earned === POINTS_EXACT_SCORE) {
        exactHits += 1;
      }

      if (
        earned === POINTS_RESULT &&
        finalScore &&
        getMatchOutcome({
          home: prediction.homeScore,
          away: prediction.awayScore,
        }) === getMatchOutcome(finalScore)
      ) {
        resultHits += 1;
      }

      points += earned;
    });

    return {
      playerId: player.playerId,
      name: player.name,
      imageUrl: player.imageUrl ?? null,
      points,
      exactHits,
      resultHits,
    };
  });

  return entries.sort((a, b) => b.points - a.points);
};

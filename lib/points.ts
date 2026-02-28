export const POINTS_EXACT_SCORE = 3;
export const POINTS_RESULT = 1;

export type ScorePair = {
  home: number;
  away: number;
};

export const getMatchOutcome = ({ home, away }: ScorePair) => {
  if (home === away) return "draw";
  return home > away ? "home" : "away";
};

export const getPredictionPoints = (
  prediction: ScorePair,
  finalScore: ScorePair | null
) => {
  if (!finalScore) return 0;
  if (
    prediction.home === finalScore.home &&
    prediction.away === finalScore.away
  ) {
    return POINTS_EXACT_SCORE;
  }
  return getMatchOutcome(prediction) === getMatchOutcome(finalScore)
    ? POINTS_RESULT
    : 0;
};

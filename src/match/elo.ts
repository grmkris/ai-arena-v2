/** Expected score for player A against player B */
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/** Calculate new Elo rating after a match */
function updateElo(
  oldRating: number,
  expected: number,
  actual: number,
): number {
  const K = 32;
  return Math.round((oldRating + K * (actual - expected)) * 10) / 10;
}

/** Compute new Elo ratings for both agents after a match */
export function computeEloChanges(
  eloA: number,
  eloB: number,
  winner: 0 | 1 | null,
): { newEloA: number; newEloB: number } {
  const expA = expectedScore(eloA, eloB);
  const expB = expectedScore(eloB, eloA);

  let actualA: number;
  let actualB: number;
  if (winner === 0) {
    actualA = 1;
    actualB = 0;
  } else if (winner === 1) {
    actualA = 0;
    actualB = 1;
  } else {
    actualA = 0.5;
    actualB = 0.5;
  }

  return {
    newEloA: updateElo(eloA, expA, actualA),
    newEloB: updateElo(eloB, expB, actualB),
  };
}

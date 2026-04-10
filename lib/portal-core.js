import { matches } from "./portal-data";

export function enrichMatches(rawMatches = []) {
  return rawMatches
    .map((match) => ({
      ...match,
      modelBias: match.modelBias ?? 1,
      odds: normalizeOdds(match)
    }))
    .filter((match) => match.odds.length > 0);
}

export function getAllPicks(matches = []) {
  const normalized = matches.some((match) => match.odds?.some((odd) => odd.adjustedProbability))
    ? matches
    : enrichMatches(matches);

  return normalized.flatMap((match) => match.odds);
}

export function calculateCombo(picks, stake) {
  if (!picks.length) {
    return { combinedOdds: 0, combinedProbability: 0, potentialReturn: 0, netProfit: 0 };
  }

  const combinedOdds = picks.reduce((acc, pick) => acc * pick.price, 1);
  const combinedProbability = picks.reduce((acc, pick) => acc * pick.adjustedProbability, 1);
  const potentialReturn = combinedOdds * stake;

  return {
    combinedOdds,
    combinedProbability,
    potentialReturn,
    netProfit: potentialReturn - stake
  };
}

export function getHistoryStats(bets) {
  const settled = bets.filter((bet) => bet.status !== "pending");
  const won = bets.filter((bet) => bet.status === "won");
  const lost = bets.filter((bet) => bet.status === "lost");
  const totalStaked = settled.reduce((acc, bet) => acc + bet.stake, 0);
  const totalReturned = settled.reduce((acc, bet) => acc + (bet.status === "won" ? bet.potentialReturn : 0), 0);

  return {
    total: bets.length,
    pending: bets.filter((bet) => bet.status === "pending").length,
    won: won.length,
    lost: lost.length,
    hitRate: settled.length ? won.length / settled.length : 0,
    roi: totalStaked ? (totalReturned - totalStaked) / totalStaked : 0
  };
}

function normalizeOdds(match) {
  return (match.odds ?? []).map((odd) => enrichPick(match, odd)).filter(Boolean);
}

function enrichPick(match, odd) {
  const impliedProbability = 1 / odd.price;
  const baselineProbability = clamp(
    odd.modelProbability ?? odd.consensusProbability ?? impliedProbability,
    0.02,
    0.92
  );
  const adjustedProbability = clamp(baselineProbability * (match.modelBias ?? 1), 0.02, 0.92);
  const edge = adjustedProbability - impliedProbability;
  const expectedValue = adjustedProbability * odd.price - 1;

  return {
    id: odd.id ?? `${match.id}-${odd.market}`,
    ...odd,
    competition: match.competition,
    sport: match.sport,
    status: match.status,
    kickoff: match.kickoff,
    score: match.score,
    home: match.home,
    away: match.away,
    venue: match.venue,
    impliedProbability,
    adjustedProbability,
    edge,
    expectedValue
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

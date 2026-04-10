import { matches } from "./portal-data";

export function getMatches() {
  return matches.map((match) => ({
    ...match,
    odds: match.odds.map((odd) => enrichPick(match, odd))
  }));
}

export function getAllPicks() {
  return getMatches().flatMap((match) => match.odds);
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

function enrichPick(match, odd) {
  const impliedProbability = 1 / odd.price;
  const adjustedProbability = Math.min(0.92, odd.modelProbability * match.modelBias);
  const edge = adjustedProbability - impliedProbability;
  const expectedValue = adjustedProbability * odd.price - 1;

  return {
    id: `${match.id}-${odd.market}`,
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

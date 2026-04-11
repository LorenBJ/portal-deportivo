export function filterBetsForReport(bets = [], filters = {}) {
  const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
  const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : null;
  const competition = filters.competition && filters.competition !== "all" ? filters.competition : null;
  const status = filters.status && filters.status !== "all" ? filters.status : null;

  return bets.filter((bet) => {
    const createdAt = new Date(bet.createdAt || Date.now());
    if (start && createdAt < start) return false;
    if (end && createdAt > end) return false;
    if (status && bet.status !== status) return false;
    if (!competition) return true;
    return (bet.picks ?? []).some((pick) => (pick.competition || "Sin liga") === competition);
  });
}

export function getReportSummary(bets = []) {
  const settled = bets.filter((bet) => bet.status === "won" || bet.status === "lost");
  const won = settled.filter((bet) => bet.status === "won");
  const lost = settled.filter((bet) => bet.status === "lost");
  const totalStake = settled.reduce((sum, bet) => sum + Number(bet.stake || 0), 0);
  const totalReturn = settled.reduce((sum, bet) => sum + (bet.status === "won" ? Number(bet.potentialReturn || 0) : 0), 0);
  return {
    total: bets.length,
    settled: settled.length,
    pending: bets.filter((bet) => bet.status === "pending").length,
    won: won.length,
    lost: lost.length,
    totalStake,
    totalReturn,
    profit: totalReturn - totalStake,
    hitRate: settled.length ? won.length / settled.length : 0,
    roi: totalStake ? (totalReturn - totalStake) / totalStake : 0
  };
}

export function getCompetitionOptions(bets = []) {
  const values = new Set();
  for (const bet of bets) {
    for (const pick of bet.picks ?? []) values.add(pick.competition || "Sin liga");
  }
  return ["all", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
}

export function formatBetMatch(bet) {
  return (bet.picks ?? []).map((pick) => `${pick.home} vs ${pick.away}`).join(" + ") || "Sin partido";
}

export function formatBetCompetition(bet) {
  const competitions = [...new Set((bet.picks ?? []).map((pick) => pick.competition || "Sin liga"))];
  return competitions.join(" / ") || "Sin liga";
}

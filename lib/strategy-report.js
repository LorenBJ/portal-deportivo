export function buildStrategyReport({ bets = [], matches = [], filters = {} }) {
  const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
  const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : null;
  const competition = filters.competition && filters.competition !== "all" ? filters.competition : null;

  const filteredBets = bets.filter((bet) => {
    const createdAt = new Date(bet.createdAt || Date.now());
    if (start && createdAt < start) return false;
    if (end && createdAt > end) return false;
    if (!competition) return true;
    return (bet.picks ?? []).some((pick) => pick.competition === competition);
  });

  const settled = filteredBets.filter((bet) => bet.status === "won" || bet.status === "lost");
  const won = settled.filter((bet) => bet.status === "won");
  const lost = settled.filter((bet) => bet.status === "lost");
  const totalStake = settled.reduce((sum, bet) => sum + Number(bet.stake || 0), 0);
  const totalReturn = settled.reduce((sum, bet) => sum + (bet.status === "won" ? Number(bet.potentialReturn || 0) : 0), 0);
  const profit = totalReturn - totalStake;
  const roi = totalStake ? profit / totalStake : 0;
  const hitRate = settled.length ? won.length / settled.length : 0;

  const leagueRows = aggregateByLeague(settled);
  const marketRows = aggregateByMarket(settled);
  const oddsBandRows = aggregateByOddsBand(settled);
  const liveSummary = summarizeLiveFeed(matches, competition);

  return {
    filters: {
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
      competition: competition || "all"
    },
    overview: {
      totalBets: filteredBets.length,
      settled: settled.length,
      pending: filteredBets.filter((bet) => bet.status === "pending").length,
      won: won.length,
      lost: lost.length,
      totalStake,
      totalReturn,
      profit,
      roi,
      hitRate,
      avgOdds: settled.length ? settled.reduce((sum, bet) => sum + Number(bet.odds || 0), 0) / settled.length : 0,
      avgStake: settled.length ? totalStake / settled.length : 0
    },
    leagues: leagueRows.slice(0, 6),
    markets: marketRows.slice(0, 6),
    oddsBands: oddsBandRows,
    liveSummary
  };
}

export function buildStrategyPromptContext(report) {
  return {
    overview: compactOverview(report.overview),
    leagues: report.leagues.map(compactRow),
    markets: report.markets.map(compactRow),
    oddsBands: report.oddsBands.map(compactRow),
    live: {
      matches: report.liveSummary.activeMatches,
      competitions: report.liveSummary.competitions,
      topOpportunities: report.liveSummary.topOpportunities
    }
  };
}

function aggregateByLeague(settled) {
  const map = new Map();
  for (const bet of settled) {
    const profit = bet.status === "won" ? Number(bet.potentialReturn || 0) - Number(bet.stake || 0) : -Number(bet.stake || 0);
    const leagues = [...new Set((bet.picks ?? []).map((pick) => pick.competition || "Sin liga"))];
    for (const league of leagues) {
      const entry = map.get(league) ?? createRow(league);
      applyBet(entry, bet, profit);
      map.set(league, entry);
    }
  }
  return finalizeRows(map);
}

function aggregateByMarket(settled) {
  const map = new Map();
  for (const bet of settled) {
    const profit = bet.status === "won" ? Number(bet.potentialReturn || 0) - Number(bet.stake || 0) : -Number(bet.stake || 0);
    const markets = [...new Set((bet.picks ?? []).map((pick) => normalizeMarketBucket(pick.market)))];
    for (const market of markets) {
      const entry = map.get(market) ?? createRow(market);
      applyBet(entry, bet, profit);
      map.set(market, entry);
    }
  }
  return finalizeRows(map);
}

function aggregateByOddsBand(settled) {
  const bands = new Map([
    ["1.10-1.39", createRow("1.10-1.39")],
    ["1.40-1.69", createRow("1.40-1.69")],
    ["1.70-1.99", createRow("1.70-1.99")],
    ["2.00+", createRow("2.00+")]
  ]);
  for (const bet of settled) {
    const profit = bet.status === "won" ? Number(bet.potentialReturn || 0) - Number(bet.stake || 0) : -Number(bet.stake || 0);
    const odds = Number(bet.odds || 0);
    const bucket = odds < 1.4 ? "1.10-1.39" : odds < 1.7 ? "1.40-1.69" : odds < 2 ? "1.70-1.99" : "2.00+";
    applyBet(bands.get(bucket), bet, profit);
  }
  return finalizeRows(bands);
}

function summarizeLiveFeed(matches, competition) {
  const filteredMatches = competition ? matches.filter((match) => match.competition === competition) : matches;
  const competitionCounts = new Map();
  for (const match of filteredMatches) {
    competitionCounts.set(match.competition, (competitionCounts.get(match.competition) || 0) + 1);
  }

  const topOpportunities = filteredMatches
    .flatMap((match) => (match.odds ?? []).filter((pick) => pick.recommended).map((pick) => ({
      match: `${match.home} vs ${match.away}`,
      competition: match.competition,
      market: pick.market,
      edge: pick.edge,
      confidence: pick.confidence,
      price: pick.price
    })))
    .sort((a, b) => (b.edge * b.confidence) - (a.edge * a.confidence))
    .slice(0, 5);

  return {
    activeMatches: filteredMatches.length,
    competitions: Array.from(competitionCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, count]) => ({ label, count })),
    topOpportunities
  };
}

function createRow(label) {
  return { label, settled: 0, won: 0, lost: 0, stake: 0, profit: 0, roi: 0, hitRate: 0 };
}

function applyBet(entry, bet, profit) {
  entry.settled += 1;
  entry.stake += Number(bet.stake || 0);
  entry.profit += profit;
  if (bet.status === "won") entry.won += 1;
  if (bet.status === "lost") entry.lost += 1;
}

function finalizeRows(map) {
  return Array.from(map.values())
    .map((entry) => ({
      ...entry,
      roi: entry.stake ? entry.profit / entry.stake : 0,
      hitRate: entry.settled ? entry.won / entry.settled : 0
    }))
    .sort((a, b) => b.roi - a.roi || b.hitRate - a.hitRate || b.settled - a.settled);
}

function normalizeMarketBucket(market) {
  const label = String(market || "").toLowerCase();
  if (label.includes("menos de") || label.includes("mas de")) return "Totales";
  if (label.includes("ambos anotan")) return "Ambos anotan";
  if (label.includes("doble oportunidad")) return "Doble oportunidad";
  if (label.includes("handicap")) return "Handicap";
  if (label.includes("gana") || label === "empate") return "1X2";
  return "Otros";
}

function compactOverview(overview) {
  return {
    settled: overview.settled,
    pending: overview.pending,
    won: overview.won,
    lost: overview.lost,
    profit: round(overview.profit),
    roi: round(overview.roi),
    hitRate: round(overview.hitRate),
    avgOdds: round(overview.avgOdds),
    avgStake: round(overview.avgStake)
  };
}

function compactRow(row) {
  return {
    label: row.label,
    settled: row.settled,
    won: row.won,
    lost: row.lost,
    profit: round(row.profit),
    roi: round(row.roi),
    hitRate: round(row.hitRate)
  };
}

function round(value) {
  return Number(Number(value || 0).toFixed(3));
}

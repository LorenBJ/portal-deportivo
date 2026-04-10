const TEAM_RATINGS = {
  futbol: {
    "paris saint-germain": 1920,
    "psg": 1920,
    "nantes": 1480,
    "marseille": 1760,
    "monaco": 1780,
    "lyon": 1700,
    "lille": 1720,
    "lens": 1690,
    "arsenal": 1880,
    "liverpool": 1900,
    "manchester city": 1930,
    "manchester united": 1730,
    "chelsea": 1740,
    "tottenham": 1760,
    "newcastle united": 1750,
    "aston villa": 1710,
    "real madrid": 1950,
    "barcelona": 1900,
    "atletico madrid": 1840,
    "athletic club": 1750,
    "girona": 1710,
    "sevilla": 1670,
    "real sociedad": 1740,
    "bayern munich": 1920,
    "bayer leverkusen": 1870,
    "borussia dortmund": 1800,
    "rb leipzig": 1810,
    "stuttgart": 1710,
    "juventus": 1830,
    "inter": 1900,
    "milan": 1820,
    "napoli": 1780,
    "roma": 1760,
    "lazio": 1740,
    "atalanta": 1790,
    "river plate": 1830,
    "boca juniors": 1810,
    "racing club": 1730,
    "independiente": 1670,
    "san lorenzo": 1680,
    "estudiantes": 1710,
    "velez sarsfield": 1670,
    "rosario central": 1650,
    "newell's old boys": 1640,
    "flamengo": 1850,
    "palmeiras": 1860,
    "sao paulo": 1770,
    "corinthians": 1740,
    "gremio": 1730,
    "internacional": 1740,
    "atletico mineiro": 1780,
    "botafogo": 1760,
    "penarol": 1710,
    "nacional": 1700,
    "olimpia": 1680,
    "liga de quito": 1730,
    "independiente del valle": 1740
  },
  basquet: {
    "boston celtics": 1860,
    "milwaukee bucks": 1810,
    "denver nuggets": 1830,
    "philadelphia 76ers": 1780,
    "miami heat": 1760,
    "orlando magic": 1700,
    "cleveland cavaliers": 1770,
    "new york knicks": 1760,
    "los angeles lakers": 1740,
    "golden state warriors": 1730,
    "phoenix suns": 1740,
    "dallas mavericks": 1770
  }
};

const COMPETITION_TOTALS = {
  "Liga Profesional Argentina": 2.18,
  "Copa Libertadores": 2.36,
  "Copa Sudamericana": 2.28,
  "Premier League": 2.95,
  "Ligue 1": 2.78,
  "Bundesliga": 3.08,
  "La Liga": 2.62,
  "Serie A": 2.74,
  "UEFA Champions League": 3.02,
  "NBA": 228
};

export function enrichMatches(rawMatches = []) {
  return rawMatches
    .map((match) => {
      const matchContext = buildMatchContext(match);
      return {
        ...match,
        modelBias: match.modelBias ?? 1,
        homeRating: matchContext.homeRating,
        awayRating: matchContext.awayRating,
        odds: normalizeOdds(match, matchContext)
      };
    })
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

export function summarizeMatchForAnalyst(match) {
  return {
    id: match.id,
    competition: match.competition,
    sport: match.sport,
    kickoff: match.kickoff,
    status: match.status,
    home: match.home,
    away: match.away,
    score: match.score,
    homeRating: match.homeRating,
    awayRating: match.awayRating,
    recommendedPicks: (match.odds ?? [])
      .filter((pick) => pick.recommended)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 4)
      .map((pick) => ({
        market: pick.market,
        price: pick.price,
        impliedProbability: pick.impliedProbability,
        modelProbability: pick.adjustedProbability,
        edge: pick.edge,
        confidence: pick.confidence,
        score: pick.recommendationScore,
        rationale: pick.rationale
      }))
  };
}

export function buildMatchInsight(match) {
  const sortedOdds = [...(match.odds ?? [])].sort((a, b) => b.recommendationScore - a.recommendationScore);
  const recommended = sortedOdds.filter((pick) => pick.recommended);
  const watchlist = sortedOdds.filter((pick) => !pick.recommended && pick.edge >= 0.01).slice(0, 4);
  const totalBaseline = COMPETITION_TOTALS[match.competition] ?? (normalizeSport(match.sport) === "basquet" ? 228 : 2.55);
  const ratingGap = Math.abs((match.homeRating ?? 1600) - (match.awayRating ?? 1600));
  const favorite = (match.homeRating ?? 1600) >= (match.awayRating ?? 1600) ? match.home : match.away;
  const parity = ratingGap <= 45 ? "Muy alta" : ratingGap <= 120 ? "Media" : "Baja";
  const tempo = normalizeSport(match.sport) === "basquet"
    ? totalBaseline >= 228 ? "Puntaje alto" : "Puntaje controlado"
    : totalBaseline >= 2.85 ? "Partido abierto" : totalBaseline <= 2.35 ? "Partido corto" : "Partido equilibrado";
  const bestPick = recommended[0] ?? watchlist[0] ?? sortedOdds[0] ?? null;

  return {
    favorite,
    parity,
    tempo,
    ratingGap,
    bestPick,
    recommended,
    watchlist,
    analystPrompt: `Analiza ${match.home} vs ${match.away}. Usa el contexto del partido, la paridad, los mercados disponibles y decime si conviene simple o combinada.`,
    summary:
      recommended.length > 0
        ? `${favorite} parte mejor en el modelo. La lectura base es ${tempo.toLowerCase()} y hay ${recommended.length} mercado(s) apto(s) para analizar.`
        : `${favorite} parte mejor en el modelo, pero por ahora no hay picks aptos. La lectura base es ${tempo.toLowerCase()} y conviene priorizar cautela.`
  };
}

function normalizeOdds(match, matchContext) {
  return (match.odds ?? [])
    .map((odd) => enrichPick(match, odd, matchContext))
    .filter((odd) => odd && odd.adjustedProbability >= 0.03);
}

function enrichPick(match, odd, matchContext) {
  const impliedProbability = clamp(1 / odd.price, 0.02, 0.92);
  const consensusProbability = clamp(
    odd.consensusProbability ?? odd.modelProbability ?? impliedProbability,
    0.02,
    0.92
  );
  const heuristic = getHeuristicProbability(match, odd, matchContext, consensusProbability);
  const adjustedProbability = clamp(
    consensusProbability * 0.76 + heuristic.probability * 0.24,
    0.02,
    0.92
  );
  const edge = adjustedProbability - impliedProbability;
  const expectedValue = adjustedProbability * odd.price - 1;
  const confidence = getConfidence(match, odd, matchContext, consensusProbability, adjustedProbability, heuristic);
  const marketWeight = getMarketWeight(odd.marketKey, match.sport);
  const recommendationScore = Math.max(0, edge) * confidence * marketWeight * 100;
  const absurd = isAbsurdPick(match, odd, matchContext, heuristic, impliedProbability);
  const recommended = !absurd && edge >= 0.025 && expectedValue >= 0.02 && confidence >= 0.6;

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
    consensusProbability,
    adjustedProbability,
    edge,
    expectedValue,
    confidence,
    recommendationScore,
    recommended,
    rationale: heuristic.rationale,
    riskTier: confidence >= 0.72 ? "Alta" : confidence >= 0.62 ? "Media" : "Cauta"
  };
}

function buildMatchContext(match) {
  const sportKey = normalizeSport(match.sport);
  const homeRating = getTeamRating(match.home, sportKey);
  const awayRating = getTeamRating(match.away, sportKey);
  const homeAdvantage = sportKey === "futbol" ? 55 : sportKey === "basquet" ? 35 : 40;
  return { sportKey, homeRating, awayRating, homeAdvantage };
}

function getHeuristicProbability(match, odd, context, fallbackProbability) {
  if (odd.marketKey === "h2h") return h2hProbability(match, odd, context);
  if (odd.marketKey === "totals") return totalsProbability(match, odd, context, fallbackProbability);
  if (odd.marketKey === "spreads") return spreadsProbability(match, odd, context, fallbackProbability);
  return { probability: fallbackProbability, rationale: "Sin ajuste extra" };
}

function h2hProbability(match, odd, context) {
  const diff = context.homeRating + context.homeAdvantage - context.awayRating;
  const homeRaw = logistic(diff / 190);
  const awayRaw = 1 - homeRaw;

  if (context.sportKey === "futbol") {
    const drawProbability = clamp(0.28 - Math.abs(homeRaw - awayRaw) * 0.16, 0.16, 0.3);
    const remaining = 1 - drawProbability;
    const homeProbability = remaining * homeRaw;
    const awayProbability = remaining * awayRaw;

    if (odd.market.includes(match.home)) return { probability: homeProbability, rationale: diff > 0 ? "Local fuerte con ventaja de cancha" : "Local equilibrado" };
    if (odd.market.includes(match.away)) return { probability: awayProbability, rationale: diff < 0 ? "Visitante competitivo" : "Visitante exigido" };
    return { probability: drawProbability, rationale: "Empate dependiente de paridad" };
  }

  if (odd.market.includes(match.home)) return { probability: homeRaw, rationale: diff > 0 ? "Local con mejor rating" : "Local sin ventaja clara" };
  return { probability: awayRaw, rationale: diff < 0 ? "Visitante superior" : "Visitante sin respaldo fuerte" };
}

function totalsProbability(match, odd, context, fallbackProbability) {
  const baselineTotal = COMPETITION_TOTALS[match.competition] ?? (context.sportKey === "basquet" ? 228 : 2.55);
  const line = extractNumber(odd.market);
  if (!Number.isFinite(line)) return { probability: fallbackProbability, rationale: "Linea sin parseo" };

  const overProbability = clamp(logistic((baselineTotal - line) / (context.sportKey === "basquet" ? 7 : 0.45)), 0.08, 0.92);
  if (odd.market.toLowerCase().includes("mas de")) return { probability: overProbability, rationale: `Linea comparada con media ${baselineTotal}` };
  return { probability: 1 - overProbability, rationale: `Linea comparada con media ${baselineTotal}` };
}

function spreadsProbability(match, odd, context, fallbackProbability) {
  const line = extractSignedLine(odd.market);
  if (!Number.isFinite(line)) return { probability: fallbackProbability, rationale: "Handicap sin parseo" };
  const projectedMargin = (context.homeRating + context.homeAdvantage - context.awayRating) / (context.sportKey === "basquet" ? 12 : 35);
  const probability = clamp(logistic((projectedMargin + line) / (context.sportKey === "basquet" ? 3.4 : 0.9)), 0.08, 0.92);
  return { probability, rationale: "Handicap comparado con diferencia estimada" };
}

function getConfidence(match, odd, context, consensusProbability, adjustedProbability, heuristic) {
  const ratingGap = Math.abs(context.homeRating - context.awayRating);
  const modelGap = Math.abs(adjustedProbability - consensusProbability);
  let confidence = 0.54;

  confidence += Math.min(0.1, ratingGap / 2500);
  confidence += odd.marketKey === "totals" ? 0.06 : 0;
  confidence += odd.marketKey === "h2h" && context.sportKey === "futbol" ? -0.03 : 0;
  confidence -= Math.min(0.14, modelGap * 1.4);
  confidence += heuristic.rationale.includes("fuerte") ? 0.04 : 0;
  confidence -= odd.market.includes(match.away) && context.homeRating - context.awayRating > 180 ? 0.16 : 0;

  return clamp(confidence, 0.35, 0.88);
}

function getMarketWeight(marketKey, sport) {
  if (marketKey === "totals") return normalizeSport(sport) === "futbol" ? 1.08 : 1;
  if (marketKey === "spreads") return 0.94;
  if (marketKey === "h2h") return normalizeSport(sport) === "futbol" ? 0.88 : 1;
  return 0.85;
}

function isAbsurdPick(match, odd, context, heuristic, impliedProbability) {
  if (odd.marketKey !== "h2h") return false;
  if (!odd.market.includes(match.away)) return false;
  const hugeGap = context.homeRating - context.awayRating >= 180;
  const awayHeuristicLow = heuristic.probability <= 0.16;
  const marketStillLong = impliedProbability <= 0.28;
  return hugeGap && awayHeuristicLow && marketStillLong;
}

function getTeamRating(name, sportKey) {
  const normalized = normalizeName(name);
  return TEAM_RATINGS[sportKey]?.[normalized] ?? 1600;
}

function normalizeSport(sport) {
  return normalizeName(sport).includes("basquet") ? "basquet" : "futbol";
}

function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNumber(text) {
  const match = String(text).match(/(\d+(?:[.,]\d+)?)/);
  return match ? Number(match[1].replace(",", ".")) : Number.NaN;
}

function extractSignedLine(text) {
  const match = String(text).match(/([+-]?\d+(?:[.,]\d+)?)(?!.*\d)/);
  return match ? Number(match[1].replace(",", ".")) : Number.NaN;
}

function logistic(value) {
  return 1 / (1 + Math.exp(-value));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}


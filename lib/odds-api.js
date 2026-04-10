import { getOddsApiConfig } from "./odds-config";

const BASE_URL = "https://api.the-odds-api.com/v4/sports";

export async function fetchOddsApiFeed() {
  const config = getOddsApiConfig();
  if (!config.apiKey) {
    return {
      matches: [],
      meta: {
        source: "mock",
        provider: "the-odds-api",
        configured: false,
        reason: "missing_odds_api_key",
        generatedAt: new Date().toISOString(),
        liveCoverage: false
      }
    };
  }

  const results = await Promise.allSettled(
    config.sportKeys.map((sportKey) => fetchSportBundle(sportKey, config))
  );

  const successful = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const matches = successful
    .flatMap((entry) => entry.matches)
    .filter((match) => match.odds.length > 0)
    .sort((left, right) => new Date(left.kickoff).getTime() - new Date(right.kickoff).getTime());

  const remaining = successful
    .map((entry) => entry.remaining)
    .filter((value) => Number.isFinite(value));

  const errors = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason instanceof Error ? result.reason.message : "unknown_error");

  return {
    matches,
    meta: {
      source: matches.length ? "live" : "mock",
      provider: "the-odds-api",
      configured: true,
      generatedAt: new Date().toISOString(),
      liveCoverage: matches.some((match) => match.status === "live"),
      sportsLoaded: successful.map((entry) => entry.sportKey),
      requestsRemaining: remaining.length ? Math.min(...remaining) : null,
      errors
    }
  };
}

async function fetchSportBundle(sportKey, config) {
  const oddsUrl = new URL(`${BASE_URL}/${sportKey}/odds`);
  oddsUrl.searchParams.set("apiKey", config.apiKey);
  oddsUrl.searchParams.set("regions", config.regions);
  oddsUrl.searchParams.set("markets", config.markets);
  oddsUrl.searchParams.set("oddsFormat", "decimal");
  oddsUrl.searchParams.set("dateFormat", "iso");

  const scoresUrl = new URL(`${BASE_URL}/${sportKey}/scores`);
  scoresUrl.searchParams.set("apiKey", config.apiKey);
  scoresUrl.searchParams.set("daysFrom", "1");

  const [oddsResponse, scoresResponse] = await Promise.all([
    fetch(oddsUrl, { cache: "no-store" }),
    fetch(scoresUrl, { cache: "no-store" })
  ]);

  if (!oddsResponse.ok) {
    throw new Error(`odds_request_failed:${sportKey}:${oddsResponse.status}`);
  }

  const oddsPayload = await oddsResponse.json();
  const scoresPayload = scoresResponse.ok ? await scoresResponse.json() : [];
  const scoresById = new Map(scoresPayload.map((event) => [event.id, event]));

  return {
    sportKey,
    remaining: Number(oddsResponse.headers.get("x-requests-remaining")),
    matches: oddsPayload
      .map((event) => normalizeEvent(event, scoresById.get(event.id)))
      .filter(Boolean)
  };
}

function normalizeEvent(event, scoreEvent) {
  const odds = extractBestOutcomes(event);
  if (!odds.length) return null;

  return {
    id: event.id,
    sport: inferSportLabel(event.sport_key),
    competition: event.sport_title,
    status: inferStatus(event.commence_time, scoreEvent),
    kickoff: event.commence_time,
    venue: scoreEvent?.venue ?? "Cobertura en vivo",
    home: event.home_team,
    away: event.away_team,
    score: formatScore(event, scoreEvent),
    odds,
    modelBias: 1
  };
}

function extractBestOutcomes(event) {
  const grouped = new Map();

  for (const bookmaker of event.bookmakers ?? []) {
    for (const market of bookmaker.markets ?? []) {
      for (const outcome of market.outcomes ?? []) {
        const price = Number(outcome.price);
        if (!Number.isFinite(price) || price <= 1) continue;

        const label = formatMarketLabel(market.key, outcome, event);
        const key = `${market.key}:${outcome.name}:${outcome.point ?? ""}`;
        const existing = grouped.get(key) ?? {
          id: `${event.id}-${key}`,
          market: label,
          price,
          bookmaker: bookmaker.title,
          marketKey: market.key,
          consensusSamples: []
        };

        if (price > existing.price) {
          existing.price = price;
          existing.bookmaker = bookmaker.title;
        }

        existing.consensusSamples.push(1 / price);
        grouped.set(key, existing);
      }
    }
  }

  return Array.from(grouped.values())
    .map((entry) => {
      const consensusProbability = average(entry.consensusSamples);
      return {
        id: entry.id,
        market: entry.market,
        price: entry.price,
        bookmaker: entry.bookmaker,
        consensusProbability,
        modelProbability: applyHeuristicBoost(entry.marketKey, entry.market, consensusProbability, event)
      };
    })
    .sort((left, right) => right.price - left.price);
}

function applyHeuristicBoost(marketKey, marketLabel, consensusProbability, event) {
  let adjustment = 0;

  if (marketKey === "h2h") {
    if (marketLabel.includes(event.home_team)) adjustment += 0.018;
    if (marketLabel === "Empate") adjustment -= 0.012;
  }

  if (marketKey === "totals" && event.sport_key.startsWith("soccer")) {
    if (marketLabel.includes("Menos de 2.5")) adjustment += 0.015;
    if (marketLabel.includes("Mas de 2.5")) adjustment += 0.008;
  }

  if (marketKey === "spreads" && event.sport_key === "basketball_nba") {
    adjustment += 0.012;
  }

  return clamp(consensusProbability + adjustment, 0.03, 0.92);
}

function formatMarketLabel(marketKey, outcome, event) {
  if (marketKey === "h2h") {
    if (outcome.name === event.home_team) return `${event.home_team} gana`;
    if (outcome.name === event.away_team) return `${event.away_team} gana`;
    return "Empate";
  }

  if (marketKey === "totals") {
    const prefix = outcome.name.toLowerCase().includes("over") ? "Mas de" : "Menos de";
    return `${prefix} ${outcome.point}`;
  }

  if (marketKey === "spreads") {
    const sign = Number(outcome.point) > 0 ? "+" : "";
    return `${outcome.name} ${sign}${outcome.point}`;
  }

  return `${marketKey} ${outcome.name}`;
}

function inferStatus(commenceTime, scoreEvent) {
  if (scoreEvent?.completed) return "completed";
  if (scoreEvent?.scores?.length) return "live";
  return new Date(commenceTime).getTime() <= Date.now() ? "live" : "upcoming";
}

function formatScore(event, scoreEvent) {
  if (!scoreEvent?.scores?.length) {
    return inferStatus(event.commence_time, scoreEvent) === "live" ? "En juego" : "-";
  }

  const homeScore = scoreEvent.scores.find((item) => item.name === event.home_team)?.score ?? "0";
  const awayScore = scoreEvent.scores.find((item) => item.name === event.away_team)?.score ?? "0";
  return `${homeScore} - ${awayScore}`;
}

function inferSportLabel(sportKey) {
  if (sportKey.startsWith("basketball")) return "Basquet";
  if (sportKey.startsWith("soccer")) return "Futbol";
  return sportKey;
}

function average(values) {
  if (!values.length) return 0.5;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

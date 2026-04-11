import { getApiFootballConfig } from "./api-football-config";

const PREMATCH_BET_TYPE_MAP = {
  "match winner": "h2h",
  "goals over/under": "totals",
  "over/under": "totals",
  "asian handicap": "spreads",
  "double chance": "double_chance",
  "both teams score": "btts"
};

let cache = { expiresAt: 0, payload: null };

export async function fetchFootballFeed() {
  const config = getApiFootballConfig();
  if (!config.apiKey) {
    return {
      matches: [],
      meta: {
        source: "mock",
        provider: "api-football",
        configured: false,
        reason: "missing_api_football_key",
        generatedAt: new Date().toISOString(),
        liveCoverage: false,
        errors: []
      }
    };
  }

  if (cache.payload && cache.expiresAt > Date.now()) return cache.payload;

  const liveLeagueIds = config.leagues.map((league) => league.id).join("-");
  const liveResult = await apiFetch("/fixtures", { live: liveLeagueIds, timezone: config.timezone }, config, "fixtures_live").catch((error) => ({ response: [], headers: {}, error }));
  const dateWindow = buildDateWindow(config.targetDate, 3);

  const bundles = await Promise.allSettled(config.leagues.map((league) => fetchLeagueBundle(league, config, dateWindow)));
  const successful = bundles.filter((item) => item.status === "fulfilled").map((item) => item.value);
  const errors = [
    ...(liveResult.error ? [liveResult.error instanceof Error ? liveResult.error.message : String(liveResult.error)] : []),
    ...bundles.filter((item) => item.status === "rejected").map((item) => item.reason instanceof Error ? item.reason.message : "unknown_error")
  ];

  const fixtureMap = new Map();
  for (const fixture of liveResult.response ?? []) fixtureMap.set(fixture.fixture.id, fixture);
  for (const bundle of successful) {
    for (const fixture of bundle.fixtures) {
      if (!fixtureMap.has(fixture.fixture.id)) fixtureMap.set(fixture.fixture.id, fixture);
    }
  }

  const oddsByFixture = new Map();
  for (const bundle of successful) {
    for (const [fixtureId, odds] of bundle.oddsByFixture.entries()) oddsByFixture.set(fixtureId, odds);
  }

  const matches = Array.from(fixtureMap.values())
    .map((fixture) => normalizeFixture(fixture, oddsByFixture.get(fixture.fixture.id) ?? []))
    .filter(Boolean)
    .sort((left, right) => new Date(left.kickoff).getTime() - new Date(right.kickoff).getTime());

  const remainingValues = [liveResult.headers?.dailyRemaining, ...successful.flatMap((bundle) => bundle.rateHints)].filter((value) => Number.isFinite(value));
  const payload = {
    matches,
    meta: {
      source: matches.length ? "live" : "mock",
      provider: "api-football",
      configured: true,
      generatedAt: new Date().toISOString(),
      liveCoverage: matches.some((match) => match.status === "live"),
      sportsLoaded: config.leagues.map((league) => league.id),
      requestsRemaining: remainingValues.length ? Math.min(...remainingValues) : null,
      errors,
      reason: matches.length ? "ok" : successful.length ? "no_matches_returned" : "all_leagues_failed"
    }
  };

  cache = { expiresAt: Date.now() + config.cacheTtlMs, payload };
  return payload;
}

async function fetchLeagueBundle(league, config, dateWindow) {
  const season = resolveSeason(league.seasonMode, config.targetDate);
  const fixturesMap = new Map();
  const oddsByFixture = new Map();
  const rateHints = [];

  for (const date of dateWindow) {
    const fixturesResult = await apiFetch(
      "/fixtures",
      { league: String(league.id), season: String(season), date, timezone: config.timezone },
      config,
      `fixtures:${league.id}:${date}`
    );

    for (const fixture of fixturesResult.response) fixturesMap.set(fixture.fixture.id, fixture);
    rateHints.push(fixturesResult.headers.dailyRemaining);

    const oddsResult = await fetchPaginatedOdds(league.id, season, date, config);
    rateHints.push(oddsResult.headers.dailyRemaining);
    for (const oddsEntry of oddsResult.response) oddsByFixture.set(oddsEntry.fixture.id, normalizeOddsEntry(oddsEntry));
  }

  return {
    fixtures: Array.from(fixturesMap.values()),
    oddsByFixture,
    rateHints
  };
}

async function fetchPaginatedOdds(leagueId, season, date, config) {
  let page = 1;
  let totalPages = 1;
  const response = [];
  let headers = {};

  while (page <= totalPages) {
    const result = await apiFetch(
      "/odds",
      { league: String(leagueId), season: String(season), date, page: String(page) },
      config,
      `odds:${leagueId}:${date}:page:${page}`
    );
    headers = result.headers;
    response.push(...result.response);
    totalPages = Number(result.paging?.total ?? 1);
    page += 1;
  }

  return { response, headers };
}

async function apiFetch(path, params, config, tag) {
  const url = new URL(`${config.baseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: { "x-apisports-key": config.apiKey },
    next: { revalidate: Math.max(60, Math.floor(config.cacheTtlMs / 1000)) }
  });

  const data = await response.json().catch(() => null);
  const hasErrors = Array.isArray(data?.errors) ? data.errors.length > 0 : Boolean(data?.errors && Object.keys(data.errors).length);
  if (!response.ok || hasErrors) {
    const detail = Array.isArray(data?.errors)
      ? data.errors.join("|")
      : data?.errors
        ? JSON.stringify(data.errors)
        : data?.message || response.status;
    throw new Error(`api_football_request_failed:${tag}:${response.status}:${detail}`);
  }

  return {
    response: data?.response ?? [],
    paging: data?.paging ?? { current: 1, total: 1 },
    headers: {
      dailyRemaining: Number(response.headers.get("x-ratelimit-requests-remaining")),
      minuteRemaining: Number(response.headers.get("x-ratelimit-remaining"))
    }
  };
}

function normalizeFixture(fixtureEntry, odds) {
  if (!odds.length) return null;

  return {
    id: String(fixtureEntry.fixture.id),
    sport: "Futbol",
    competition: fixtureEntry.league?.name ?? "Competencia",
    competitionId: fixtureEntry.league?.id ?? null,
    competitionLogo: fixtureEntry.league?.logo ?? "",
    status: inferStatus(fixtureEntry.fixture?.status?.short),
    kickoff: fixtureEntry.fixture?.date,
    venue: fixtureEntry.fixture?.venue?.name ?? "Sede a confirmar",
    home: fixtureEntry.teams?.home?.name ?? "Local",
    homeId: fixtureEntry.teams?.home?.id ?? null,
    homeLogo: fixtureEntry.teams?.home?.logo ?? "",
    away: fixtureEntry.teams?.away?.name ?? "Visitante",
    awayId: fixtureEntry.teams?.away?.id ?? null,
    awayLogo: fixtureEntry.teams?.away?.logo ?? "",
    score: formatScore(fixtureEntry.goals, fixtureEntry.fixture?.status?.short),
    odds,
    modelBias: 1
  };
}

function normalizeOddsEntry(oddsEntry) {
  const grouped = new Map();

  for (const bookmaker of oddsEntry.bookmakers ?? []) {
    for (const bet of bookmaker.bets ?? []) {
      const marketKey = PREMATCH_BET_TYPE_MAP[normalizeText(bet.name)] ?? "other";
      for (const value of bet.values ?? []) {
        const price = Number(String(value.odd).replace(",", "."));
        if (!Number.isFinite(price) || price <= 1) continue;

        const market = formatMarketLabel(marketKey, value.value, oddsEntry);
        const key = `${marketKey}:${market}`;
        const existing = grouped.get(key) ?? { id: `${oddsEntry.fixture.id}-${key}`, market, marketKey, price, bookmaker: bookmaker.name, consensusSamples: [] };
        if (price > existing.price) {
          existing.price = price;
          existing.bookmaker = bookmaker.name;
        }
        existing.consensusSamples.push(1 / price);
        grouped.set(key, existing);
      }
    }
  }

  return Array.from(grouped.values())
    .map((entry) => ({
      id: entry.id,
      market: entry.market,
      marketKey: entry.marketKey,
      price: entry.price,
      bookmaker: entry.bookmaker,
      consensusProbability: average(entry.consensusSamples),
      modelProbability: average(entry.consensusSamples)
    }))
    .sort((left, right) => right.price - left.price);
}

function formatMarketLabel(marketKey, rawValue, oddsEntry) {
  const value = String(rawValue ?? "").trim();
  const home = oddsEntry.teams?.home?.name ?? "Local";
  const away = oddsEntry.teams?.away?.name ?? "Visitante";
  const normalizedValue = normalizeText(value);

  if (marketKey === "h2h") {
    if (["home", "1", normalizeText(home)].includes(normalizedValue)) return `${home} gana`;
    if (["away", "2", normalizeText(away)].includes(normalizedValue)) return `${away} gana`;
    return "Empate";
  }

  if (marketKey === "totals") {
    const line = extractNumber(value);
    const prefix = normalizedValue.includes("under") ? "Menos de" : "Mas de";
    return Number.isFinite(line) ? `${prefix} ${line}` : value;
  }

  if (marketKey === "spreads") return `Handicap ${value.replace(/^Home/i, home).replace(/^Away/i, away)}`;

  if (marketKey === "btts") {
    return `Ambos anotan: ${normalizedValue === "yes" ? "Si" : normalizedValue === "no" ? "No" : value}`;
  }

  if (marketKey === "double_chance") {
    if (["1x", "home/draw"].includes(normalizedValue)) return `Doble oportunidad: ${home} o Empate`;
    if (["12", "home/away"].includes(normalizedValue)) return `Doble oportunidad: ${home} o ${away}`;
    if (["x2", "away/draw"].includes(normalizedValue)) return `Doble oportunidad: ${away} o Empate`;
    return `Doble oportunidad: ${value}`;
  }

  return value;
}

function inferStatus(shortStatus) {
  if (["FT", "AET", "PEN", "CANC", "ABD", "AWD", "WO"].includes(shortStatus)) return "completed";
  if (["NS", "TBD", "PST"].includes(shortStatus)) return "upcoming";
  return "live";
}

function formatScore(goals, shortStatus) {
  if (["NS", "TBD", "PST"].includes(shortStatus)) return "-";
  return `${goals?.home ?? 0} - ${goals?.away ?? 0}`;
}

function resolveSeason(mode, targetDate) {
  const date = new Date(`${targetDate}T12:00:00Z`);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return mode === "calendar" ? year : month >= 7 ? year : year - 1;
}

function buildDateWindow(targetDate, days) {
  const dates = [];
  const base = new Date(`${targetDate}T12:00:00Z`);
  for (let index = 0; index < days; index += 1) {
    const next = new Date(base);
    next.setUTCDate(base.getUTCDate() + index);
    dates.push(next.toISOString().slice(0, 10));
  }
  return dates;
}

function normalizeText(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function extractNumber(text) {
  const match = String(text).match(/(\d+(?:[.,]\d+)?)/);
  return match ? Number(match[1].replace(",", ".")) : Number.NaN;
}

function average(values) {
  if (!values.length) return 0.5;
  return values.reduce((total, value) => total + value, 0) / values.length;
}




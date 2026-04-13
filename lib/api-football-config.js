const DEFAULT_LEAGUES = [
  { id: 128, seasonMode: "calendar" },
  { id: 71, seasonMode: "calendar" },
  { id: 39, seasonMode: "split" },
  { id: 140, seasonMode: "split" },
  { id: 78, seasonMode: "split" },
  { id: 135, seasonMode: "split" },
  { id: 61, seasonMode: "split" },
  { id: 2, seasonMode: "split" },
  { id: 13, seasonMode: "calendar" },
  { id: 11, seasonMode: "calendar" }
];

export function getApiFootballConfig() {
  return {
    apiKey: process.env.API_FOOTBALL_KEY ?? "",
    baseUrl: process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io",
    timezone: process.env.API_FOOTBALL_TIMEZONE ?? "America/Buenos_Aires",
    targetDate: process.env.API_FOOTBALL_DATE ?? new Date().toISOString().slice(0, 10),
    cacheTtlMs: Number(process.env.API_FOOTBALL_CACHE_MS ?? 180000),
    fixtureDays: normalizePositiveInt(process.env.API_FOOTBALL_FIXTURE_DAYS, 7),
    oddsDays: normalizePositiveInt(process.env.API_FOOTBALL_ODDS_DAYS, 7),
    maxOddsPages: normalizePositiveInt(process.env.API_FOOTBALL_MAX_ODDS_PAGES, 1),
    requestSpacingMs: normalizePositiveInt(process.env.API_FOOTBALL_REQUEST_SPACING_MS, 250),
    leagues: parseLeagueConfig(process.env.API_FOOTBALL_LEAGUES)
  };
}

function parseLeagueConfig(rawValue) {
  if (!rawValue) return DEFAULT_LEAGUES;

  const entries = rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [idPart, seasonModePart] = item.split(":");
      const id = Number(idPart);
      return Number.isFinite(id)
        ? { id, seasonMode: seasonModePart === "calendar" ? "calendar" : "split" }
        : null;
    })
    .filter(Boolean);

  return ensureLeague(entries, { id: 71, seasonMode: "calendar" });
}

function ensureLeague(leagues, leagueToEnsure) {
  return leagues.some((league) => league.id === leagueToEnsure.id)
    ? leagues
    : [leagueToEnsure, ...leagues];
}

function normalizePositiveInt(rawValue, fallback) {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

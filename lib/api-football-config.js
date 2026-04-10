const DEFAULT_LEAGUES = [
  { id: 128, seasonMode: "calendar" },
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
    leagues: parseLeagueConfig(process.env.API_FOOTBALL_LEAGUES)
  };
}

function parseLeagueConfig(rawValue) {
  if (!rawValue) return DEFAULT_LEAGUES;

  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [idPart, seasonModePart] = item.split(":");
      const id = Number(idPart);
      return Number.isFinite(id) ? { id, seasonMode: seasonModePart === "calendar" ? "calendar" : "split" } : null;
    })
    .filter(Boolean);
}

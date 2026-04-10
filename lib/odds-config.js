const DEFAULT_SPORT_KEYS = [
  "soccer_argentina_primera_division",
  "soccer_conmebol_copa_libertadores",
  "soccer_uefa_champs_league",
  "soccer_epl",
  "basketball_nba"
];

export function getOddsApiConfig() {
  return {
    apiKey: process.env.ODDS_API_KEY ?? "",
    regions: process.env.ODDS_API_REGIONS ?? "eu",
    markets: process.env.ODDS_API_MARKETS ?? "h2h,spreads,totals",
    sportKeys: (process.env.ODDS_API_SPORT_KEYS ?? DEFAULT_SPORT_KEYS.join(","))
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  };
}

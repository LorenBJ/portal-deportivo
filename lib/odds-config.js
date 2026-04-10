const DEFAULT_SPORT_KEYS = [
  "soccer_argentina_primera_division",
  "soccer_epl",
  "soccer_spain_la_liga",
  "soccer_germany_bundesliga",
  "soccer_italy_serie_a",
  "soccer_france_ligue_one",
  "soccer_uefa_champs_league",
  "soccer_conmebol_copa_libertadores",
  "soccer_conmebol_copa_sudamericana",
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

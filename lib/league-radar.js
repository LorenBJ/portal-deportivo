import { formatPercent } from "@/lib/format";

export function buildLeagueRadar(matches = [], bets = []) {
  const settled = bets.filter((bet) => bet.status === "won" || bet.status === "lost");
  const liveLeagueMap = new Map();
  const leagueMap = new Map();
  const teamMap = new Map();

  for (const match of matches) {
    const leagueKey = match.competition;
    const leagueEntry = liveLeagueMap.get(leagueKey) ?? {
      league: match.competition,
      logo: match.competitionLogo || "",
      liveMatches: 0,
      recommendedPicks: 0,
      teams: new Map()
    };

    leagueEntry.liveMatches += 1;
    leagueEntry.recommendedPicks += (match.odds ?? []).filter((pick) => pick.recommended).length;

    mergeTeamPresence(leagueEntry.teams, match.home, match.homeLogo);
    mergeTeamPresence(leagueEntry.teams, match.away, match.awayLogo);
    liveLeagueMap.set(leagueKey, leagueEntry);
  }

  for (const bet of settled) {
    const profit = bet.status === "won"
      ? Number(bet.potentialReturn || 0) - Number(bet.stake || 0)
      : -Number(bet.stake || 0);

    const seenLeagues = new Set();
    const seenTeams = new Set();

    for (const pick of bet.picks ?? []) {
      const leagueKey = pick.competition || "Sin liga";
      const leagueEntry = leagueMap.get(leagueKey) ?? createPerformanceEntry({
        label: leagueKey,
        logo: pick.competitionLogo || liveLeagueMap.get(leagueKey)?.logo || ""
      });

      if (!seenLeagues.has(leagueKey)) {
        applyResult(leagueEntry, bet, profit);
        seenLeagues.add(leagueKey);
      }
      leagueMap.set(leagueKey, leagueEntry);

      const teams = [
        { name: pick.home, logo: pick.homeLogo || liveLeagueMap.get(leagueKey)?.teams.get(pick.home)?.logo || "" },
        { name: pick.away, logo: pick.awayLogo || liveLeagueMap.get(leagueKey)?.teams.get(pick.away)?.logo || "" }
      ];

      for (const team of teams) {
        const key = `${leagueKey}::${team.name}`;
        const teamEntry = teamMap.get(key) ?? createPerformanceEntry({ label: team.name, logo: team.logo, league: leagueKey });
        if (!seenTeams.has(key)) {
          applyResult(teamEntry, bet, profit);
          seenTeams.add(key);
        }
        teamMap.set(key, teamEntry);
      }
    }
  }

  const leagues = Array.from(new Set([...liveLeagueMap.keys(), ...leagueMap.keys()])).map((leagueKey) => {
    const performance = leagueMap.get(leagueKey) ?? createPerformanceEntry({ label: leagueKey, logo: liveLeagueMap.get(leagueKey)?.logo || "" });
    const live = liveLeagueMap.get(leagueKey);
    return finalizeEntry({
      ...performance,
      liveMatches: live?.liveMatches ?? 0,
      recommendedPicks: live?.recommendedPicks ?? 0,
      logo: performance.logo || live?.logo || ""
    });
  }).sort((left, right) => right.score - left.score || right.settled - left.settled);

  const teams = Array.from(teamMap.values())
    .map(finalizeEntry)
    .sort((left, right) => right.score - left.score || right.settled - left.settled);

  return {
    leagues,
    teams,
    summary: {
      totalLeagues: leagues.length,
      operableLeagues: leagues.filter((league) => league.status === "Operable").length,
      observedLeagues: leagues.filter((league) => league.status === "Observacion").length,
      totalTeams: teams.length,
      activeMatches: matches.length
    }
  };
}

export function getLeagueStatusBadge(league) {
  if (league.status === "Operable") return "won";
  if (league.status === "Observacion") return "pending";
  return "lost";
}

export function describeLeagueStatus(league) {
  if (league.status === "Operable") return `${league.liveMatches} partidos vivos y ${league.recommendedPicks} picks aptos en radar.`;
  if (league.status === "Observacion") return "Hay algo de muestra o cobertura, pero todavia no alcanza para empujar volumen.";
  return "Falta muestra o la performance historica no justifica subir exposicion.";
}

function createPerformanceEntry({ label, logo = "", league = "" }) {
  return {
    label,
    league,
    logo,
    settled: 0,
    won: 0,
    lost: 0,
    stake: 0,
    profit: 0,
    liveMatches: 0,
    recommendedPicks: 0,
    score: 0,
    status: "Descartar"
  };
}

function applyResult(entry, bet, profit) {
  entry.settled += 1;
  entry.stake += Number(bet.stake || 0);
  entry.profit += profit;
  if (bet.status === "won") entry.won += 1;
  if (bet.status === "lost") entry.lost += 1;
}

function finalizeEntry(entry) {
  const hitRate = entry.settled ? entry.won / entry.settled : 0;
  const roi = entry.stake ? entry.profit / entry.stake : 0;
  const coverage = Math.min(1, entry.liveMatches / 8 + entry.recommendedPicks / 12);
  const sample = Math.min(1, entry.settled / 10);
  const score = ((roi * 100) * 0.42) + (hitRate * 100 * 0.33) + (coverage * 100 * 0.15) + (sample * 100 * 0.1);
  const status = entry.settled >= 4 && roi > 0 && hitRate >= 0.5
    ? "Operable"
    : entry.liveMatches > 0 || entry.settled >= 2
      ? "Observacion"
      : "Descartar";

  return {
    ...entry,
    hitRate,
    roi,
    coverage,
    score,
    status,
    hitRateLabel: formatPercent(hitRate),
    roiLabel: formatPercent(roi),
    coverageLabel: formatPercent(coverage)
  };
}

function mergeTeamPresence(map, name, logo) {
  if (!name) return;
  const current = map.get(name) ?? { logo: logo || "" };
  if (!current.logo && logo) current.logo = logo;
  map.set(name, current);
}

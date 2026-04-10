export function getBotMetrics(bets = [], settings = {}) {
  const settled = bets.filter((bet) => bet.status === "won" || bet.status === "lost");
  const totalStaked = settled.reduce((acc, bet) => acc + Number(bet.stake || 0), 0);
  const totalReturned = settled.reduce((acc, bet) => acc + (bet.status === "won" ? Number(bet.potentialReturn || 0) : 0), 0);
  const profit = totalReturned - totalStaked;
  const currentBankroll = Number(settings.bankrollStart || 0) + profit;
  const maxDrawdown = getMaxDrawdown(settled);
  const settledByDay = groupByDay(settled);
  const last7Days = getLastDaysSeries(settledByDay, 7);
  const recent = settled.slice(-10);
  const recentWins = recent.filter((bet) => bet.status === "won").length;
  const hitRateRecent = recent.length ? recentWins / recent.length : 0;
  const avgOdds = settled.length
    ? settled.reduce((acc, bet) => acc + Number(bet.odds || 0), 0) / settled.length
    : 0;
  const avgStake = settled.length
    ? settled.reduce((acc, bet) => acc + Number(bet.stake || 0), 0) / settled.length
    : 0;
  const roi = totalStaked ? profit / totalStaked : 0;
  const todayKey = isoDay(new Date());
  const today = settledByDay[todayKey] ?? { profit: 0, stake: 0, count: 0 };
  const lossStreak = getLossStreak(settled);
  const winStreak = getWinStreak(settled);
  const pendingCount = bets.filter((bet) => bet.status === "pending").length;
  const temperature = getTemperature({ roi, hitRateRecent, lossStreak, winStreak, pending: pendingCount });

  return {
    settled: settled.length,
    pending: pendingCount,
    totalStaked,
    totalReturned,
    profit,
    roi,
    currentBankroll,
    maxDrawdown,
    last7Days,
    hitRateRecent,
    avgOdds,
    avgStake,
    today,
    lossStreak,
    winStreak,
    temperature
  };
}

export function buildBotTickets(bets = [], settings = {}) {
  const baseStake = Number(settings.bankrollStart || 0) * ((Number(settings.baseStakePct || 1) || 1) / 100);

  return bets
    .filter((bet) => bet.status === "pending")
    .map((bet) => ({
      id: `ticket-${bet.id}`,
      betId: bet.id,
      createdAt: bet.createdAt,
      match: bet.picks?.map((pick) => `${pick.home} vs ${pick.away}`).join(" + ") || "Apuesta pendiente",
      market: bet.picks?.map((pick) => pick.market).join(" / ") || "Mercado",
      odds: Number(bet.odds || 0),
      stake: Number(bet.stake || 0) || Number(baseStake.toFixed(0)),
      targetOdds: Number(bet.odds || 0),
      status: "suggested",
      channel: "telegram",
      note: "Revisar cuota final antes del click.",
      executionMode: settings.autoMode === "live" ? "semi-auto" : settings.autoMode
    }))
    .slice(0, Number(settings.maxBetsPerDay || 12));
}

function getTemperature({ roi, hitRateRecent, lossStreak, winStreak, pending }) {
  let score = 52;
  score += roi * 180;
  score += (hitRateRecent - 0.5) * 28;
  score += Math.min(10, winStreak * 2.5);
  score -= Math.min(18, lossStreak * 4.5);
  score -= Math.min(6, pending);
  return clamp(score, 8, 95);
}

function getMaxDrawdown(bets) {
  let running = 0;
  let peak = 0;
  let drawdown = 0;
  for (const bet of bets) {
    running += bet.status === "won"
      ? Number(bet.potentialReturn || 0) - Number(bet.stake || 0)
      : -Number(bet.stake || 0);
    peak = Math.max(peak, running);
    drawdown = Math.max(drawdown, peak - running);
  }
  return drawdown;
}

function groupByDay(bets) {
  return bets.reduce((acc, bet) => {
    const key = isoDay(bet.createdAt || new Date());
    if (!acc[key]) acc[key] = { profit: 0, stake: 0, count: 0 };
    acc[key].count += 1;
    acc[key].stake += Number(bet.stake || 0);
    acc[key].profit += bet.status === "won"
      ? Number(bet.potentialReturn || 0) - Number(bet.stake || 0)
      : -Number(bet.stake || 0);
    return acc;
  }, {});
}

function getLastDaysSeries(grouped, days) {
  const series = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = isoDay(date);
    const item = grouped[key] ?? { profit: 0, stake: 0, count: 0 };
    series.push({ key, label: key.slice(5), ...item });
  }
  return series;
}

function getLossStreak(bets) {
  let streak = 0;
  for (let index = bets.length - 1; index >= 0; index -= 1) {
    if (bets[index].status !== "lost") break;
    streak += 1;
  }
  return streak;
}

function getWinStreak(bets) {
  let streak = 0;
  for (let index = bets.length - 1; index >= 0; index -= 1) {
    if (bets[index].status !== "won") break;
    streak += 1;
  }
  return streak;
}

function isoDay(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

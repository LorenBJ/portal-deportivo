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
  const mode = recommendMode({ roi, todayProfit: today.profit, lossStreak, winStreak, temperature });

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
    temperature,
    mode,
    actionPlan: buildActionPlan(mode, settings, { avgOdds, avgStake, todayProfit: today.profit, roi, lossStreak, winStreak })
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
      executionMode: settings.autoMode === "live" ? "semi-auto" : "paper"
    }))
    .slice(0, Number(settings.maxBetsPerDay || 12));
}

function buildActionPlan(mode, settings, context) {
  const bankroll = Number(settings.bankrollStart || 0);
  const baseUnit = bankroll > 0 ? bankroll * ((Number(settings.baseStakePct || 1) || 1) / 100) : 0;

  if (mode === "recovery") {
    return {
      label: "Recuperacion controlada",
      stakeBand: [baseUnit * 0.4, baseUnit * 0.7],
      oddsBand: [1.1, 1.35],
      dailyTarget: Math.max(0, Math.abs(context.todayProfit || 0) * 0.35),
      note: "Reducir varianza, aumentar volumen y solo aceptar cuotas cortas con respaldo alto."
    };
  }

  if (mode === "attack") {
    return {
      label: "Ataque medido",
      stakeBand: [baseUnit * 0.9, baseUnit * 1.4],
      oddsBand: [1.45, 2.4],
      dailyTarget: Math.max(baseUnit, bankroll * 0.02),
      note: "Expandir riesgo solo si el mes viene verde y la temperatura del modelo se mantiene arriba."
    };
  }

  return {
    label: "Balance operativo",
    stakeBand: [baseUnit * 0.6, baseUnit],
    oddsBand: [1.22, 1.8],
    dailyTarget: Math.max(baseUnit * 0.5, bankroll * 0.01),
    note: "Mantener stakes contenidos y priorizar picks con edge y confianza media/alta."
  };
}

function recommendMode({ roi, todayProfit, lossStreak, winStreak, temperature }) {
  if (lossStreak >= 3 || todayProfit < 0 || temperature < 43 || roi < 0) return "recovery";
  if (winStreak >= 3 && roi > 0.08 && temperature > 68) return "attack";
  return "balanced";
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

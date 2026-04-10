"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDecimal, formatMoney, formatPercent } from "@/lib/format";
import { getBotMetrics } from "@/lib/bot-lab";

const STATE_KEY = "portal-deportivo-state";
const BOT_KEY = "portal-deportivo-bot";

const DEFAULT_SETTINGS = {
  bankrollStart: 150000,
  dailyBudget: 6000,
  baseStakePct: 1,
  maxBetsPerDay: 12,
  minOdds: 1.1,
  maxOdds: 1.8,
  autoMode: "paper",
  riskMode: "adaptive"
};

export function BotView() {
  const [bets, setBets] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    const rawState = window.localStorage.getItem(STATE_KEY);
    const rawBot = window.localStorage.getItem(BOT_KEY);

    if (rawState) {
      try {
        const parsed = JSON.parse(rawState);
        setBets(parsed.bets ?? []);
      } catch {}
    }

    if (rawBot) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(rawBot) });
      } catch {}
    }
  }, []);

  const metrics = useMemo(() => getBotMetrics(bets, settings), [bets, settings]);

  function updateField(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function applyMode(mode) {
    setSettings((current) => ({
      ...current,
      riskMode: mode === "balanced" ? "adaptive" : mode,
      minOdds: mode === "recovery" ? 1.1 : mode === "attack" ? 1.4 : 1.22,
      maxOdds: mode === "recovery" ? 1.35 : mode === "attack" ? 2.4 : 1.8,
      maxBetsPerDay: mode === "recovery" ? 20 : mode === "attack" ? 8 : 12,
      baseStakePct: mode === "recovery" ? 0.45 : mode === "attack" ? 1.35 : 1
    }));
  }

  function saveSettings() {
    window.localStorage.setItem(BOT_KEY, JSON.stringify(settings));
    setSavedAt(new Date().toISOString());
  }

  const plan = metrics.actionPlan;

  return (
    <section className="stack">
      <section className="botHeroGrid">
        <article className="panel botLeadPanel">
          <p className="eyebrow">Bot Lab</p>
          <h2>Orquestacion diaria y control de temperatura</h2>
          <p className="lead compactLead">
            Esta mesa te deja medir bankroll, calor, drawdown, volumen y regimen operativo. El objetivo es validar si el sistema merece pasar de paper a ejecucion real.
          </p>
          <div className="metricGrid spacious">
            <div className="metricCard"><span>Modo actual</span><strong>{modeLabel(metrics.mode)}</strong></div>
            <div className="metricCard"><span>Bot</span><strong>{settings.autoMode === "live" ? "Live armado" : "Paper"}</strong></div>
            <div className="metricCard"><span>Temperatura</span><strong>{formatDecimal(metrics.temperature, 0)}/100</strong></div>
            <div className="metricCard"><span>Bankroll</span><strong>{formatMoney(metrics.currentBankroll)}</strong></div>
          </div>
        </article>

        <article className="panel botHeatPanel">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Ritmo</p>
              <h3>Termometro del sistema</h3>
            </div>
            <span className={`tag ${metrics.temperature >= 65 ? "won" : metrics.temperature <= 42 ? "lost" : "pending"}`}>
              {temperatureLabel(metrics.temperature)}
            </span>
          </div>
          <div className="heatMeter">
            <div className="heatMeterFill" style={{ width: `${metrics.temperature}%` }} />
          </div>
          <p className="muted">Sube con ROI, hit-rate reciente y racha positiva. Baja con drawdown, rachas malas y exposicion pendiente.</p>
          <div className="metricGrid spacious">
            <div className="metricCard"><span>ROI</span><strong>{formatPercent(metrics.roi)}</strong></div>
            <div className="metricCard"><span>Hoy</span><strong>{formatMoney(metrics.today.profit)}</strong></div>
            <div className="metricCard"><span>Racha win</span><strong>{metrics.winStreak}</strong></div>
            <div className="metricCard"><span>Racha loss</span><strong>{metrics.lossStreak}</strong></div>
          </div>
        </article>
      </section>

      <section className="botMainGrid">
        <article className="panel stickyPanel">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Setup</p>
              <h3>Parametros operativos</h3>
            </div>
            {savedAt ? <span className="inlineNote">Guardado {new Date(savedAt).toLocaleTimeString("es-AR")}</span> : null}
          </div>

          <div className="buttonRow wrapGap">
            <button className="button secondary" type="button" onClick={() => applyMode("recovery")}>Recovery</button>
            <button className="button secondary" type="button" onClick={() => applyMode("balanced")}>Balance</button>
            <button className="button secondary" type="button" onClick={() => applyMode("attack")}>Attack</button>
          </div>

          <label className="field"><span>Bankroll inicial</span><input type="number" value={settings.bankrollStart} onChange={(event) => updateField("bankrollStart", Number(event.target.value))} /></label>
          <label className="field"><span>Presupuesto diario</span><input type="number" value={settings.dailyBudget} onChange={(event) => updateField("dailyBudget", Number(event.target.value))} /></label>
          <label className="field"><span>Stake base % bankroll</span><input type="number" step="0.1" value={settings.baseStakePct} onChange={(event) => updateField("baseStakePct", Number(event.target.value))} /></label>
          <label className="field"><span>Max apuestas por dia</span><input type="number" value={settings.maxBetsPerDay} onChange={(event) => updateField("maxBetsPerDay", Number(event.target.value))} /></label>
          <label className="field"><span>Cuota minima</span><input type="number" step="0.01" value={settings.minOdds} onChange={(event) => updateField("minOdds", Number(event.target.value))} /></label>
          <label className="field"><span>Cuota maxima</span><input type="number" step="0.01" value={settings.maxOdds} onChange={(event) => updateField("maxOdds", Number(event.target.value))} /></label>
          <label className="field"><span>Modo de bot</span>
            <select value={settings.autoMode} onChange={(event) => updateField("autoMode", event.target.value)}>
              <option value="paper">Paper</option>
              <option value="live">Live armado</option>
            </select>
          </label>
          <button className="button primary fullWidth" type="button" onClick={saveSettings}>Guardar setup</button>
        </article>

        <div className="stack">
          <section className="cardGrid cardGridWide botStatsGrid">
            <article className="metricCard botStat"><span>Profit neto</span><strong className={metrics.profit >= 0 ? "positiveText" : "warningText"}>{formatMoney(metrics.profit)}</strong></article>
            <article className="metricCard botStat"><span>Drawdown max</span><strong>{formatMoney(metrics.maxDrawdown)}</strong></article>
            <article className="metricCard botStat"><span>Stake prom.</span><strong>{formatMoney(metrics.avgStake)}</strong></article>
            <article className="metricCard botStat"><span>Cuota prom.</span><strong>{formatDecimal(metrics.avgOdds)}</strong></article>
            <article className="metricCard botStat"><span>Settled</span><strong>{metrics.settled}</strong></article>
            <article className="metricCard botStat"><span>Pending</span><strong>{metrics.pending}</strong></article>
          </section>

          <section className="panel">
            <div className="sectionHead">
              <div>
                <p className="eyebrow">Seguimiento</p>
                <h3>Ultimos 7 dias</h3>
              </div>
            </div>
            <div className="sparkBars">
              {metrics.last7Days.map((day) => {
                const size = Math.max(8, Math.min(100, Math.abs(day.profit) / Math.max(1, settings.dailyBudget) * 100));
                return (
                  <div className="sparkBarCol" key={day.key}>
                    <span>{day.label}</span>
                    <div className="sparkBarTrack">
                      <div className={`sparkBar ${day.profit >= 0 ? "up" : "down"}`} style={{ height: `${size}%` }} />
                    </div>
                    <strong className={day.profit >= 0 ? "positiveText" : "warningText"}>{formatMoney(day.profit)}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel botDecisionGrid">
            <article>
              <p className="eyebrow">Plan sugerido</p>
              <h3>{plan.label}</h3>
              <p className="muted">{plan.note}</p>
              <ul className="cleanList compactList">
                <li>Stake sugerido: {formatMoney(plan.stakeBand[0])} a {formatMoney(plan.stakeBand[1])}</li>
                <li>Franja de cuotas: {formatDecimal(plan.oddsBand[0])} a {formatDecimal(plan.oddsBand[1])}</li>
                <li>Meta diaria de recuperacion / captura: {formatMoney(plan.dailyTarget)}</li>
                <li>Volumen maximo: {settings.maxBetsPerDay} apuestas</li>
              </ul>
            </article>

            <article>
              <p className="eyebrow">Reglas duras</p>
              <ul className="cleanList compactList">
                <li>No subir stake por tilt: solo por temperatura y ROI.</li>
                <li>Si temperatura baja de 35, congelar modo live.</li>
                <li>Si drawdown supera 12% del bankroll, reset a recovery.</li>
                <li>Usar live solo con API oficial de ejecucion y limites por mercado.</li>
              </ul>
            </article>
          </section>
        </div>
      </section>
    </section>
  );
}

function temperatureLabel(value) {
  if (value >= 70) return "Caliente";
  if (value <= 40) return "Frio";
  return "Neutro";
}

function modeLabel(mode) {
  if (mode === "recovery") return "Recovery";
  if (mode === "attack") return "Attack";
  return "Balance";
}

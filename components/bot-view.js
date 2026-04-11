"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePortalFeed } from "@/components/use-portal-feed";
import { formatDecimal, formatMoney } from "@/lib/format";
import { buildAutoTickets, buildBotTickets, getBotMetrics } from "@/lib/bot-lab";

const STATE_KEY = "portal-deportivo-state";
const BOT_KEY = "portal-deportivo-bot";
const TICKETS_KEY = "portal-deportivo-bot-tickets";
const HIDDEN_STATUSES = ["executed", "won", "lost", "cancelled", "dismissed"];

const DEFAULT_SETTINGS = {
  bankrollStart: 150000,
  dailyBudget: 6000,
  baseStakePct: 1,
  maxBetsPerDay: 12,
  minOdds: 1.1,
  maxOdds: 1.8,
  autoMode: "paper",
  telegramAutoAlert: true,
  autoGenerateTickets: true,
  arbitrationEnabled: false
};

export function BotView() {
  const { matches } = usePortalFeed();
  const [bets, setBets] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedAt, setSavedAt] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [notifyState, setNotifyState] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const alertingRef = useRef(false);

  useEffect(() => {
    const rawState = window.localStorage.getItem(STATE_KEY);
    const rawBot = window.localStorage.getItem(BOT_KEY);
    const rawTickets = window.localStorage.getItem(TICKETS_KEY);

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

    if (rawTickets) {
      try {
        setTickets(JSON.parse(rawTickets));
      } catch {}
    }

    fetch("/api/notify")
      .then((response) => response.json())
      .then((data) => setTelegramConfigured(Boolean(data.telegramConfigured)))
      .catch(() => setTelegramConfigured(false))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(BOT_KEY, JSON.stringify(settings));
    setSavedAt(new Date().toISOString());
  }, [hydrated, settings]);

  const metrics = useMemo(() => getBotMetrics(bets, settings), [bets, settings]);
  const activeTickets = useMemo(() => tickets.filter((ticket) => !HIDDEN_STATUSES.includes(ticket.status)), [tickets]);
  const acceptedTickets = useMemo(() => tickets.filter((ticket) => ticket.status === "executed" || ticket.status === "won" || ticket.status === "lost"), [tickets]);

  useEffect(() => {
    if (!hydrated) return;

    setTickets((current) => {
      const generatedManual = buildBotTickets(bets, settings);
      const generatedAuto = settings.arbitrationEnabled && settings.autoGenerateTickets
        ? buildAutoTickets(matches, settings, current)
        : [];
      const currentMap = new Map(current.map((ticket) => [ticket.id, ticket]));
      const preservedHidden = current.filter((ticket) => HIDDEN_STATUSES.includes(ticket.status));
      const nextActive = [...generatedManual, ...generatedAuto].map((ticket) => {
        const existing = currentMap.get(ticket.id);
        if (!existing) return ticket;
        return {
          ...existing,
          ...ticket,
          status: existing.status,
          alertedAt: existing.alertedAt,
          executedAt: existing.executedAt,
          settledAt: existing.settledAt,
          dismissedAt: existing.dismissedAt,
          alertError: existing.alertError
        };
      });
      const hiddenWithoutDuplicate = preservedHidden.filter((ticket) => !nextActive.some((item) => item.id === ticket.id));
      const next = [...nextActive, ...hiddenWithoutDuplicate];
      window.localStorage.setItem(TICKETS_KEY, JSON.stringify(next));
      return next;
    });
  }, [bets, hydrated, matches, settings]);

  useEffect(() => {
    if (!settings.arbitrationEnabled) return;
    if (!telegramConfigured || !settings.telegramAutoAlert) return;
    if (settings.autoMode !== "semi-auto") return;
    if (alertingRef.current) return;

    const nextTicket = activeTickets.find((ticket) => shouldAutoAlert(ticket));
    if (!nextTicket) return;

    alertingRef.current = true;
    sendTicketAlert(nextTicket)
      .then(() => {
        updateTicket(nextTicket.id, { status: "alerted", alertedAt: new Date().toISOString() });
        setNotifyState(`Alerta automatica enviada para ${nextTicket.match}.`);
      })
      .catch((error) => {
        updateTicket(nextTicket.id, { alertError: error.message || "auto_alert_failed" });
        setNotifyState(`Error: ${error.message}`);
      })
      .finally(() => {
        alertingRef.current = false;
      });
  }, [activeTickets, settings.arbitrationEnabled, settings.autoMode, settings.telegramAutoAlert, telegramConfigured]);

  function updateField(key, value) {
    if (key === "arbitrationEnabled") {
      setSettings((current) => ({ ...current, arbitrationEnabled: value }));
      if (!value) {
        setTickets((current) => {
          const next = current.map((ticket) => {
            if (HIDDEN_STATUSES.includes(ticket.status)) return ticket;
            return { ...ticket, status: "dismissed", dismissedAt: new Date().toISOString() };
          });
          window.localStorage.setItem(TICKETS_KEY, JSON.stringify(next));
          return next;
        });
        setNotifyState("Bot apagado. Los tickets activos se retiraron de la cola.");
      }
      return;
    }

    setSettings((current) => ({ ...current, [key]: value }));
  }

  function saveSettings() {
    window.localStorage.setItem(BOT_KEY, JSON.stringify(settings));
    setSavedAt(new Date().toISOString());
    setNotifyState("Setup guardado en este navegador.");
  }

  function persistTickets(next) {
    setTickets(next);
    window.localStorage.setItem(TICKETS_KEY, JSON.stringify(next));
  }

  function updateTicket(ticketId, patch) {
    persistTickets(tickets.map((ticket) => (ticket.id === ticketId ? { ...ticket, ...patch } : ticket)));
  }

  function acceptTicket(ticketId) {
    updateTicket(ticketId, { status: "executed", executedAt: new Date().toISOString() });
  }

  function settleAcceptedTicket(ticketId, result) {
    const target = tickets.find((ticket) => ticket.id === ticketId);
    if (!target) return;

    const nextTickets = tickets.map((ticket) => ticket.id === ticketId ? { ...ticket, status: result, settledAt: new Date().toISOString() } : ticket);
    persistTickets(nextTickets);

    if (!target.betId) return;

    const nextBets = bets.map((bet) => bet.id === target.betId ? { ...bet, status: result } : bet);
    setBets(nextBets);

    const raw = window.localStorage.getItem(STATE_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(STATE_KEY, JSON.stringify({ ...saved, bets: nextBets }));
  }

  async function sendTestAlert() {
    setNotifyState("Enviando alerta de prueba...");
    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "test" })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "test_failed");
      setNotifyState("Alerta de prueba enviada.");
    } catch (error) {
      setNotifyState(`Error: ${error.message}`);
    }
  }

  async function sendTicketAlert(ticket) {
    const response = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ticket", ticket })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "ticket_notify_failed");
    return data;
  }

  async function alertTicket(ticket) {
    setNotifyState(`Enviando ticket ${ticket.match}...`);
    try {
      await sendTicketAlert(ticket);
      updateTicket(ticket.id, { status: "alerted", alertedAt: new Date().toISOString() });
      setNotifyState("Ticket enviado a Telegram.");
    } catch (error) {
      setNotifyState(`Error: ${error.message}`);
    }
  }

  const stakeUnit = Number(settings.bankrollStart || 0) * ((Number(settings.baseStakePct || 1) || 1) / 100);
  const autoCount = activeTickets.filter((ticket) => ticket.source === "auto").length;

  return (
    <section className="stack">
      <section className="botHeroGrid">
        <article className="panel botLeadPanel">
          <div className="rowSpread wrapGap">
            <div>
              <p className="eyebrow">Bot Lab</p>
              <h2>Orquestacion diaria y control de temperatura</h2>
            </div>
            <button
              className={`arbitrationToggle ${settings.arbitrationEnabled ? "on" : "off"}`}
              onClick={() => updateField("arbitrationEnabled", !settings.arbitrationEnabled)}
              type="button"
            >
              <span className="toggleLabel">Arbitraje</span>
              <span className="toggleState">{settings.arbitrationEnabled ? "Encendido" : "Apagado"}</span>
            </button>
          </div>
          <p className="lead compactLead">
            Esta mesa te deja medir bankroll, calor, drawdown y volumen. El bot te avisa cuando aparece un ticket operativo y vos decidís el click final y cada cierre.
          </p>
          <div className="metricGrid spacious">
            <div className="metricCard"><span>Bot</span><strong>{settings.autoMode === "semi-auto" ? "Semi-auto" : "Paper"}</strong></div>
            <div className="metricCard"><span>Temperatura</span><strong>{formatDecimal(metrics.temperature, 0)}/100</strong></div>
            <div className="metricCard"><span>Bankroll</span><strong>{formatMoney(metrics.currentBankroll)}</strong></div>
            <div className="metricCard"><span>Unidad base</span><strong>{formatMoney(stakeUnit)}</strong></div>
          </div>
        </article>

        <article className="panel botHeatPanel">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Alertas</p>
              <h3>Telegram y click humano</h3>
            </div>
            <span className={`tag ${telegramConfigured ? "won" : "pending"}`}>{telegramConfigured ? "Telegram listo" : "Telegram apagado"}</span>
          </div>
          <p className="muted">Si el arbitraje está encendido, el bot puede generar tickets automaticamente desde el feed y avisarte por Telegram sin que armes la apuesta antes.</p>
          <div className="buttonRow wrapGap">
            <button className="button secondary" type="button" onClick={sendTestAlert}>Probar alerta</button>
          </div>
          {notifyState ? <p className="inlineNote">{notifyState}</p> : null}
          <div className="metricGrid spacious">
            <div className="metricCard"><span>Arbitraje</span><strong>{settings.arbitrationEnabled ? "Encendido" : "Apagado"}</strong></div>
            <div className="metricCard"><span>Ofertas</span><strong>{activeTickets.length}</strong></div>
            <div className="metricCard"><span>Auto tickets</span><strong>{autoCount}</strong></div>
            <div className="metricCard"><span>Auto-alerta</span><strong>{settings.telegramAutoAlert ? "Activa" : "Off"}</strong></div>
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

          <label className="field"><span>Bankroll inicial</span><small className="fieldHelp">Capital base desde el que medís ganancias, pérdidas y drawdown.</small><input type="number" value={settings.bankrollStart} onChange={(event) => updateField("bankrollStart", Number(event.target.value))} /></label>
          <label className="field"><span>Presupuesto diario</span><small className="fieldHelp">Tope total que querés arriesgar por día.</small><input type="number" value={settings.dailyBudget} onChange={(event) => updateField("dailyBudget", Number(event.target.value))} /></label>
          <label className="field"><span>Stake base % bankroll</span><small className="fieldHelp">Porcentaje del bankroll que define tu unidad base. Si bankroll es 100.000 y ponés 1, la unidad base es 1.000.</small><input type="number" step="0.1" value={settings.baseStakePct} onChange={(event) => updateField("baseStakePct", Number(event.target.value))} /></label>
          <label className="field"><span>Max apuestas por dia</span><small className="fieldHelp">Cantidad máxima de tickets activos que el bot puede dejarte en cola por día.</small><input type="number" value={settings.maxBetsPerDay} onChange={(event) => updateField("maxBetsPerDay", Number(event.target.value))} /></label>
          <label className="field"><span>Cuota minima</span><small className="fieldHelp">Límite inferior de cuota que aceptás operar.</small><input type="number" step="0.01" value={settings.minOdds} onChange={(event) => updateField("minOdds", Number(event.target.value))} /></label>
          <label className="field"><span>Cuota maxima</span><small className="fieldHelp">Límite superior de cuota que aceptás operar.</small><input type="number" step="0.01" value={settings.maxOdds} onChange={(event) => updateField("maxOdds", Number(event.target.value))} /></label>
          <label className="field"><span>Modo de bot</span><small className="fieldHelp">Paper no alerta ni simula ejecución real. Semi-auto manda alertas y deja el click final en vos.</small>
            <select value={settings.autoMode} onChange={(event) => updateField("autoMode", event.target.value)}>
              <option value="paper">Paper</option>
              <option value="semi-auto">Semi-auto</option>
            </select>
          </label>
          <label className="checkboxRow"><input type="checkbox" checked={settings.autoGenerateTickets} onChange={(event) => updateField("autoGenerateTickets", event.target.checked)} /><span>Generar tickets automaticos desde el feed</span></label>
          <label className="checkboxRow"><input type="checkbox" checked={settings.telegramAutoAlert} onChange={(event) => updateField("telegramAutoAlert", event.target.checked)} /><span>Enviar alertas automaticas por Telegram</span></label>
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
                <p className="eyebrow">Ofertas</p>
                <h3>Cola disponible para evaluar</h3>
              </div>
            </div>
            <div className="stack compact">
              {activeTickets.length ? activeTickets.map((ticket) => (
                <article className="historyCard" key={ticket.id}>
                  <div className="rowSpread cardTopGap wrapGap">
                    <div>
                      <h3>{ticket.match}</h3>
                      <p className="muted"><strong>Mercado:</strong> {ticket.market}</p>
                      <p className="muted">{ticket.marketSummary}</p>
                      <p className="muted">{ticket.marketExplanation}</p>
                    </div>
                    <span className={`tag ${tagClass(ticket.status)}`}>{ticketLabel(ticket.status)}</span>
                  </div>
                  <div className="metricGrid spacious">
                    <div className="metricCard"><span>Stake sugerido</span><strong>{formatMoney(ticket.stake)}</strong></div>
                    <div className="metricCard"><span>Cuota actual</span><strong>{formatDecimal(ticket.odds)}</strong></div>
                    <div className="metricCard"><span>Tipo de ticket</span><strong>{ticket.source === "auto" ? "Automatico" : "Manual"}</strong></div>
                    <div className="metricCard"><span>Por que entro</span><strong>{ticket.note}</strong></div>
                  </div>
                  <div className="buttonRow wrapGap">
                    <button className="button success" type="button" onClick={() => acceptTicket(ticket.id)}>Aceptar</button>
                    <button className="button secondary" type="button" onClick={() => alertTicket(ticket)} disabled={!telegramConfigured}>Reenviar alerta</button>
                    <button className="button danger" type="button" onClick={() => updateTicket(ticket.id, { status: "cancelled" })}>Rechazar</button>
                  </div>
                </article>
              )) : <p className="muted">No hay ofertas activas. Si el arbitraje está encendido y el feed trae picks aptos, van a aparecer solos acá.</p>}
            </div>
          </section>

          <section className="panel">
            <div className="sectionHead">
              <div>
                <p className="eyebrow">Tickets aceptados</p>
                <h3>Cierre manual</h3>
              </div>
            </div>
            <div className="stack compact">
              {acceptedTickets.length ? acceptedTickets.map((ticket) => (
                <article className="historyCard" key={ticket.id}>
                  <div className="rowSpread cardTopGap wrapGap">
                    <div>
                      <h3>{ticket.match}</h3>
                      <p className="muted"><strong>Mercado:</strong> {ticket.market}</p>
                      <p className="muted">{ticket.marketSummary}</p>
                      <p className="muted">{ticket.marketExplanation}</p>
                    </div>
                    <span className={`tag ${tagClass(ticket.status)}`}>{ticketLabel(ticket.status)}</span>
                  </div>
                  <div className="metricGrid spacious">
                    <div className="metricCard"><span>Stake</span><strong>{formatMoney(ticket.stake)}</strong></div>
                    <div className="metricCard"><span>Cuota</span><strong>{formatDecimal(ticket.odds)}</strong></div>
                    <div className="metricCard"><span>Alerta</span><strong>{ticket.alertedAt ? "Enviada" : "No"}</strong></div>
                    <div className="metricCard"><span>Aceptada</span><strong>{ticket.executedAt ? "Si" : "Pendiente"}</strong></div>
                  </div>
                  <div className="buttonRow wrapGap">
                    <button className="button success" type="button" onClick={() => settleAcceptedTicket(ticket.id, "won")}>Ganada</button>
                    <button className="button danger" type="button" onClick={() => settleAcceptedTicket(ticket.id, "lost")}>Perdida</button>
                  </div>
                </article>
              )) : <p className="muted">Cuando aceptes una oferta, pasa a esta lista para marcarla luego como ganada o perdida.</p>}
            </div>
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
        </div>
      </section>
    </section>
  );
}

function shouldAutoAlert(ticket) {
  return (ticket.status === "suggested" || ticket.status === "approved") && !ticket.alertedAt && ticket.status !== "cancelled";
}

function ticketLabel(status) {
  if (status === "approved") return "Aprobada";
  if (status === "alerted") return "Alertada";
  if (status === "executed") return "Aceptada";
  if (status === "won") return "Ganada";
  if (status === "lost") return "Perdida";
  if (status === "cancelled") return "Rechazada";
  if (status === "dismissed") return "Retirada";
  return "Sugerida";
}

function tagClass(status) {
  if (status === "executed" || status === "alerted" || status === "won") return "won";
  if (status === "cancelled" || status === "lost" || status === "dismissed") return "lost";
  return "pending";
}

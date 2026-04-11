"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortalFeed } from "@/components/use-portal-feed";
import { formatDecimal, formatKickoff, formatMoney, formatPercent } from "@/lib/format";
import { buildStrategyReport } from "@/lib/strategy-report";

const STATE_KEY = "portal-deportivo-state";
const STATE_EVENT = "portal-state-sync";
const STARTERS = [
  "Mira el informe filtrado y decime tres cambios concretos para mañana.",
  "Que liga o mercado deberia bajar de volumen ya mismo?",
  "Como ajustar stake y rango de cuotas sin subir demasiado el riesgo?"
];

export function StrategyCoachView() {
  const { matches, meta } = usePortalFeed();
  const [bets, setBets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(() => buildDefaultFilters());
  const [input, setInput] = useState(STARTERS[0]);

  useEffect(() => {
    function syncBets() {
      const raw = window.localStorage.getItem(STATE_KEY);
      if (!raw) {
        setBets([]);
        return;
      }
      try {
        const saved = JSON.parse(raw);
        setBets(saved.bets ?? []);
      } catch {
        setBets([]);
      }
    }

    syncBets();
    window.addEventListener("storage", syncBets);
    window.addEventListener(STATE_EVENT, syncBets);
    return () => {
      window.removeEventListener("storage", syncBets);
      window.removeEventListener(STATE_EVENT, syncBets);
    };
  }, []);

  const competitionOptions = useMemo(() => {
    const values = new Set();
    for (const bet of bets) {
      for (const pick of bet.picks ?? []) values.add(pick.competition || "Sin liga");
    }
    for (const match of matches) values.add(match.competition);
    return ["all", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [bets, matches]);

  const report = useMemo(() => buildStrategyReport({ bets, matches, filters }), [bets, matches, filters]);
  const topOpportunities = report.liveSummary.topOpportunities ?? [];

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyQuickRange(days) {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));
    setFilters((current) => ({
      ...current,
      startDate: start.toISOString().slice(0, 10),
      endDate: end
    }));
  }

  async function sendMessage(customMessage) {
    const content = (customMessage ?? input).trim();
    if (!content) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    setError("");

    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, report, history: nextMessages })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "coach_error");
      setPending(false);
      return;
    }

    setMessages((current) => [...current, { role: "assistant", content: payload.reply }]);
    setPending(false);
  }

  return (
    <section className="contentGrid analystGrid coachGrid">
      <aside className="panel stickyPanel coachSide">
        <h2>Director tecnico</h2>
        <div className="feedStatusCard">
          <strong>Informe activo</strong>
          <span>{report.overview.settled} cierres | {report.overview.pending} pendientes</span>
        </div>
        <label className="field">
          <span>Desde</span>
          <input type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} />
        </label>
        <label className="field">
          <span>Hasta</span>
          <input type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} />
        </label>
        <label className="field">
          <span>Competicion</span>
          <select value={filters.competition} onChange={(event) => updateFilter("competition", event.target.value)}>
            {competitionOptions.map((option) => <option key={option} value={option}>{option === "all" ? "Todas" : option}</option>)}
          </select>
        </label>
        <div className="buttonRow wrapGap coachQuickButtons">
          <button className="button secondary" onClick={() => applyQuickRange(1)} type="button">Hoy</button>
          <button className="button secondary" onClick={() => applyQuickRange(7)} type="button">7 dias</button>
          <button className="button secondary" onClick={() => applyQuickRange(30)} type="button">30 dias</button>
        </div>
        <div className="selectedBox analystFacts">
          <strong>Resumen rapido</strong>
          <span>ROI {formatPercent(report.overview.roi)}</span>
          <span>Acierto {formatPercent(report.overview.hitRate)}</span>
          <span>Profit {formatMoney(report.overview.profit)}</span>
          <span>Feed {meta.source === "live" ? "en vivo" : meta.source}</span>
        </div>
        <div className="starterStack">
          {STARTERS.map((starter) => (
            <button key={starter} className="button secondary fullWidth" onClick={() => setInput(starter)} type="button">{starter}</button>
          ))}
        </div>
      </aside>

      <div className="stack">
        <section className="cardGrid cardGridWide coachOverviewGrid">
          <article className="metricCard"><span>Settled</span><strong>{report.overview.settled}</strong></article>
          <article className="metricCard"><span>% acierto</span><strong>{formatPercent(report.overview.hitRate)}</strong></article>
          <article className="metricCard"><span>ROI</span><strong>{formatPercent(report.overview.roi)}</strong></article>
          <article className="metricCard"><span>Profit</span><strong className={report.overview.profit >= 0 ? "positiveText" : "warningText"}>{formatMoney(report.overview.profit)}</strong></article>
          <article className="metricCard"><span>Cuota prom.</span><strong>{formatDecimal(report.overview.avgOdds)}</strong></article>
          <article className="metricCard"><span>Stake prom.</span><strong>{formatMoney(report.overview.avgStake)}</strong></article>
        </section>

        <section className="coachReportGrid">
          <article className="panel">
            <div className="sectionHead"><div><p className="eyebrow">Ligas</p><h3>Rendimiento por segmento</h3></div></div>
            <div className="stack compact">
              {report.leagues.length ? report.leagues.map((league) => (
                <div className="historyCard compactCard" key={league.label}>
                  <div className="rowSpread wrapGap">
                    <strong>{league.label}</strong>
                    <span className={`tag ${league.profit >= 0 ? "won" : "lost"}`}>{formatPercent(league.roi)}</span>
                  </div>
                  <p className="muted">{league.settled} cierres | acierto {formatPercent(league.hitRate)} | profit {formatMoney(league.profit)}</p>
                </div>
              )) : <p className="muted">Todavia no hay muestra en ese filtro.</p>}
            </div>
          </article>

          <article className="panel">
            <div className="sectionHead"><div><p className="eyebrow">Mercados</p><h3>Que viene funcionando</h3></div></div>
            <div className="stack compact">
              {report.markets.length ? report.markets.map((market) => (
                <div className="historyCard compactCard" key={market.label}>
                  <div className="rowSpread wrapGap">
                    <strong>{market.label}</strong>
                    <span className={`tag ${market.profit >= 0 ? "won" : "lost"}`}>{formatPercent(market.roi)}</span>
                  </div>
                  <p className="muted">{market.settled} cierres | acierto {formatPercent(market.hitRate)} | profit {formatMoney(market.profit)}</p>
                </div>
              )) : <p className="muted">Todavia no hay muestra en ese filtro.</p>}
            </div>
          </article>
        </section>

        <section className="coachReportGrid">
          <article className="panel">
            <div className="sectionHead"><div><p className="eyebrow">Cuotas</p><h3>Bandas de riesgo</h3></div></div>
            <div className="stack compact">
              {report.oddsBands.map((band) => (
                <div className="historyCard compactCard" key={band.label}>
                  <div className="rowSpread wrapGap">
                    <strong>{band.label}</strong>
                    <span className={`tag ${band.profit >= 0 ? "won" : "lost"}`}>{formatPercent(band.roi)}</span>
                  </div>
                  <p className="muted">{band.settled} cierres | acierto {formatPercent(band.hitRate)} | profit {formatMoney(band.profit)}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="sectionHead"><div><p className="eyebrow">Dia de hoy</p><h3>Lo que el DT ve en el feed</h3></div></div>
            <div className="stack compact">
              <div className="selectedBox">
                <strong>{report.liveSummary.activeMatches} partidos activos en feed</strong>
                <span>{report.liveSummary.competitions.map((item) => `${item.label} (${item.count})`).join(" • ") || "Sin competiciones destacadas"}</span>
              </div>
              {topOpportunities.length ? topOpportunities.map((item) => (
                <div className="historyCard compactCard" key={`${item.match}-${item.market}`}>
                  <strong>{item.match}</strong>
                  <p className="muted">{item.competition}</p>
                  <p className="muted">{item.market} | cuota {formatDecimal(item.price)} | edge {formatPercent(item.edge)} | conf. {formatPercent(item.confidence)}</p>
                </div>
              )) : <p className="muted">No hay oportunidades top bajo este filtro.</p>}
            </div>
          </article>
        </section>

        <section className="panel analystPanel">
          <div className="sectionHead"><div><p className="eyebrow">Director tecnico</p><h2>Chat de estrategia</h2></div></div>
          <p className="muted analystHint">Acá no se manda todo el historial crudo. Solo el informe resumido del filtro actual, para bajar consumo de tokens y mantener foco estratégico.</p>
          {error ? <p className="warningText">{error}</p> : null}
          <div className="chatList">
            {messages.length ? messages.map((message, index) => (
              <article className={`chatBubble ${message.role}`} key={`${message.role}-${index}`}>
                <span className="chatRole">{message.role === "assistant" ? "Director tecnico" : "Vos"}</span>
                <p>{message.content}</p>
              </article>
            )) : <p className="muted">Pedile cambios de estrategia, ajuste de stake, ligas a bajar o mercados a testear con el informe actual.</p>}
            {pending ? <article className="chatBubble assistant"><span className="chatRole">Director tecnico</span><p>Pensando...</p></article> : null}
          </div>
          <div className="chatComposer">
            <label className="field chatField">
              <span>Consulta libre</span>
              <textarea className="chatInput" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ejemplo: viendo los ultimos 7 dias, debo bajar Premier League y subir Argentina, o solo ajustar stakes?" rows={5} />
            </label>
            <div className="buttonRow analystActions">
              <button className="button secondary" onClick={() => setInput("")} type="button">Limpiar</button>
              <button className="button primary analystSendButton" disabled={pending || !input.trim()} onClick={() => sendMessage()} type="button">Preguntar al DT</button>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function buildDefaultFilters() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    competition: "all"
  };
}

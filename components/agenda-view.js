"use client";

import { useMemo, useState } from "react";
import { formatPercent, formatSignedPercent, formatStatus } from "@/lib/format";
import { getMatches } from "@/lib/portal-core";

const allMatches = getMatches();

export function AgendaView() {
  const [competition, setCompetition] = useState("all");
  const [sport, setSport] = useState("all");
  const [status, setStatus] = useState("all");
  const [valueOnly, setValueOnly] = useState(false);

  const competitions = useMemo(
    () => ["all", ...new Set(allMatches.map((match) => match.competition))],
    []
  );
  const sports = useMemo(
    () => ["all", ...new Set(allMatches.map((match) => match.sport))],
    []
  );

  const filteredMatches = useMemo(() => {
    return allMatches
      .filter((match) => competition === "all" || match.competition === competition)
      .filter((match) => sport === "all" || match.sport === sport)
      .filter((match) => status === "all" || match.status === status)
      .map((match) => ({
        ...match,
        odds: match.odds.filter((pick) => !valueOnly || pick.edge > 0)
      }))
      .filter((match) => match.odds.length > 0);
  }, [competition, sport, status, valueOnly]);

  const featuredPicks = useMemo(() => {
    return filteredMatches
      .flatMap((match) => match.odds)
      .sort((a, b) => b.edge - a.edge)
      .slice(0, 6);
  }, [filteredMatches]);

  return (
    <section className="contentGrid">
      <aside className="panel stickyPanel">
        <h2>Filtros</h2>
        <label className="field">
          <span>Competicion</span>
          <select value={competition} onChange={(event) => setCompetition(event.target.value)}>
            {competitions.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Todas" : item}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Deporte</span>
          <select value={sport} onChange={(event) => setSport(event.target.value)}>
            {sports.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Todos" : item}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Estado</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Todos</option>
            <option value="live">En vivo</option>
            <option value="upcoming">Proximos</option>
          </select>
        </label>
        <label className="checkboxRow">
          <input
            checked={valueOnly}
            onChange={(event) => setValueOnly(event.target.checked)}
            type="checkbox"
          />
          <span>Solo picks con valor positivo</span>
        </label>
      </aside>

      <div className="stack">
        <section className="panel">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Radar</p>
              <h2>Selecciones destacadas</h2>
            </div>
          </div>
          <div className="cardGrid">
            {featuredPicks.map((pick) => (
              <article className="pickCard" key={pick.id}>
                <div className="rowSpread">
                  <span className="tag">{pick.competition}</span>
                  <span className={`edge ${pick.edge > 0 ? "positive" : ""}`}>
                    {formatSignedPercent(pick.edge)}
                  </span>
                </div>
                <h3>{pick.market}</h3>
                <p className="muted">{pick.home} vs {pick.away}</p>
                <div className="metricGrid">
                  <div>
                    <span>Cuota</span>
                    <strong>{pick.price.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>Modelo</span>
                    <strong>{formatPercent(pick.adjustedProbability)}</strong>
                  </div>
                  <div>
                    <span>Estado</span>
                    <strong>{formatStatus(pick.status)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Agenda</p>
              <h2>Partidos por competencia</h2>
            </div>
          </div>
          <div className="stack compact">
            {filteredMatches.map((match) => (
              <article className="matchCard" key={match.id}>
                <div className="rowSpread">
                  <div>
                    <div className="rowCompact">
                      <span className="tag">{match.competition}</span>
                      <span className="tag subtle">{formatStatus(match.status)}</span>
                    </div>
                    <h3>{match.home} vs {match.away}</h3>
                    <p className="muted">{match.kickoff} • {match.venue} • {match.sport}</p>
                  </div>
                  <strong className="score">{match.score}</strong>
                </div>
                <div className="oddsGrid">
                  {match.odds.map((pick) => (
                    <div className="oddBox" key={pick.id}>
                      <strong>{pick.market}</strong>
                      <span>Cuota {pick.price.toFixed(2)}</span>
                      <span>Prob. modelo {formatPercent(pick.adjustedProbability)}</span>
                      <span className={pick.edge > 0 ? "positiveText" : ""}>
                        Edge {formatSignedPercent(pick.edge)}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

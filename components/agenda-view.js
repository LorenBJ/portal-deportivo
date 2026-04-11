"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildMatchInsight } from "@/lib/portal-core";
import { formatKickoff, formatPercent, formatSignedPercent, formatStatus, formatTimestamp } from "@/lib/format";
import { usePortalFeed } from "@/components/use-portal-feed";

const AGENDA_FILTERS_KEY = "portal-deportivo-agenda-filters";
const PRIORITY_COMPETITIONS = [
  "Liga Profesional Argentina",
  "Brasileirao Serie A",
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "UEFA Champions League",
  "UEFA Europa League",
  "Copa Libertadores",
  "Copa Sudamericana"
];

export function AgendaView() {
  const { matches, meta, isLoading, error } = usePortalFeed();
  const [competition, setCompetition] = useState("all");
  const [status, setStatus] = useState("all");
  const [valueOnly, setValueOnly] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const providerIssue = getProviderIssue(meta);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AGENDA_FILTERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCompetition(parsed.competition ?? "all");
        setStatus(parsed.status ?? "all");
        setValueOnly(parsed.valueOnly ?? true);
        setSelectedMatchId(parsed.selectedMatchId ?? "");
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(AGENDA_FILTERS_KEY, JSON.stringify({ competition, status, valueOnly, selectedMatchId }));
  }, [competition, hydrated, selectedMatchId, status, valueOnly]);

  const competitions = useMemo(() => {
    const dynamic = new Set(matches.map((match) => match.competition).filter(Boolean));
    const ordered = PRIORITY_COMPETITIONS.filter((item) => dynamic.has(item));
    const extras = Array.from(dynamic).filter((item) => !PRIORITY_COMPETITIONS.includes(item)).sort((a, b) => a.localeCompare(b));
    const missingPriority = PRIORITY_COMPETITIONS.filter((item) => !dynamic.has(item));
    return ["all", ...ordered, ...extras, ...missingPriority];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches
      .filter((match) => competition === "all" || match.competition === competition)
      .filter((match) => status === "all" || match.status === status)
      .map((match) => ({
        ...match,
        odds: match.odds.filter((pick) => (!valueOnly || pick.recommended) && pick.edge > -0.02)
      }))
      .filter((match) => match.odds.length > 0);
  }, [competition, matches, status, valueOnly]);

  const featuredPicks = useMemo(() => {
    return filteredMatches
      .flatMap((match) => match.odds)
      .filter((pick) => pick.recommended)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 6);
  }, [filteredMatches]);

  const todayMatches = useMemo(() => {
    return filteredMatches.filter((match) => match.status === "live" || match.status === "upcoming");
  }, [filteredMatches]);

  const selectedMatch = useMemo(() => {
    return todayMatches.find((match) => match.id === selectedMatchId) ?? todayMatches[0] ?? null;
  }, [selectedMatchId, todayMatches]);

  const selectedInsight = useMemo(() => {
    return selectedMatch ? buildMatchInsight(selectedMatch) : null;
  }, [selectedMatch]);

  return (
    <section className="contentGrid">
      <aside className="panel stickyPanel">
        <h2>Filtros</h2>
        <div className="feedStatusCard">
          <strong>{meta.source === "live" ? "Datos reales" : meta.source === "error" ? "Provider con error" : "Modo demo"}</strong>
          <span>
            {meta.source === "live"
              ? `Actualizado ${formatTimestamp(meta.generatedAt)}`
              : providerIssue ?? "Sin clave o fallback activo."}
          </span>
        </div>
        <label className="field">
          <span>Competicion</span>
          <select value={competition} onChange={(event) => setCompetition(event.target.value)}>
            {competitions.map((item) => <option key={item} value={item}>{item === "all" ? "Todas" : item}</option>)}
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
          <input checked={valueOnly} onChange={(event) => setValueOnly(event.target.checked)} type="checkbox" />
          <span>Solo recomendaciones aptas</span>
        </label>
      </aside>

      <div className="stack">
        {error ? <p className="panel warningText">Feed: {error}</p> : null}
        {isLoading ? <p className="panel muted">Cargando...</p> : null}
        {meta.source === "error" ? (
          <section className="panel issuePanel">
            <p className="eyebrow">Estado del feed</p>
            <h2>No estan entrando datos reales.</h2>
            <p className="muted">{providerIssue ?? "La credencial o el plan del proveedor esta rechazando las requests."}</p>
            {meta.errors?.[0] ? <p className="muted">Detalle: {meta.errors[0]}</p> : null}
          </section>
        ) : null}

        <section className="panel">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Cabina diaria</p>
              <h2>Partidos del dia y mesa de decision</h2>
            </div>
          </div>
          <div className="agendaBoard">
            <div className="agendaLane">
              <div className="laneHeader">
                <p className="eyebrow">Jornada</p>
                <strong>{todayMatches.length} partidos visibles</strong>
              </div>
              <div className="stack compact">
                {todayMatches.map((match) => {
                  const recommendedCount = match.odds.filter((pick) => pick.recommended).length;
                  const visiblePicks = match.odds
                    .sort((a, b) => b.recommendationScore - a.recommendationScore)
                    .slice(0, 4);

                  return (
                    <button
                      className={`matchCard cockpitCard matchSelectButton${selectedMatch?.id === match.id ? " active" : ""}`}
                      key={match.id}
                      onClick={() => setSelectedMatchId(match.id)}
                      type="button"
                    >
                      <div className="rowSpread cardTopGap">
                        <div>
                          <div className="rowCompact wrapGap">
                            <span className="tag">{match.competition}</span>
                            <span className="tag subtle">{formatStatus(match.status)}</span>
                          </div>
                          <h3>{match.home} vs {match.away}</h3>
                          <p className="muted">{formatKickoff(match.kickoff)} | {match.venue}</p>
                        </div>
                        <strong className="score">{match.score}</strong>
                      </div>
                      <div className="metricGrid spacious">
                        <div className="metricCard compactMetric">
                          <span>Favorito segun modelo</span>
                          <strong>{match.homeRating >= match.awayRating ? match.home : match.away}</strong>
                        </div>
                        <div className="metricCard compactMetric">
                          <span>Paridad del partido</span>
                          <strong>{Math.abs(match.homeRating - match.awayRating) <= 45 ? "Alta" : Math.abs(match.homeRating - match.awayRating) <= 120 ? "Media" : "Baja"}</strong>
                        </div>
                        <div className="metricCard compactMetric">
                          <span>Mercados con valor</span>
                          <strong>{recommendedCount}</strong>
                        </div>
                      </div>
                      <div className="oddsGrid">
                        {visiblePicks.map((pick) => (
                          <div className="oddBox agendaOddBox" key={pick.id}>
                            <strong>{pick.market}</strong>
                            <div className="oddMetaList">
                              <span><b>Cuota:</b> {pick.price.toFixed(2)}</span>
                              <span><b>Prob. modelo:</b> {formatPercent(pick.adjustedProbability)}</span>
                              <span><b>Confianza:</b> {formatPercent(pick.confidence)}</span>
                              <span className={pick.recommended ? "positiveText" : "muted"}><b>Lectura:</b> {pick.recommended ? "Apta" : "Cauta"} | Edge {formatSignedPercent(pick.edge)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="agendaLane side">
              <div className="laneHeader">
                <p className="eyebrow">Foco</p>
                <strong>{selectedMatch ? `${selectedMatch.home} vs ${selectedMatch.away}` : "Sin partido"}</strong>
              </div>
              {selectedMatch && selectedInsight ? (
                <div className="stack compact">
                  <article className="panel focusPanel">
                    <div className="rowSpread wrapGap">
                      <div>
                        <span className="tag">{selectedMatch.competition}</span>
                        <h3 className="focusTitle">{selectedMatch.home} vs {selectedMatch.away}</h3>
                        <p className="muted">{formatKickoff(selectedMatch.kickoff)} | {selectedMatch.venue}</p>
                      </div>
                      <strong className="score">{selectedMatch.score}</strong>
                    </div>
                    <div className="metricGrid">
                      <div className="metricCard">
                        <span>Favorito del modelo</span>
                        <strong>{selectedInsight.favorite}</strong>
                      </div>
                      <div className="metricCard">
                        <span>Paridad estimada</span>
                        <strong>{selectedInsight.parity}</strong>
                      </div>
                      <div className="metricCard">
                        <span>Ritmo base esperado</span>
                        <strong>{selectedInsight.tempo}</strong>
                      </div>
                      <div className="metricCard">
                        <span>Mejor mercado detectado</span>
                        <strong>{selectedInsight.bestPick?.market ?? "Sin señal"}</strong>
                      </div>
                    </div>
                    <p className="muted focusSummary">{selectedInsight.summary}</p>
                    <div className="buttonRow">
                      <Link className="button primary" href={`/analista?match=${selectedMatch.id}&prompt=${encodeURIComponent(selectedInsight.analystPrompt)}`}>Enviar al analista</Link>
                      <Link className="button secondary" href="/combinador">Abrir combinador</Link>
                    </div>
                  </article>

                  <article className="panel">
                    <div className="sectionHead">
                      <div>
                        <p className="eyebrow">Mercados</p>
                        <h3>Radar del partido</h3>
                      </div>
                    </div>
                    <div className="stack compact">
                      {selectedInsight.recommended.slice(0, 3).map((pick) => (
                        <div className="oddBox agendaOddBox" key={pick.id}>
                          <strong>{pick.market}</strong>
                          <div className="oddMetaList">
                            <span><b>Cuota:</b> {pick.price.toFixed(2)}</span>
                            <span><b>Confianza:</b> {formatPercent(pick.confidence)}</span>
                            <span className="positiveText"><b>Lectura:</b> Apta | Edge {formatSignedPercent(pick.edge)}</span>
                          </div>
                        </div>
                      ))}
                      {!selectedInsight.recommended.length ? <p className="muted">Sin picks aptos en este partido.</p> : null}
                      {selectedInsight.watchlist.length ? <p className="muted">Mercados a vigilar</p> : null}
                      {selectedInsight.watchlist.map((pick) => (
                        <div className="oddBox agendaOddBox watchBox" key={pick.id}>
                          <strong>{pick.market}</strong>
                          <div className="oddMetaList">
                            <span><b>Cuota:</b> {pick.price.toFixed(2)}</span>
                            <span><b>Confianza:</b> {formatPercent(pick.confidence)}</span>
                            <span className="muted"><b>Lectura:</b> Cauta | Edge {formatSignedPercent(pick.edge)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="panel">
                    <div className="sectionHead">
                      <div>
                        <p className="eyebrow">Stats Layer</p>
                        <h3>Bloque listo para ultimos 5</h3>
                      </div>
                    </div>
                    <p className="muted">
                      Aca voy a conectar el proveedor de estadisticas reales para mostrar corners, tarjetas, tiros, tiros al arco, saques de arco y laterales por equipo.
                    </p>
                    <div className="statsPlaceholderGrid">
                      {['Corners', 'Tarjetas', 'Tiros', 'Tiros al arco', 'Saques de arco', 'Laterales'].map((label) => (
                        <div className="metricCard placeholderStat" key={label}>
                          <span>{label}</span>
                          <strong>Pendiente de feed</strong>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="panel">
                    <div className="sectionHead">
                      <div>
                        <p className="eyebrow">Top del dia</p>
                        <h3>Oportunidades globales</h3>
                      </div>
                    </div>
                    <div className="stack compact">
                      {featuredPicks.map((pick) => (
                        <article className="pickCard radarCard" key={pick.id}>
                          <div className="rowSpread">
                            <span className="tag">{pick.competition}</span>
                            <span className={`edge ${pick.recommended ? "positive" : ""}`}>{formatSignedPercent(pick.edge)}</span>
                          </div>
                          <h3>{pick.market}</h3>
                          <p className="muted">{pick.home} vs {pick.away}</p>
                          <div className="metricGrid">
                            <div><span>Cuota</span><strong>{pick.price.toFixed(2)}</strong></div>
                            <div><span>Prob. modelo</span><strong>{formatPercent(pick.adjustedProbability)}</strong></div>
                            <div><span>Confianza</span><strong>{formatPercent(pick.confidence)}</strong></div>
                            <div><span>Riesgo</span><strong>{pick.riskTier}</strong></div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </article>
                </div>
              ) : (
                <p className="muted">Sin partidos para mostrar.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function getProviderIssue(meta) {
  if (meta.source !== "error") return "";
  const firstError = meta.errors?.[0] ?? "";
  if (firstError.includes(":401")) return "La API_FOOTBALL_KEY fue rechazada por el proveedor.";
  if (firstError.includes(":429")) return "El proveedor rechazo requests por limite o credito.";
  if (meta.reason === "all_leagues_failed") return "Todas las ligas fallaron en el proveedor.";
  return "El proveedor no devolvio partidos utilizables.";
}

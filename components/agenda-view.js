"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildMatchInsight } from "@/lib/portal-core";
import { formatKickoff, formatPercent, formatSignedPercent, formatStatus, formatTimestamp } from "@/lib/format";
import { usePortalFeed } from "@/components/use-portal-feed";

export function AgendaView() {
  const [competition, setCompetition] = useState("all");
  const [sport, setSport] = useState("all");
  const [status, setStatus] = useState("all");
  const [valueOnly, setValueOnly] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const { matches, meta, isLoading, error } = usePortalFeed();
  const providerIssue = getProviderIssue(meta);

  const competitions = useMemo(() => ["all", ...new Set(matches.map((match) => match.competition))], [matches]);
  const sports = useMemo(() => ["all", ...new Set(matches.map((match) => match.sport))], [matches]);

  const filteredMatches = useMemo(() => {
    return matches
      .filter((match) => competition === "all" || match.competition === competition)
      .filter((match) => sport === "all" || match.sport === sport)
      .filter((match) => status === "all" || match.status === status)
      .map((match) => ({
        ...match,
        odds: match.odds.filter((pick) => (!valueOnly || pick.recommended) && pick.edge > -0.02)
      }))
      .filter((match) => match.odds.length > 0);
  }, [competition, matches, sport, status, valueOnly]);

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
          <span>Deporte</span>
          <select value={sport} onChange={(event) => setSport(event.target.value)}>
            {sports.map((item) => <option key={item} value={item}>{item === "all" ? "Todos" : item}</option>)}
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
                {todayMatches.map((match) => (
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
                        <span>Favorito modelo</span>
                        <strong>{match.homeRating >= match.awayRating ? match.home : match.away}</strong>
                      </div>
                      <div className="metricCard compactMetric">
                        <span>Paridad</span>
                        <strong>{Math.abs(match.homeRating - match.awayRating) <= 45 ? "Alta" : Math.abs(match.homeRating - match.awayRating) <= 120 ? "Media" : "Baja"}</strong>
                      </div>
                      <div className="metricCard compactMetric">
                        <span>Picks aptos</span>
                        <strong>{match.odds.filter((pick) => pick.recommended).length}</strong>
                      </div>
                    </div>
                    <div className="oddsGrid">
                      {match.odds
                        .sort((a, b) => b.recommendationScore - a.recommendationScore)
                        .slice(0, 4)
                        .map((pick) => (
                          <div className="oddBox" key={pick.id}>
                            <strong>{pick.market}</strong>
                            <span>Cuota {pick.price.toFixed(2)}</span>
                            <span>Prob. {formatPercent(pick.adjustedProbability)}</span>
                            <span>Conf. {formatPercent(pick.confidence)}</span>
                            <span className={pick.recommended ? "positiveText" : "muted"}>{pick.recommended ? "Apta" : "Cauta"} | Edge {formatSignedPercent(pick.edge)}</span>
                          </div>
                        ))}
                    </div>
                  </button>
                ))}
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
                        <span>Favorito</span>
                        <strong>{selectedInsight.favorite}</strong>
                      </div>
                      <div className="metricCard">
                        <span>Paridad</span>
                        <strong>{selectedInsight.parity}</strong>
                      </div>
                      <div className="metricCard">
                        <span>Ritmo base</span>
                        <strong>{selectedInsight.tempo}</strong>
                      </div>
                      <div className="metricCard">
                        <span>Pick top</span>
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
                        <div className="oddBox" key={pick.id}>
                          <strong>{pick.market}</strong>
                          <span>Cuota {pick.price.toFixed(2)}</span>
                          <span>Conf. {formatPercent(pick.confidence)}</span>
                          <span className="positiveText">Apta | Edge {formatSignedPercent(pick.edge)}</span>
                        </div>
                      ))}
                      {!selectedInsight.recommended.length ? <p className="muted">Sin picks aptos en este partido.</p> : null}
                      {selectedInsight.watchlist.length ? <p className="muted">Mercados a vigilar</p> : null}
                      {selectedInsight.watchlist.map((pick) => (
                        <div className="oddBox watchBox" key={pick.id}>
                          <strong>{pick.market}</strong>
                          <span>Cuota {pick.price.toFixed(2)}</span>
                          <span>Conf. {formatPercent(pick.confidence)}</span>
                          <span className="muted">Cauta | Edge {formatSignedPercent(pick.edge)}</span>
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
                      {["Corners", "Tarjetas", "Tiros", "Tiros al arco", "Saques de arco", "Laterales"].map((label) => (
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
                            <div><span>Prob.</span><strong>{formatPercent(pick.adjustedProbability)}</strong></div>
                            <div><span>Conf.</span><strong>{formatPercent(pick.confidence)}</strong></div>
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
  if (firstError.includes(":401")) return "La ODDS_API_KEY fue rechazada por el proveedor.";
  if (firstError.includes(":429")) return "El proveedor rechazo requests por limite o credito.";
  if (meta.reason === "all_sports_failed") return "Todos los deportes fallaron en el proveedor.";
  return "El proveedor no devolvio partidos utilizables.";
}


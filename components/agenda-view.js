"use client";

import { useMemo, useState } from "react";
import { formatKickoff, formatPercent, formatSignedPercent, formatStatus, formatTimestamp } from "@/lib/format";
import { usePortalFeed } from "@/components/use-portal-feed";

export function AgendaView() {
  const [competition, setCompetition] = useState("all");
  const [sport, setSport] = useState("all");
  const [status, setStatus] = useState("all");
  const [valueOnly, setValueOnly] = useState(true);
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
              <h2>Partidos del dia y mercados con valor</h2>
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
                  <article className="matchCard cockpitCard" key={match.id}>
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
                  </article>
                ))}
              </div>
            </div>

            <div className="agendaLane side">
              <div className="laneHeader">
                <p className="eyebrow">Radar</p>
                <strong>{featuredPicks.length} picks top</strong>
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

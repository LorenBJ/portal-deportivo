"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortalFeed } from "@/components/use-portal-feed";
import { buildLeagueRadar, describeLeagueStatus, getLeagueStatusBadge } from "@/lib/league-radar";
import { formatDecimal, formatMoney } from "@/lib/format";

const STATE_KEY = "portal-deportivo-state";
const STATE_EVENT = "portal-state-sync";

export function LeagueRadarView() {
  const { matches, meta, isLoading } = usePortalFeed();
  const [bets, setBets] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState("");

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

  const radar = useMemo(() => buildLeagueRadar(matches, bets), [matches, bets]);
  const focusLeague = useMemo(() => selectedLeague || radar.leagues[0]?.label || "", [radar.leagues, selectedLeague]);
  const leagueTeams = useMemo(() => radar.teams.filter((team) => team.league === focusLeague).slice(0, 10), [radar.teams, focusLeague]);
  const focusedLeague = useMemo(() => radar.leagues.find((league) => league.label === focusLeague) ?? null, [radar.leagues, focusLeague]);

  return (
    <section className="stack">
      <section className="radarHeroGrid">
        <article className="panel radarLeadPanel">
          <p className="eyebrow">Radar competitivo</p>
          <h2>Ligas y equipos para decidir donde conviene empujar volumen</h2>
          <p className="lead compactLead">
            Este tablero cruza cobertura viva del feed con resultados historicos del portal para que decidas en que ligas operar mas, observar o directamente no tocar.
          </p>
          <div className="metricGrid spacious">
            <div className="metricCard"><span>Ligas rastreadas</span><strong>{radar.summary.totalLeagues}</strong></div>
            <div className="metricCard"><span>Operables</span><strong>{radar.summary.operableLeagues}</strong></div>
            <div className="metricCard"><span>Observacion</span><strong>{radar.summary.observedLeagues}</strong></div>
            <div className="metricCard"><span>Partidos activos</span><strong>{radar.summary.activeMatches}</strong></div>
          </div>
        </article>

        <article className="panel radarStatusPanel">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Feed</p>
              <h3>Estado de cobertura</h3>
            </div>
            <span className={`tag ${meta.source === "live" ? "won" : meta.source === "error" ? "lost" : "pending"}`}>
              {meta.source === "live" ? "En vivo" : meta.source === "error" ? "Con error" : "Demo"}
            </span>
          </div>
          <p className="muted">Si una liga tiene partidos vivos, picks aptos y encima un historial sano, es candidata a subir prioridad en el bot.</p>
          <div className="metricGrid spacious">
            <div className="metricCard"><span>Fuente</span><strong>{meta.provider || "portal"}</strong></div>
            <div className="metricCard"><span>Req. rem.</span><strong>{meta.requestsRemaining ?? "-"}</strong></div>
            <div className="metricCard"><span>Carga</span><strong>{isLoading ? "Actualizando" : "Lista"}</strong></div>
            <div className="metricCard"><span>Equipos medidos</span><strong>{radar.summary.totalTeams}</strong></div>
          </div>
        </article>
      </section>

      <section className="radarMainGrid">
        <article className="panel stickyPanel">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Ligas</p>
              <h3>Ranking operativo</h3>
            </div>
          </div>
          <div className="stack compact">
            {radar.leagues.map((league) => (
              <button
                className={`leagueCardButton${focusLeague === league.label ? " active" : ""}`}
                key={league.label}
                onClick={() => setSelectedLeague(league.label)}
                type="button"
              >
                <div className="leagueCardTop">
                  <div className="logoLabelRow">
                    <LogoBadge alt={league.label} src={league.logo} />
                    <div>
                      <strong>{league.label}</strong>
                      <span className="muted">{league.liveMatches} partidos | {league.recommendedPicks} picks</span>
                    </div>
                  </div>
                  <span className={`tag ${getLeagueStatusBadge(league)}`}>{league.status}</span>
                </div>
                <div className="metricGrid spacious">
                  <div className="metricCard compactMetric"><span>ROI</span><strong>{league.roiLabel}</strong></div>
                  <div className="metricCard compactMetric"><span>Acierto</span><strong>{league.hitRateLabel}</strong></div>
                  <div className="metricCard compactMetric"><span>Score</span><strong>{formatDecimal(league.score, 0)}</strong></div>
                </div>
              </button>
            ))}
          </div>
        </article>

        <div className="stack">
          {focusedLeague ? (
            <>
              <section className="panel">
                <div className="sectionHead">
                  <div>
                    <p className="eyebrow">Liga foco</p>
                    <h3>{focusedLeague.label}</h3>
                  </div>
                  <span className={`tag ${getLeagueStatusBadge(focusedLeague)}`}>{focusedLeague.status}</span>
                </div>
                <div className="radarHeadlineCard">
                  <div className="logoLabelRow bigGap">
                    <LogoBadge alt={focusedLeague.label} large src={focusedLeague.logo} />
                    <div>
                      <strong className="headlineValue">{focusedLeague.label}</strong>
                      <p className="muted">{describeLeagueStatus(focusedLeague)}</p>
                    </div>
                  </div>
                </div>
                <div className="metricGrid spacious">
                  <div className="metricCard"><span>ROI</span><strong>{focusedLeague.roiLabel}</strong></div>
                  <div className="metricCard"><span>% acierto</span><strong>{focusedLeague.hitRateLabel}</strong></div>
                  <div className="metricCard"><span>Cobertura</span><strong>{focusedLeague.coverageLabel}</strong></div>
                  <div className="metricCard"><span>Stake acumulado</span><strong>{formatMoney(focusedLeague.stake)}</strong></div>
                  <div className="metricCard"><span>Profit</span><strong className={focusedLeague.profit >= 0 ? "positiveText" : "warningText"}>{formatMoney(focusedLeague.profit)}</strong></div>
                  <div className="metricCard"><span>Muestra</span><strong>{focusedLeague.settled}</strong></div>
                </div>
              </section>

              <section className="panel">
                <div className="sectionHead">
                  <div>
                    <p className="eyebrow">Equipos</p>
                    <h3>Top del segmento</h3>
                  </div>
                </div>
                <div className="teamRadarGrid">
                  {leagueTeams.length ? leagueTeams.map((team) => (
                    <article className="historyCard teamRadarCard" key={`${team.league}-${team.label}`}>
                      <div className="leagueCardTop">
                        <div className="logoLabelRow">
                          <LogoBadge alt={team.label} src={team.logo} />
                          <div>
                            <strong>{team.label}</strong>
                            <span className="muted">{team.league}</span>
                          </div>
                        </div>
                        <span className={`tag ${getLeagueStatusBadge(team)}`}>{team.status}</span>
                      </div>
                      <div className="metricGrid spacious">
                        <div className="metricCard compactMetric"><span>ROI</span><strong>{team.roiLabel}</strong></div>
                        <div className="metricCard compactMetric"><span>Acierto</span><strong>{team.hitRateLabel}</strong></div>
                        <div className="metricCard compactMetric"><span>Score</span><strong>{formatDecimal(team.score, 0)}</strong></div>
                        <div className="metricCard compactMetric"><span>Muestra</span><strong>{team.settled}</strong></div>
                      </div>
                    </article>
                  )) : <p className="muted">Todavia no hay muestra suficiente de equipos en esta liga.</p>}
                </div>
              </section>
            </>
          ) : (
            <section className="panel"><p className="muted">Todavia no hay ligas para auditar.</p></section>
          )}
        </div>
      </section>
    </section>
  );
}

function LogoBadge({ src, alt, large = false }) {
  if (src) {
    return <img alt={alt} className={`logoBadge${large ? " large" : ""}`} src={src} />;
  }

  return <div className={`logoFallback${large ? " large" : ""}`}>{String(alt).slice(0, 2).toUpperCase()}</div>;
}

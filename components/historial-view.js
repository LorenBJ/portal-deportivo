"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney, formatPercent } from "@/lib/format";
import { getHistoryStats } from "@/lib/portal-core";

const STORAGE_KEY = "portal-deportivo-state";
const STATE_EVENT = "portal-state-sync";

export function HistorialView() {
  const [bets, setBets] = useState([]);

  useEffect(() => {
    function syncBets() {
      const raw = window.localStorage.getItem(STORAGE_KEY);
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

  const stats = useMemo(() => getHistoryStats(bets), [bets]);

  function updateStatus(betId, status) {
    setBets((current) => {
      const next = current.map((bet) => (bet.id === betId ? { ...bet, status } : bet));
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...saved,
          bets: next
        })
      );
      window.dispatchEvent(new Event(STATE_EVENT));
      return next;
    });
  }

  return (
    <section className="stack">
      <section className="panel">
        <div className="sectionHead">
          <div>
            <p className="eyebrow">Metricas</p>
            <h2>Resumen general</h2>
          </div>
        </div>
        <div className="metricGrid spacious">
          <div className="metricCard"><span>Total</span><strong>{stats.total}</strong></div>
          <div className="metricCard"><span>Pendientes</span><strong>{stats.pending}</strong></div>
          <div className="metricCard"><span>Ganadas</span><strong>{stats.won}</strong></div>
          <div className="metricCard"><span>Perdidas</span><strong>{stats.lost}</strong></div>
          <div className="metricCard"><span>% acierto</span><strong>{formatPercent(stats.hitRate)}</strong></div>
          <div className="metricCard"><span>ROI</span><strong>{formatPercent(stats.roi)}</strong></div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionHead">
          <div>
            <p className="eyebrow">Registro</p>
            <h2>Apuestas guardadas</h2>
          </div>
        </div>
        <div className="stack compact">
          {bets.length ? (
            bets.map((bet) => (
              <article className="historyCard" key={bet.id}>
                <div className="rowSpread">
                  <div>
                    <h3>Apuesta {new Date(bet.createdAt).toLocaleDateString("es-AR")}</h3>
                    <p className="muted">
                      {bet.picks.length} seleccion{bet.picks.length > 1 ? "es" : ""} • cuota {bet.odds.toFixed(2)}
                    </p>
                  </div>
                  <span className={`tag ${bet.status}`}>{statusLabel(bet.status)}</span>
                </div>

                <div className="stack mini">
                  {bet.picks.map((pick) => (
                    <div className="historyPick" key={pick.id}>
                      <strong>{pick.market}</strong>
                      <span>{pick.home} vs {pick.away}</span>
                    </div>
                  ))}
                </div>

                <div className="metricGrid spacious">
                  <div className="metricCard"><span>Stake</span><strong>{formatMoney(bet.stake)}</strong></div>
                  <div className="metricCard"><span>Retorno potencial</span><strong>{formatMoney(bet.potentialReturn)}</strong></div>
                  <div className="metricCard"><span>Probabilidad</span><strong>{formatPercent(bet.probability)}</strong></div>
                </div>

                <div className="buttonRow">
                  <button className="button secondary" onClick={() => updateStatus(bet.id, "pending")} type="button">Pendiente</button>
                  <button className="button secondary" onClick={() => updateStatus(bet.id, "won")} type="button">Ganada</button>
                  <button className="button secondary" onClick={() => updateStatus(bet.id, "lost")} type="button">Perdida</button>
                </div>
              </article>
            ))
          ) : (
            <p className="muted">Todavia no guardaste apuestas en el historial.</p>
          )}
        </div>
      </section>
    </section>
  );
}

function statusLabel(status) {
  if (status === "won") return "Ganada";
  if (status === "lost") return "Perdida";
  return "Pendiente";
}

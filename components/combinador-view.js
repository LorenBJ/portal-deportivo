"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateCombo, getAllPicks } from "@/lib/portal-core";
import { formatMoney, formatPercent, formatSignedPercent, formatStatus } from "@/lib/format";

const STORAGE_KEY = "portal-deportivo-state";
const allPicks = getAllPicks()
  .filter((pick) => pick.edge > 0)
  .sort((a, b) => (b.adjustedProbability + b.edge) - (a.adjustedProbability + a.edge));

export function CombinadorView() {
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [stake, setStake] = useState(1000);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        setSelectedPicks(saved.selectedPicks ?? []);
        setStake(saved.stake ?? 1000);
      } catch {
        setSelectedPicks([]);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...saved,
        selectedPicks,
        stake,
        bets: saved.bets ?? []
      })
    );
  }, [ready, selectedPicks, stake]);

  const summary = useMemo(
    () => calculateCombo(selectedPicks, Number(stake) || 0),
    [selectedPicks, stake]
  );

  function togglePick(pick) {
    setSelectedPicks((current) => {
      const exists = current.some((entry) => entry.id === pick.id);
      if (exists) return current.filter((entry) => entry.id !== pick.id);
      if (current.length >= 3) return [...current.slice(1), pick];
      return [...current, pick];
    });
  }

  function saveBet() {
    if (!selectedPicks.length) return;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    const bets = saved.bets ?? [];

    bets.unshift({
      id: window.crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      picks: selectedPicks,
      stake: Number(stake) || 0,
      odds: summary.combinedOdds,
      probability: summary.combinedProbability,
      potentialReturn: summary.potentialReturn,
      status: "pending"
    });

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...saved,
        selectedPicks: [],
        stake: Number(stake) || 0,
        bets
      })
    );

    setSelectedPicks([]);
  }

  return (
    <section className="contentGrid">
      <aside className="panel stickyPanel">
        <h2>Preparacion</h2>
        <label className="field">
          <span>Monto a apostar</span>
          <input
            min="0"
            onChange={(event) => setStake(Number(event.target.value))}
            step="100"
            type="number"
            value={stake}
          />
        </label>
        <div className={`selectedBox${selectedPicks.length ? "" : " empty"}`}>
          {selectedPicks.length ? (
            selectedPicks.map((pick) => (
              <div className="selectedItem" key={pick.id}>
                <strong>{pick.market}</strong>
                <span>{pick.home} vs {pick.away}</span>
                <span>Cuota {pick.price.toFixed(2)}</span>
              </div>
            ))
          ) : (
            "Todavia no elegiste picks."
          )}
        </div>
        <button className="button secondary fullWidth" onClick={() => setSelectedPicks([])} type="button">
          Limpiar seleccion
        </button>
      </aside>

      <div className="stack">
        <section className="panel">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Resumen</p>
              <h2>Combinacion proyectada</h2>
            </div>
          </div>
          {selectedPicks.length ? (
            <div className="summaryStack">
              <div className="metricGrid spacious">
                <div className="metricCard">
                  <span>Stake</span>
                  <strong>{formatMoney(Number(stake) || 0)}</strong>
                </div>
                <div className="metricCard">
                  <span>Cuota total</span>
                  <strong>{summary.combinedOdds.toFixed(2)}</strong>
                </div>
                <div className="metricCard">
                  <span>Probabilidad</span>
                  <strong>{formatPercent(summary.combinedProbability)}</strong>
                </div>
                <div className="metricCard">
                  <span>Retorno potencial</span>
                  <strong>{formatMoney(summary.potentialReturn)}</strong>
                </div>
                <div className="metricCard">
                  <span>Ganancia neta</span>
                  <strong>{formatMoney(summary.netProfit)}</strong>
                </div>
              </div>
              <button className="button primary" onClick={saveBet} type="button">
                Guardar apuesta en historial
              </button>
            </div>
          ) : (
            <p className="muted">
              Elegi entre 1 y 3 picks para calcular cuota total, probabilidad conjunta y retorno potencial.
            </p>
          )}
        </section>

        <section className="panel">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Mercados</p>
              <h2>Picks sugeridos para combinar</h2>
            </div>
          </div>
          <div className="cardGrid">
            {allPicks.slice(0, 12).map((pick) => {
              const selected = selectedPicks.some((entry) => entry.id === pick.id);
              return (
                <article className={`pickCard${selected ? " selected" : ""}`} key={pick.id}>
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
                  <button className="button secondary fullWidth" onClick={() => togglePick(pick)} type="button">
                    {selected ? "Quitar" : "Agregar"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}

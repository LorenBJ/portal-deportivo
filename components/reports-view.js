"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { formatKickoff, formatMoney, formatPercent, formatTimestamp } from "@/lib/format";
import { filterBetsForReport, formatBetCompetition, formatBetMatch, getCompetitionOptions, getReportSummary } from "@/lib/report-utils";

const STORAGE_KEY = "portal-deportivo-state";
const STATE_EVENT = "portal-state-sync";

export function ReportsView() {
  const [bets, setBets] = useState([]);
  const [filters, setFilters] = useState(() => buildDefaultFilters());

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

  const competitionOptions = useMemo(() => getCompetitionOptions(bets), [bets]);
  const filteredBets = useMemo(() => filterBetsForReport(bets, filters), [bets, filters]);
  const summary = useMemo(() => getReportSummary(filteredBets), [filteredBets]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function exportPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 42;
    let y = margin;

    const writeLine = (text, size = 10, color = 30, gap = 16) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      doc.setTextColor(color, color, color);
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      if (y + lines.length * gap > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(lines, margin, y);
      y += lines.length * gap;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Informe de apuestas", margin, y);
    y += 24;

    writeLine(`Generado: ${formatTimestamp(new Date().toISOString())}`, 10, 80, 14);
    writeLine(`Filtro: ${filters.startDate} a ${filters.endDate} | Competicion: ${filters.competition === "all" ? "Todas" : filters.competition} | Estado: ${labelStatus(filters.status)}`, 10, 80, 14);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Resumen", margin, y);
    y += 20;
    writeLine(`Total: ${summary.total} | Settled: ${summary.settled} | Pendientes: ${summary.pending} | Ganadas: ${summary.won} | Perdidas: ${summary.lost}`, 10, 30, 14);
    writeLine(`Monto apostado: ${formatMoney(summary.totalStake)} | Profit: ${formatMoney(summary.profit)} | ROI: ${formatPercent(summary.roi)} | Acierto: ${formatPercent(summary.hitRate)}`, 10, 30, 14);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Detalle", margin, y);
    y += 20;

    filteredBets.forEach((bet, index) => {
      if (y > pageHeight - 120) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${index + 1}. ${formatBetMatch(bet)}`, margin, y);
      y += 16;
      writeLine(`Liga/competicion: ${formatBetCompetition(bet)}`, 10, 40, 14);
      writeLine(`Fecha: ${formatKickoff(bet.createdAt)} | Estado: ${labelStatus(bet.status)} | Cuota: ${Number(bet.odds || 0).toFixed(2)} | Stake: ${formatMoney(bet.stake)} | Retorno potencial: ${formatMoney(bet.potentialReturn)}`, 10, 40, 14);
      writeLine(`Mercados: ${(bet.picks ?? []).map((pick) => pick.market).join(" / ")}`, 10, 40, 14);
      y += 8;
    });

    doc.save(`informe-apuestas-${filters.startDate}-${filters.endDate}.pdf`);
  }

  return (
    <section className="stack">
      <section className="panel">
        <div className="sectionHead wrapGap">
          <div>
            <p className="eyebrow">Informes</p>
            <h2>Exportacion de resultados</h2>
          </div>
          <button className="button primary" onClick={exportPdf} type="button">Exportar PDF</button>
        </div>
        <p className="lead compactLead">Filtrá por fecha, estado o competición y exportá un resumen portable para compartir con otra IA o revisar fuera de la plataforma.</p>
        <div className="reportsFilterGrid">
          <label className="field"><span>Desde</span><input type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} /></label>
          <label className="field"><span>Hasta</span><input type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} /></label>
          <label className="field"><span>Competicion</span><select value={filters.competition} onChange={(event) => updateFilter("competition", event.target.value)}>{competitionOptions.map((option) => <option key={option} value={option}>{option === "all" ? "Todas" : option}</option>)}</select></label>
          <label className="field"><span>Estado</span><select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><option value="all">Todos</option><option value="pending">Pendientes</option><option value="won">Ganadas</option><option value="lost">Perdidas</option></select></label>
        </div>
      </section>

      <section className="cardGrid cardGridWide reportsSummaryGrid">
        <article className="metricCard"><span>Total</span><strong>{summary.total}</strong></article>
        <article className="metricCard"><span>Ganadas</span><strong>{summary.won}</strong></article>
        <article className="metricCard"><span>Perdidas</span><strong>{summary.lost}</strong></article>
        <article className="metricCard"><span>Monto apostado</span><strong>{formatMoney(summary.totalStake)}</strong></article>
        <article className="metricCard"><span>Profit</span><strong className={summary.profit >= 0 ? "positiveText" : "warningText"}>{formatMoney(summary.profit)}</strong></article>
        <article className="metricCard"><span>ROI</span><strong>{formatPercent(summary.roi)}</strong></article>
      </section>

      <section className="panel">
        <div className="sectionHead">
          <div>
            <p className="eyebrow">Detalle</p>
            <h2>Apuestas incluidas en el informe</h2>
          </div>
        </div>
        <div className="stack compact">
          {filteredBets.length ? filteredBets.map((bet) => (
            <article className="historyCard" key={bet.id}>
              <div className="rowSpread wrapGap">
                <div>
                  <h3>{formatBetMatch(bet)}</h3>
                  <p className="muted">{formatBetCompetition(bet)}</p>
                </div>
                <span className={`tag ${bet.status}`}>{labelStatus(bet.status)}</span>
              </div>
              <div className="metricGrid spacious">
                <div className="metricCard"><span>Fecha</span><strong>{formatKickoff(bet.createdAt)}</strong></div>
                <div className="metricCard"><span>Cuota</span><strong>{Number(bet.odds || 0).toFixed(2)}</strong></div>
                <div className="metricCard"><span>Stake</span><strong>{formatMoney(bet.stake)}</strong></div>
                <div className="metricCard"><span>Retorno pot.</span><strong>{formatMoney(bet.potentialReturn)}</strong></div>
                <div className="metricCard"><span>Selecciones</span><strong>{(bet.picks ?? []).length}</strong></div>
              </div>
              <p className="muted reportMarkets">Mercados: {(bet.picks ?? []).map((pick) => pick.market).join(" / ")}</p>
            </article>
          )) : <p className="muted">No hay apuestas para ese filtro.</p>}
        </div>
      </section>
    </section>
  );
}

function buildDefaultFilters() {
  const end = new Date();
  const start = new Date();
  start.setMonth(end.getMonth() - 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    competition: "all",
    status: "all"
  };
}

function labelStatus(status) {
  if (status === "won") return "Ganada";
  if (status === "lost") return "Perdida";
  if (status === "pending") return "Pendiente";
  return "Todos";
}

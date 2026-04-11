"use client";

import { useMemo, useState } from "react";
import { AnalystView } from "@/components/analyst-view";
import { StrategyCoachView } from "@/components/strategy-coach-view";

export function TechnicalStaffView({ initialMatchId = "", initialPrompt = "", initialTab = "ayudante" }) {
  const [tab, setTab] = useState(initialTab === "director" ? "director" : "ayudante");

  const title = useMemo(() => tab === "director" ? "Director tecnico" : "Ayudante de campo", [tab]);
  const note = useMemo(() => tab === "director"
    ? "Estrategia diaria con informe resumido y bajo consumo de tokens"
    : "Analisis de partido y mercados sobre el feed actual", [tab]);

  return (
    <section className="stack">
      <section className="panel coachHeaderPanel">
        <div className="rowSpread wrapGap coachHeaderTop">
          <div>
            <p className="eyebrow">Cuerpo tecnico</p>
            <h2>{title}</h2>
            <p className="lead compactLead">{note}</p>
          </div>
          <div className="coachTabs">
            <button className={`coachTab ${tab === "ayudante" ? "active" : ""}`} onClick={() => setTab("ayudante")} type="button">Ayudante de campo</button>
            <button className={`coachTab ${tab === "director" ? "active" : ""}`} onClick={() => setTab("director")} type="button">Director tecnico</button>
          </div>
        </div>
      </section>

      {tab === "director" ? (
        <StrategyCoachView />
      ) : (
        <AnalystView initialMatchId={initialMatchId} initialPrompt={initialPrompt} />
      )}
    </section>
  );
}

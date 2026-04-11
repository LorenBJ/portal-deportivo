"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPercent } from "@/lib/format";
import { usePortalFeed } from "@/components/use-portal-feed";

const STARTERS = [
  "Analiza el partido seleccionado y decime si hay valor real.",
  "Compara el mejor mercado conservador para este partido.",
  "Si tuvieras que evitar una apuesta aca, cual seria y por que?"
];

export function AnalystView({ initialMatchId = "", initialPrompt = "" }) {
  const { matches, meta, isLoading } = usePortalFeed();
  const [matchId, setMatchId] = useState(initialMatchId);
  const [input, setInput] = useState(initialPrompt || STARTERS[0]);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const selectedMatch = useMemo(() => matches.find((match) => match.id === matchId) ?? matches[0] ?? null, [matchId, matches]);
  const analystBlocked = meta.source !== "live";
  const blockReason = getAnalystBlockReason(meta);

  useEffect(() => {
    if (initialMatchId) setMatchId(initialMatchId);
  }, [initialMatchId]);

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt);
  }, [initialPrompt]);

  async function sendMessage(customMessage) {
    const content = (customMessage ?? input).trim();
    if (!content || analystBlocked) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    setError("");

    const response = await fetch("/api/analyst", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, matchId: selectedMatch?.id ?? null, history: nextMessages })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "analyst_error");
      setPending(false);
      return;
    }

    setMessages((current) => [...current, { role: "assistant", content: payload.reply }]);
    setPending(false);
  }

  function loadStarter(starter) {
    setInput(starter);
  }

  return (
    <section className="contentGrid analystGrid">
      <aside className="panel stickyPanel analystSide">
        <h2>Analista</h2>
        <div className="feedStatusCard">
          <strong>{meta.source === "live" ? "Feed activo" : meta.source === "error" ? "Sin feed real" : "Modo demo"}</strong>
          <span>{selectedMatch ? `${selectedMatch.home} vs ${selectedMatch.away}` : "Sin partido"}</span>
        </div>
        {analystBlocked ? <p className="warningText">{blockReason}</p> : null}
        <label className="field">
          <span>Partido</span>
          <select disabled={analystBlocked} value={selectedMatch?.id ?? ""} onChange={(event) => setMatchId(event.target.value)}>
            {matches.map((match) => (
              <option key={match.id} value={match.id}>{match.home} vs {match.away} | {match.competition}</option>
            ))}
          </select>
        </label>
        {selectedMatch ? (
          <div className="selectedBox analystFacts">
            <strong>{selectedMatch.home} vs {selectedMatch.away}</strong>
            <span>{selectedMatch.competition}</span>
            <span>{selectedMatch.odds.filter((pick) => pick.recommended).length} picks aptos</span>
            <span>Top conf. {formatPercent(Math.max(...selectedMatch.odds.map((pick) => pick.confidence), 0))}</span>
          </div>
        ) : null}
        <div className="starterStack">
          {STARTERS.map((starter) => (
            <button key={starter} className="button secondary fullWidth" disabled={analystBlocked} onClick={() => loadStarter(starter)} type="button">
              {starter}
            </button>
          ))}
        </div>
      </aside>

      <div className="stack">
        <section className="panel analystPanel">
          <div className="sectionHead"><div><p className="eyebrow">Chat</p><h2>Analista conversacional</h2></div></div>
          <p className="muted analystHint">Podés usar una pregunta sugerida o escribir una consulta propia. El analista responde sobre el partido seleccionado arriba.</p>
          {isLoading ? <p className="muted">Cargando contexto...</p> : null}
          {error ? <p className="warningText">{error}</p> : null}
          <div className="chatList">
            {messages.length ? messages.map((message, index) => (
              <article className={`chatBubble ${message.role}`} key={`${message.role}-${index}`}>
                <span className="chatRole">{message.role === "assistant" ? "Analista" : "Vos"}</span>
                <p>{message.content}</p>
              </article>
            )) : <p className="muted">{analystBlocked ? "El analista necesita feed real para trabajar." : "Elegí un partido, escribí lo que quieras y tocá enviar."}</p>}
            {pending ? <article className="chatBubble assistant"><span className="chatRole">Analista</span><p>Pensando...</p></article> : null}
          </div>
          <div className="chatComposer">
            <label className="field chatField">
              <span>Consulta personalizada</span>
              <textarea className="chatInput" disabled={analystBlocked} value={input} onChange={(event) => setInput(event.target.value)} placeholder={analystBlocked ? "El analista esta bloqueado hasta recuperar feed real." : "Ejemplo: armame una combinada conservadora para este partido, pero considerando contexto de clasico, faltas y ritmo."} rows={5} />
            </label>
            <div className="buttonRow analystActions">
              <button className="button secondary" disabled={analystBlocked || pending} onClick={() => setInput("")} type="button">Limpiar</button>
              <button className="button primary analystSendButton" disabled={analystBlocked || pending || !selectedMatch || !input.trim()} onClick={() => sendMessage()} type="button">Enviar consulta</button>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function getAnalystBlockReason(meta) {
  const firstError = meta.errors?.[0] ?? "";
  if (meta.source === "error" && firstError.includes(":401")) return "El feed real esta bloqueado: la key del proveedor fue rechazada.";
  if (meta.source === "error" && firstError.includes(":429")) return "El feed real esta bloqueado: limite o credito agotado en el proveedor.";
  if (meta.source === "error") return "El analista queda bloqueado hasta que vuelva el feed real.";
  return "El analista queda bloqueado hasta salir del modo demo.";
}

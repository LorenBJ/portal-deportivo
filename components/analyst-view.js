"use client";

import { useMemo, useState } from "react";
import { formatPercent } from "@/lib/format";
import { usePortalFeed } from "@/components/use-portal-feed";

const STARTERS = [
  "Analiza el partido seleccionado y decime si hay valor real.",
  "Compara el mejor mercado conservador para este partido.",
  "Si tuvieras que evitar una apuesta aca, cual seria y por que?"
];

export function AnalystView() {
  const { matches, meta, isLoading } = usePortalFeed();
  const [matchId, setMatchId] = useState("");
  const [input, setInput] = useState(STARTERS[0]);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const selectedMatch = useMemo(() => matches.find((match) => match.id === matchId) ?? matches[0] ?? null, [matchId, matches]);

  async function sendMessage(customMessage) {
    const content = (customMessage ?? input).trim();
    if (!content) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    setError("");

    const response = await fetch("/api/analyst", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: content,
        matchId: selectedMatch?.id ?? null,
        history: nextMessages
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "analyst_error");
      setPending(false);
      return;
    }

    setMessages((current) => [...current, { role: "assistant", content: payload.reply }]);
    setPending(false);
  }

  return (
    <section className="contentGrid analystGrid">
      <aside className="panel stickyPanel analystSide">
        <h2>Analista</h2>
        <div className="feedStatusCard">
          <strong>{meta.source === "mock" ? "Modo demo" : "Feed activo"}</strong>
          <span>{selectedMatch ? `${selectedMatch.home} vs ${selectedMatch.away}` : "Sin partido"}</span>
        </div>
        <label className="field">
          <span>Partido</span>
          <select value={selectedMatch?.id ?? ""} onChange={(event) => setMatchId(event.target.value)}>
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
            <button key={starter} className="button secondary fullWidth" onClick={() => sendMessage(starter)} type="button">
              {starter}
            </button>
          ))}
        </div>
      </aside>

      <div className="stack">
        <section className="panel analystPanel">
          <div className="sectionHead"><div><p className="eyebrow">Chat</p><h2>Analista conversacional</h2></div></div>
          {isLoading ? <p className="muted">Cargando contexto...</p> : null}
          {error ? <p className="warningText">{error}</p> : null}
          <div className="chatList">
            {messages.length ? messages.map((message, index) => (
              <article className={`chatBubble ${message.role}`} key={`${message.role}-${index}`}>
                <span className="chatRole">{message.role === "assistant" ? "Analista" : "Vos"}</span>
                <p>{message.content}</p>
              </article>
            )) : <p className="muted">Elegi un partido y hace una consulta.</p>}
            {pending ? <article className="chatBubble assistant"><span className="chatRole">Analista</span><p>Pensando...</p></article> : null}
          </div>
          <div className="chatComposer">
            <textarea className="chatInput" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Preguntame por un partido o mercado..." rows={4} />
            <button className="button primary" disabled={pending || !selectedMatch} onClick={() => sendMessage()} type="button">Enviar</button>
          </div>
        </section>
      </div>
    </section>
  );
}

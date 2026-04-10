import { NextResponse } from "next/server";
import { getPortalFeed } from "@/lib/portal-feed";
import { summarizeMatchForAnalyst } from "@/lib/portal-core";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "missing_openai_api_key" }, { status: 503 });
  }

  const { message, matchId, history = [] } = await request.json();
  if (!message) {
    return NextResponse.json({ error: "missing_message" }, { status: 400 });
  }

  const feed = await getPortalFeed();
  const targetMatch = feed.matches.find((match) => match.id === matchId) ?? null;
  const context = {
    meta: feed.meta,
    selectedMatch: targetMatch ? summarizeMatchForAnalyst(targetMatch) : null,
    topPicks: feed.matches
      .flatMap((match) => match.odds.map((pick) => ({ match, pick })))
      .filter((entry) => entry.pick.recommended)
      .sort((a, b) => b.pick.recommendationScore - a.pick.recommendationScore)
      .slice(0, 8)
      .map(({ match, pick }) => ({
        match: `${match.home} vs ${match.away}`,
        competition: match.competition,
        market: pick.market,
        price: pick.price,
        probability: pick.adjustedProbability,
        edge: pick.edge,
        confidence: pick.confidence,
        rationale: pick.rationale
      }))
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      reasoning: { effort: process.env.OPENAI_REASONING_EFFORT ?? "low" },
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: "Sos un analista de apuestas conservador. Usa solo el contexto recibido. No inventes datos externos. Nunca recomiendes outsiders extremos sin respaldo fuerte. Si no hay ventaja clara, deci no apostar. Responde breve con: lectura, riesgos, mejor mercado, stake sugerido, conclusion." }]
        },
        {
          role: "system",
          content: [{ type: "input_text", text: `Contexto actual: ${JSON.stringify(context)}` }]
        },
        ...history.slice(-6).map((item) => ({ role: item.role === "assistant" ? "assistant" : "user", content: [{ type: "input_text", text: item.content }] })),
        {
          role: "user",
          content: [{ type: "input_text", text: message }]
        }
      ]
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { error: "openai_request_failed", detail: extractErrorDetail(data) },
      { status: 502 }
    );
  }

  const reply = extractOutputText(data);
  if (!reply) {
    return NextResponse.json(
      { error: "empty_model_response", detail: "El modelo respondio sin texto util." },
      { status: 502 }
    );
  }

  return NextResponse.json({ reply });
}

function extractOutputText(data) {
  if (!data) return "";
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks = [];
  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        chunks.push(content.text);
      }
      if (content.type === "text" && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

function extractErrorDetail(data) {
  if (!data) return "Sin detalle del proveedor.";
  if (typeof data.error?.message === "string") return data.error.message;
  if (typeof data.message === "string") return data.message;
  return "Error desconocido del proveedor.";
}

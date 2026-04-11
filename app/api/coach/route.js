import { NextResponse } from "next/server";
import { getPortalFeed } from "@/lib/portal-feed";
import { buildStrategyPromptContext } from "@/lib/strategy-report";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "missing_openai_api_key" }, { status: 503 });
  }

  const { message, report, history = [] } = await request.json();
  if (!message || !report) {
    return NextResponse.json({ error: "missing_payload" }, { status: 400 });
  }

  const feed = await getPortalFeed();
  const context = {
    report: buildStrategyPromptContext(report),
    feedMeta: {
      source: feed.meta?.source,
      liveCoverage: feed.meta?.liveCoverage,
      requestsRemaining: feed.meta?.requestsRemaining
    }
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
          content: [{ type: "input_text", text: "Sos el director tecnico de una mesa de apuestas. Tu trabajo es ajustar estrategia, no inventar datos. Usa solo el informe resumido. Responde breve y accionable con: lectura general, que sostener, que bajar, que testear, ajuste de stake/cuotas." }]
        },
        {
          role: "system",
          content: [{ type: "input_text", text: `Informe resumido: ${JSON.stringify(context)}` }]
        },
        ...history.slice(-4).map((item) => ({ role: item.role === "assistant" ? "assistant" : "user", content: [{ type: "input_text", text: item.content }] })),
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
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();

  const chunks = [];
  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if ((content.type === "output_text" || content.type === "text") && typeof content.text === "string") chunks.push(content.text);
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

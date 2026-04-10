import { isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram";

export async function GET() {
  return Response.json({
    telegramConfigured: isTelegramConfigured()
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const type = body?.type ?? "test";

    if (type === "test") {
      await sendTelegramMessage("<b>Portal Deportivo</b>\nAlerta de prueba desde Bot Lab.");
      return Response.json({ ok: true });
    }

    if (type === "ticket") {
      const ticket = body?.ticket ?? {};
      const lines = [
        "<b>Portal Deportivo</b>",
        "Ticket listo para ejecutar",
        `Partido: ${escapeHtml(ticket.match || "Sin partido")}`,
        `Mercado: ${escapeHtml(ticket.market || "Sin mercado")}`,
        `Cuota: ${escapeHtml(String(ticket.odds ?? "-"))}`,
        `Stake: ${escapeHtml(String(ticket.stake ?? "-"))}`,
        `Estado: ${escapeHtml(ticket.status || "sugerida")}`,
        ticket.note ? `Nota: ${escapeHtml(ticket.note)}` : null
      ].filter(Boolean);

      await sendTelegramMessage(lines.join("\n"));
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "unsupported_type" }, { status: 400 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || "notify_failed" }, { status: 500 });
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

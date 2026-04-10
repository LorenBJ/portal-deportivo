export function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatSignedPercent(value) {
  const number = (value * 100).toFixed(1);
  return `${value >= 0 ? "+" : ""}${number}%`;
}

export function formatMoney(value) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

export function formatStatus(status) {
  if (status === "live") return "En vivo";
  if (status === "completed") return "Finalizado";
  return "Proximo";
}

export function formatKickoff(value) {
  if (!value) return "Horario a confirmar";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(parsed));
}

export function formatTimestamp(value) {
  if (!value) return "recien";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(parsed));
}

export function formatDecimal(value, digits = 2) {
  return Number(value ?? 0).toFixed(digits);
}

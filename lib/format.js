export function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatSignedPercent(value) {
  const number = (value * 100).toFixed(1);
  return `${value >= 0 ? "+" : ""}${number}%`;
}

export function formatMoney(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatStatus(status) {
  return status === "live" ? "En vivo" : "Proximo";
}

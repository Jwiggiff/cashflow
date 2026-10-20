export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Short axis labels like "$1.5k", so ticks fit beside the chart
export function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(amount) >= 1000 ? "compact" : "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(amount) >= 1000 ? 1 : 0,
  })
    .format(amount)
    .replace("K", "k");
}

export function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatChange(change: number) {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% from last month`;
}

export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  // Use the system's local timezone if NEXT_PUBLIC_TZ is not set
  const timeZone =
    process.env.NEXT_PUBLIC_TZ ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone,
  }).format(date);
}

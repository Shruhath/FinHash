/** Shared formatting helpers (currency, dates, compact numbers). */

export function formatMoney(
  amount: number,
  symbol: string,
  opts: { decimals?: boolean; sign?: boolean } = {}
): string {
  const { decimals = true, sign = false } = opts;
  const abs = Math.abs(amount);
  const body = abs.toLocaleString(undefined, {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
  const prefix = sign ? (amount < 0 ? "-" : "+") : amount < 0 ? "-" : "";
  return `${prefix}${symbol}${body}`;
}

/** 12.4K / 1.2M — for chart axes and tight spaces. */
export function formatCompact(amount: number, symbol = ""): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}${symbol}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${symbol}${abs.toFixed(0)}`;
}

const DAY = 86_400_000;

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "Today" / "Yesterday" / "Mon, 4 Mar" / "4 Mar 2023" */
export function formatDayLabel(timestamp: number): string {
  const today = startOfDay(Date.now());
  const day = startOfDay(timestamp);
  const diff = Math.round((today - day) / DAY);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff === -1) return "Tomorrow";

  const d = new Date(timestamp);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    weekday: diff < 7 && diff > 0 ? "long" : undefined,
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
  });
}

export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** YYYY-MM key used by budget queries. */
export function monthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Datetime-local input value for a timestamp, corrected for local offset. */
export function toDateTimeLocal(timestamp: number): string {
  const d = new Date(timestamp);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function toDateInput(timestamp: number): string {
  return toDateTimeLocal(timestamp).slice(0, 10);
}

/** Relative day count -> friendly copy. */
export function formatDaysLeft(days: number): string {
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  if (days < 30) return `${days} days left`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 month left" : `${months} months left`;
}

export function initialsOf(name?: string): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

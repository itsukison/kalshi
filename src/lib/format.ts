/** JST-aware date/number formatting helpers. */

const JST = "Asia/Tokyo";

/** "6/18(木) 21:00" in JST. */
export function formatJstDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: JST,
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "6/18(木)" in JST. */
export function formatJstDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    timeZone: JST,
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function jstYmd(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: JST }); // YYYY-MM-DD
}

/** Relative day label in JST: 今日 / 明日 / 明後日 / N日後, or null if in the past. */
export function relativeDayLabel(iso: string): string | null {
  const targetYmd = jstYmd(new Date(iso));
  const nowYmd = jstYmd(new Date());
  const diff = Math.round(
    (Date.parse(targetYmd) - Date.parse(nowYmd)) / 86_400_000
  );
  if (diff < 0) return null;
  if (diff === 0) return "今日";
  if (diff === 1) return "明日";
  if (diff === 2) return "明後日";
  return `${diff}日後`;
}

export function formatPoints(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

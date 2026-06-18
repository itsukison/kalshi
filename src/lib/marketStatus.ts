/**
 * Time-aware market status.
 *
 * The DB `status` column lags behind reality: a market stays "open" until the
 * close-markets cron flips it to "closed". So an "open" market whose `closes_at`
 * has already passed is, for display and trading purposes, effectively "closed"
 * (結果待ち). Compute that here rather than trusting the raw column, and reuse the
 * same logic everywhere a status label or tradability check is needed.
 */

type MarketStatusFields = { status: string; closes_at: string };

export type EffectiveStatus = "open" | "closed" | "resolved" | "cancelled";

/** Effective status: an 'open' market past its close time reads as 'closed'. */
export function effectiveStatus(
  m: MarketStatusFields,
  now: Date = new Date()
): EffectiveStatus {
  if (m.status === "open" && new Date(m.closes_at) <= now) return "closed";
  return m.status as EffectiveStatus;
}

/** True only while a market is open AND its close time is still in the future. */
export function isTradable(m: MarketStatusFields, now: Date = new Date()): boolean {
  return m.status === "open" && new Date(m.closes_at) > now;
}

export const STATUS_LABEL: Record<string, string> = {
  open: "取引中",
  closed: "結果待ち",
  resolved: "確定",
  cancelled: "中止",
};

export const STATUS_COLOR: Record<string, string> = {
  open: "text-pulse-green",
  closed: "text-ember-orange",
  resolved: "text-ash-gray",
  cancelled: "text-ash-gray",
};

/** Localized label using the time-aware effective status. */
export function statusLabel(m: MarketStatusFields, now?: Date): string {
  const eff = effectiveStatus(m, now);
  return STATUS_LABEL[eff] ?? m.status;
}

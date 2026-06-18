/** Minimal client for The Odds API (https://the-odds-api.com), scoped to World Cup. */

export const WORLD_CUP_SPORT_KEY = "soccer_fifa_world_cup";

const BASE = "https://api.the-odds-api.com/v4";

export interface OddsOutcome {
  name: string;
  price: number; // decimal odds
}
export interface OddsEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    markets: { key: string; outcomes: OddsOutcome[] }[];
  }[];
}
export interface ScoreEvent {
  id: string;
  completed: boolean;
  commence_time: string;
  home_team: string;
  away_team: string;
  scores: { name: string; score: string }[] | null;
}

function key(): string {
  const k = process.env.ODDS_API_KEY;
  if (!k) throw new Error("ODDS_API_KEY が設定されていません。");
  return k;
}

export interface ScheduleEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
}

/** Full schedule (free, 0 credits) — includes matches that don't have odds posted yet. */
export async function fetchWorldCupEvents(): Promise<ScheduleEvent[]> {
  const url = `${BASE}/sports/${WORLD_CUP_SPORT_KEY}/events?apiKey=${key()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`試合日程APIの取得に失敗しました。ステータス: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function fetchWorldCupOdds(): Promise<OddsEvent[]> {
  const url = `${BASE}/sports/${WORLD_CUP_SPORT_KEY}/odds?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${key()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`オッズAPIの取得に失敗しました。ステータス: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function fetchWorldCupScores(daysFrom = 3): Promise<ScoreEvent[]> {
  const url = `${BASE}/sports/${WORLD_CUP_SPORT_KEY}/scores?daysFrom=${daysFrom}&apiKey=${key()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`スコアAPIの取得に失敗しました。ステータス: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Average the home-win h2h probability across bookmakers, de-vigged per book. */
export function homeWinProbability(event: OddsEvent): number | null {
  const probs: number[] = [];
  for (const bk of event.bookmakers ?? []) {
    const h2h = bk.markets.find((m) => m.key === "h2h");
    if (!h2h) continue;
    const total = h2h.outcomes.reduce((a, o) => a + 1 / o.price, 0);
    const home = h2h.outcomes.find((o) => o.name === event.home_team);
    if (home && total > 0) probs.push(1 / home.price / total);
  }
  if (probs.length === 0) return null;
  return probs.reduce((a, b) => a + b, 0) / probs.length;
}

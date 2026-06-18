import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchWorldCupEvents,
  fetchWorldCupOdds,
  fetchWorldCupScores,
  homeWinProbability,
  WORLD_CUP_SPORT_KEY,
} from "@/lib/oddsApi";
import { clampPrice, initialQYes } from "@/lib/lmsr";
import { jaTeam } from "@/lib/teamNames";
import { toJapaneseError } from "@/lib/errors";

/**
 * POST /api/cron/sync-results — World Cup only.
 * 1) Pull the full schedule (/events) + odds, upsert every match, and auto-create a
 *    "home win" market (price from de-vigged odds when available, else 50).
 * 2) Pull scores; finish matches; flag markets ready_for_review with a suggested outcome.
 * Does NOT auto-settle — an admin confirms via /api/admin/markets/:id/resolve.
 */
export async function POST(req: NextRequest) {
  if (!requireAdminSecret(req)) {
    return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });
  }
  const admin = createAdminClient();
  const B = 150;
  let upserted = 0;
  let marketsCreated = 0;
  let flagged = 0;

  // ---- 1. full schedule + odds ----
  let events: Awaited<ReturnType<typeof fetchWorldCupEvents>>;
  let oddsEvents: Awaited<ReturnType<typeof fetchWorldCupOdds>>;
  let scores: Awaited<ReturnType<typeof fetchWorldCupScores>>;
  try {
    [events, oddsEvents, scores] = await Promise.all([
      fetchWorldCupEvents(),
      fetchWorldCupOdds(),
      fetchWorldCupScores(3),
    ]);
  } catch (error) {
    return NextResponse.json(
      { error: toJapaneseError(error, "試合データの同期に失敗しました。") },
      { status: 502 }
    );
  }

  // de-vigged home-win probability per event id (only where odds are posted)
  const probById = new Map<string, number>();
  for (const oe of oddsEvents) {
    const p = homeWinProbability(oe);
    if (p != null) probById.set(oe.id, p);
  }

  // union the schedule from /events and /odds so nothing is missed
  const byId = new Map<string, { id: string; commence_time: string; home: string; away: string }>();
  for (const e of events)
    byId.set(e.id, { id: e.id, commence_time: e.commence_time, home: e.home_team, away: e.away_team });
  for (const e of oddsEvents)
    if (!byId.has(e.id))
      byId.set(e.id, { id: e.id, commence_time: e.commence_time, home: e.home_team, away: e.away_team });

  for (const ev of byId.values()) {
    const home = jaTeam(ev.home);
    const away = jaTeam(ev.away);
    const { data: match } = await admin
      .from("matches")
      .upsert(
        {
          external_id: ev.id,
          sport_key: WORLD_CUP_SPORT_KEY,
          sport: "soccer",
          league: "FIFA World Cup",
          home_team: home,
          away_team: away,
          kickoff_at: ev.commence_time,
          source: "the-odds-api",
        },
        { onConflict: "external_id" }
      )
      .select("id")
      .single();
    if (!match) continue;
    upserted++;

    // create the home-win market once
    const { count } = await admin
      .from("markets")
      .select("id", { count: "exact", head: true })
      .eq("match_id", match.id);
    if ((count ?? 0) === 0) {
      const p = probById.get(ev.id);
      const price = clampPrice(Math.round((p ?? 0.5) * 100));
      await admin.from("markets").insert({
        match_id: match.id,
        question: `${home}は${away}に勝ちますか？`,
        question_en: `Will ${ev.home} beat ${ev.away}?`,
        resolution_rule:
          "本戦・延長で本拠地表記チームが勝利した場合はYES。引き分けまたは相手の勝利、PK戦のみの決着はNO。",
        b_liquidity: B,
        q_yes: initialQYes(price / 100, B),
        q_no: 0,
        yes_price: price,
        initial_yes_price: price,
        closes_at: ev.commence_time,
      });
      marketsCreated++;
    }
  }

  // ---- 2. scores / results ----
  for (const sc of scores) {
    if (!sc.completed || !sc.scores) continue;
    const home = sc.scores.find((s) => s.name === sc.home_team);
    const away = sc.scores.find((s) => s.name === sc.away_team);
    const homeScore = home ? parseInt(home.score, 10) : null;
    const awayScore = away ? parseInt(away.score, 10) : null;

    const { data: match } = await admin
      .from("matches")
      .update({
        status: "finished",
        home_score: homeScore,
        away_score: awayScore,
        finished_at: new Date().toISOString(),
      })
      .eq("external_id", sc.id)
      .select("id")
      .single();
    if (!match) continue;

    // suggest outcome for the home-win market (home win in regulation => YES)
    const suggested =
      homeScore != null && awayScore != null && homeScore > awayScore ? "YES" : "NO";
    const { data: flaggedRows } = await admin
      .from("markets")
      .update({ ready_for_review: true, settlement_source: `suggested:${suggested}` })
      .eq("match_id", match.id)
      .in("status", ["open", "closed"])
      .select("id");
    flagged += flaggedRows?.length ?? 0;
  }

  return NextResponse.json({ upserted, marketsCreated, flagged });
}

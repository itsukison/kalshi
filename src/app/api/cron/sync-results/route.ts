import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/auth";
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

// This route fans out to The Odds API (3 endpoints) plus many DB writes, which can
// exceed the default serverless timeout. Vercel Hobby allows up to 60s.
export const maxDuration = 60;

/**
 * POST /api/cron/sync-results — World Cup only.
 * 1) Pull the full schedule (/events) + odds, upsert every match, and auto-create a
 *    "home win" market (price from de-vigged odds when available, else 50).
 * 2) Pull scores; finish matches; auto-settle the home-win market when the API
 *    reports a completed match with both scores (home win in regulation => YES).
 *    Markets that can't be auto-resolved fall back to ready_for_review for an
 *    admin to confirm via /api/admin/markets/:id/resolve.
 */
async function handle(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });
  }
  const admin = createAdminClient();
  const B = 150;
  let upserted = 0;
  let marketsCreated = 0;
  let flagged = 0;
  let resolved = 0;

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

    // Need both scores to settle confidently; otherwise just flag for review.
    const haveScores = homeScore != null && awayScore != null;
    const outcome = haveScores && homeScore! > awayScore! ? "YES" : "NO";

    // The home-win market(s) for this match that aren't already settled.
    const { data: openMarkets } = await admin
      .from("markets")
      .select("id, status")
      .eq("match_id", match.id)
      .in("status", ["open", "closed"]);

    for (const mk of openMarkets ?? []) {
      if (!haveScores) {
        await admin
          .from("markets")
          .update({ ready_for_review: true, settlement_source: `suggested:${outcome}` })
          .eq("id", mk.id);
        flagged++;
        continue;
      }

      // resolve_market requires status='closed'; close it first if still open.
      if (mk.status === "open") {
        await admin.from("markets").update({ status: "closed" }).eq("id", mk.id);
      }

      const { error: resolveErr } = await admin.rpc("resolve_market", {
        p_market_id: mk.id,
        p_outcome: outcome,
        p_settlement_source: "auto:the-odds-api",
      });
      if (resolveErr) {
        // Fall back to manual review if the auto-resolve fails for any reason.
        await admin
          .from("markets")
          .update({ ready_for_review: true, settlement_source: `suggested:${outcome}` })
          .eq("id", mk.id);
        flagged++;
      } else {
        resolved++;
      }
    }
  }

  return NextResponse.json({ upserted, marketsCreated, flagged, resolved });
}

// Vercel Cron invokes via GET; manual/curl calls may use POST.
export const GET = handle;
export const POST = handle;

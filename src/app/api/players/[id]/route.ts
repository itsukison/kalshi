import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeBadges } from "@/lib/achievements";
import { effectiveStatus } from "@/lib/marketStatus";

export const dynamic = "force-dynamic";

/**
 * GET /api/players/:id — public profile snapshot for the leaderboard player modal.
 *
 * Reads another user's positions/trades, which RLS scopes to the owner, so this
 * runs through the service-role client. Returns only non-sensitive, display-only
 * fields (no email, no auth data).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, username, display_name, points_balance, total_points_earned, total_points_lost, prediction_count, correct_prediction_count, created_at"
    )
    .eq("id", id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "プレイヤーが見つかりません。" }, { status: 404 });
  }

  const balance = Number(profile.points_balance);

  const [{ count: richerCount }, { data: positions }, { data: wins }, { count: tradeCount }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt("points_balance", balance),
      admin
        .from("positions")
        .select(
          "side, contracts, total_cost, created_at, markets(id, question, status, closes_at, resolved_outcome, matches(home_team, away_team, league))"
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("point_ledger")
        .select("amount")
        .eq("user_id", id)
        .eq("type", "settlement_win")
        .order("amount", { ascending: false })
        .limit(1),
      admin
        .from("trades")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id),
    ]);

  const accuracy =
    profile.prediction_count > 0
      ? profile.correct_prediction_count / profile.prediction_count
      : 0;
  const netProfit =
    Number(profile.total_points_earned) - Number(profile.total_points_lost);
  const biggestWin = wins && wins.length > 0 ? Number(wins[0].amount) : 0;

  const bets = (positions ?? []).map((p) => {
    const market = p.markets as unknown as {
      id: string;
      question: string;
      status: string;
      closes_at: string;
      resolved_outcome: string | null;
      matches: { home_team: string; away_team: string; league: string | null } | null;
    } | null;
    const eff = market ? effectiveStatus(market) : null;
    const won = eff === "resolved" && market!.resolved_outcome === p.side;
    let result: "win" | "lose" | "waiting" | "holding";
    if (eff === "resolved") result = won ? "win" : "lose";
    else if (eff === "closed") result = "waiting";
    else result = "holding";

    return {
      side: p.side,
      contracts: Number(p.contracts),
      question: market?.question ?? "—",
      home_team: market?.matches?.home_team ?? null,
      away_team: market?.matches?.away_team ?? null,
      market_id: market?.id ?? null,
      result,
    };
  });

  const badges = computeBadges({
    predictionCount: profile.prediction_count,
    correctCount: profile.correct_prediction_count,
    accuracy,
    balance,
    biggestWin,
    tradeCount: tradeCount ?? 0,
  });

  return NextResponse.json({
    player: {
      id: profile.id,
      name: profile.display_name ?? profile.username ?? "名無しの予測家",
      rank: (richerCount ?? 0) + 1,
      balance,
      accuracy,
      netProfit,
      predictionCount: profile.prediction_count,
      correctCount: profile.correct_prediction_count,
      biggestWin,
      createdAt: profile.created_at,
    },
    bets,
    badges,
  });
}

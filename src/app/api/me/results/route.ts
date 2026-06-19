import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toJapaneseError } from "@/lib/errors";

/**
 * Result feedback for the signed-in user.
 *
 * GET  — markets the user holds a position in that resolved *after* their
 *        `results_seen_at` marker. Each row carries win/loss + payout so the UI
 *        can show "的中 +250pt" / "不的中" without extra lookups.
 * POST — advance the marker (acknowledge). Body: { seenAt: ISO string }. The
 *        write goes through the SECURITY DEFINER `mark_results_seen` RPC because
 *        `profiles` is not directly user-writable.
 */

type MarketRel = {
  id: string;
  question: string;
  resolved_outcome: string | null;
  resolved_at: string | null;
  status: string;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("results_seen_at")
    .eq("id", user.id)
    .single();
  const seenAt = profile?.results_seen_at ? new Date(profile.results_seen_at) : null;

  // Own positions whose market has resolved. RLS scopes positions to the user;
  // markets are publicly readable.
  const { data, error } = await supabase
    .from("positions")
    .select(
      "side, contracts, total_cost, markets!inner(id, question, resolved_outcome, resolved_at, status)"
    )
    .eq("user_id", user.id)
    .eq("markets.status", "resolved");
  if (error) {
    return NextResponse.json(
      { error: toJapaneseError(error, "結果の取得に失敗しました。") },
      { status: 500 }
    );
  }

  const results = (data ?? [])
    .map((row) => {
      const market = row.markets as unknown as MarketRel;
      return { row, market };
    })
    .filter(({ market }) => {
      if (!market?.resolved_at) return false;
      // Only results the user hasn't seen yet.
      return !seenAt || new Date(market.resolved_at) > seenAt;
    })
    .map(({ row, market }) => {
      const won = row.side === market.resolved_outcome;
      const contracts = Number(row.contracts);
      return {
        marketId: market.id,
        question: market.question,
        side: row.side as "YES" | "NO",
        outcome: market.resolved_outcome as "YES" | "NO",
        won,
        payout: won ? Math.round(contracts * 100) : 0,
        staked: Math.round(Number(row.total_cost)),
        resolvedAt: market.resolved_at!,
      };
    })
    .sort((a, b) => +new Date(b.resolvedAt) - +new Date(a.resolvedAt));

  // Cursor = newest resolved_at returned; the client echoes it back on ack so
  // results resolved between this read and the ack are not silently skipped.
  const cursor = results.length > 0 ? results[0].resolvedAt : null;

  return NextResponse.json({ results, cursor });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const seenAt = (body as { seenAt?: string }).seenAt;
  if (!seenAt || Number.isNaN(Date.parse(seenAt))) {
    return NextResponse.json({ error: "seenAt が不正です。" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("mark_results_seen", { p_seen_at: seenAt });
  if (error) {
    return NextResponse.json(
      { error: toJapaneseError(error, "既読の更新に失敗しました。") },
      { status: 400 }
    );
  }
  return NextResponse.json({ results_seen_at: data });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/leaderboard — top 100 by points balance. */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, points_balance, total_points_earned, total_points_lost, prediction_count, correct_prediction_count"
    )
    .order("points_balance", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ranked = (data ?? []).map((p, i) => ({
    rank: i + 1,
    ...p,
    net_profit: Number(p.total_points_earned) - Number(p.total_points_lost),
    accuracy:
      p.prediction_count > 0
        ? p.correct_prediction_count / p.prediction_count
        : 0,
  }));

  return NextResponse.json({ leaderboard: ranked });
}

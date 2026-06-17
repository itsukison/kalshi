import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable, type LeaderRow } from "@/components/LeaderboardTable";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, points_balance, total_points_earned, total_points_lost, prediction_count, correct_prediction_count"
    )
    .order("points_balance", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-3xl mx-auto">
      <p className="bracket text-sm text-ash-gray mb-3">ランキング</p>
      <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight mb-8">
        予測家<span className="text-pulse-green">ランキング</span>
      </h1>
      <LeaderboardTable rows={(data ?? []) as LeaderRow[]} />
    </div>
  );
}
